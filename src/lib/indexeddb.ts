import { openDB, type IDBPDatabase } from 'idb'
import { supabase } from '@/lib/supabase'
import type { Ansitz, Beobachtung, Ansitzeinrichtung } from '@/types'

// ---- DB Schema -----------------------------------------------------------

const DB_NAME = 'ansitzplaner-db'
const DB_VERSION = 1

export interface SyncOperation {
  id: string
  table: 'ansitze' | 'beobachtungen' | 'ansitzeinrichtungen'
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: Record<string, unknown>
  created_at: string
  retries?: number
}

type AnsitzPlanerDB = {
  ansitze: {
    key: string
    value: Ansitz
    indexes: { revier_id: string }
  }
  beobachtungen: {
    key: string
    value: Beobachtung
    indexes: { ansitz_id: string }
  }
  einrichtungen: {
    key: string
    value: Ansitzeinrichtung
    indexes: { revier_id: string }
  }
  sync_queue: {
    key: string
    value: SyncOperation
  }
}

let dbPromise: Promise<IDBPDatabase<AnsitzPlanerDB>> | null = null

function getDB(): Promise<IDBPDatabase<AnsitzPlanerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AnsitzPlanerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ansitze')) {
          const ansitzeStore = db.createObjectStore('ansitze', { keyPath: 'id' })
          ansitzeStore.createIndex('revier_id', 'revier_id')
        }
        if (!db.objectStoreNames.contains('beobachtungen')) {
          const beobStore = db.createObjectStore('beobachtungen', { keyPath: 'id' })
          beobStore.createIndex('ansitz_id', 'ansitz_id')
        }
        if (!db.objectStoreNames.contains('einrichtungen')) {
          const einrStore = db.createObjectStore('einrichtungen', { keyPath: 'id' })
          einrStore.createIndex('revier_id', 'revier_id')
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// ---- Ansitze -------------------------------------------------------------

export async function saveAnsitz(ansitz: Ansitz): Promise<void> {
  const db = await getDB()
  await db.put('ansitze', ansitz)
}

export async function getAnsitz(id: string): Promise<Ansitz | undefined> {
  const db = await getDB()
  return db.get('ansitze', id)
}

export async function getAllAnsitze(revierId: string): Promise<Ansitz[]> {
  const db = await getDB()
  return db.getAllFromIndex('ansitze', 'revier_id', revierId)
}

export async function deleteAnsitz(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('ansitze', id)
}

// ---- Beobachtungen -------------------------------------------------------

export async function saveBeobachtung(b: Beobachtung): Promise<void> {
  const db = await getDB()
  await db.put('beobachtungen', b)
}

export async function getObservationsForAnsitz(ansitzId: string): Promise<Beobachtung[]> {
  const db = await getDB()
  return db.getAllFromIndex('beobachtungen', 'ansitz_id', ansitzId)
}

// ---- Einrichtungen (read cache) ------------------------------------------

export async function saveEinrichtungen(list: Ansitzeinrichtung[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('einrichtungen', 'readwrite')
  await Promise.all(list.map((e) => tx.store.put(e)))
  await tx.done
}

export async function getEinrichtungen(revierId: string): Promise<Ansitzeinrichtung[]> {
  const db = await getDB()
  return db.getAllFromIndex('einrichtungen', 'revier_id', revierId)
}

// ---- Sync Queue ----------------------------------------------------------

export async function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'created_at'>): Promise<void> {
  const db = await getDB()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await db.put('sync_queue', { ...operation, id, created_at: new Date().toISOString() })
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  const db = await getDB()
  return db.getAll('sync_queue')
}

export async function removeSyncOperation(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sync_queue', id)
}

// ---- Sync ----------------------------------------------------------------

// Repairs legacy queue payloads that Postgres rejects: {lat,lng} positions
// (GEOGRAPHY expects WKT) and the beobachtungen field on ansitze rows
function sanitizePayload(table: string, payload: Record<string, unknown>): Record<string, unknown> {
  const result = { ...payload }
  if (table === 'ansitze') delete result.beobachtungen
  if (table === 'ansitzeinrichtungen' || table === 'beobachtungen') {
    const pos = result.position as { lat?: unknown; lng?: unknown } | null | undefined
    if (pos && typeof pos === 'object' && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
      result.position = `POINT(${pos.lng} ${pos.lat})`
    }
  }
  return result
}

export async function syncPendingOperations(
  onConflict?: (msg: string) => void
): Promise<void> {
  if (!navigator.onLine) return
  const pending = await getPendingSyncOperations()
  if (pending.length === 0) return

  for (const op of pending) {
    try {
      if (op.operation === 'INSERT' || op.operation === 'UPDATE') {
        const { error } = await supabase.from(op.table).upsert(sanitizePayload(op.table, op.payload))
        if (error) throw error
      } else if (op.operation === 'DELETE') {
        const { error } = await supabase.from(op.table).delete().eq('id', op.payload.id)
        if (error) throw error
      }
      await removeSyncOperation(op.id)
    } catch (err) {
      const code = err instanceof Object && 'code' in err ? (err as { code: string }).code : ''
      if (code === '23505') {
        // Last-write-wins: force upsert and notify user
        await supabase.from(op.table).upsert(sanitizePayload(op.table, op.payload))
        await removeSyncOperation(op.id)
        onConflict?.('Daten wurden aktualisiert (Konflikt aufgelöst).')
        continue
      }
      // Permanent errors (FK violation, RLS denied, check constraint):
      // retrying won't help – drop the operation and tell the user
      if (code === '23503' || code === '42501' || code === '23514') {
        await removeSyncOperation(op.id)
        onConflict?.('Eine Offline-Änderung konnte nicht übernommen werden.')
        continue
      }
      // Transient errors: retry up to 5 times, then give up
      const retries = (op.retries ?? 0) + 1
      const db = await getDB()
      if (retries >= 5) {
        await removeSyncOperation(op.id)
        onConflict?.('Eine Offline-Änderung wurde nach mehreren Versuchen verworfen.')
      } else {
        await db.put('sync_queue', { ...op, retries })
      }
    }
  }
}

// ---- Auto-sync on reconnect ----------------------------------------------

export function registerSyncOnReconnect(onConflict?: (msg: string) => void): () => void {
  const handler = () => syncPendingOperations(onConflict)
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
