import type { GpsPosition } from '@/types'

// PostgREST expects WKT for GEOGRAPHY columns; {lat,lng} objects are rejected
export function toWkt(pos: GpsPosition): string {
  return `POINT(${pos.lng} ${pos.lat})`
}

/**
 * Normalizes a position value to GpsPosition. Handles:
 * - {lat,lng} objects (local cache / optimistic state)
 * - WKB hex strings (what PostgREST returns for GEOGRAPHY columns)
 * - GeoJSON Points and WKT strings (defensive)
 */
export function parsePosition(value: unknown): GpsPosition | null {
  if (value == null) return null
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.lat === 'number' && typeof v.lng === 'number') {
      return { lat: v.lat, lng: v.lng }
    }
    if (v.type === 'Point' && Array.isArray(v.coordinates)) {
      const [lng, lat] = v.coordinates as number[]
      if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
    }
    return null
  }
  if (typeof value === 'string') {
    const wkt = value.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i)
    if (wkt) return { lat: parseFloat(wkt[2]), lng: parseFloat(wkt[1]) }
    if (/^[0-9A-Fa-f]{34,}$/.test(value)) return parseWkbHex(value)
  }
  return null
}

// (E)WKB point: byte order(1B) + type(4B) [+ SRID(4B) bei EWKB] + x(8B) + y(8B)
function parseWkbHex(hex: string): GpsPosition | null {
  try {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    const view = new DataView(bytes.buffer)
    const littleEndian = bytes[0] === 1
    const type = view.getUint32(1, littleEndian)
    if ((type & 0xff) !== 1) return null // not a POINT
    const offset = type & 0x20000000 ? 9 : 5 // skip SRID for EWKB
    const lng = view.getFloat64(offset, littleEndian)
    const lat = view.getFloat64(offset + 8, littleEndian)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}
