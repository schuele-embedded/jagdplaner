-- ============================================================
-- JagdPlaner – Initial Schema Migration
-- Run this in the Supabase SQL Editor after creating the project.
-- ============================================================

-- ---- Extensions -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ---- Tabellen ---------------------------------------------------------

-- Reviere
CREATE TABLE IF NOT EXISTS reviere (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  beschreibung  TEXT,
  flaeche_ha    NUMERIC(10, 2),
  grenze_geojson JSONB,
  eigentuemer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ansitzeinrichtungen
CREATE TABLE IF NOT EXISTS ansitzeinrichtungen (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id               UUID NOT NULL REFERENCES reviere(id) ON DELETE CASCADE,
  typ                     TEXT NOT NULL,
  name                    TEXT NOT NULL,
  beschreibung            TEXT,
  position                GEOGRAPHY(POINT, 4326) NOT NULL,
  hoehe_meter             NUMERIC(5, 1),
  ausrichtung_grad        SMALLINT CHECK (ausrichtung_grad BETWEEN 0 AND 359),
  sichtweite_meter        INTEGER,
  zustand                 TEXT NOT NULL DEFAULT 'gut',
  letzte_wartung          DATE,
  naechste_wartung        DATE,
  fotos                   TEXT[] NOT NULL DEFAULT '{}',
  notizen                 TEXT,
  guenstige_windrichtungen TEXT[] NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID NOT NULL REFERENCES auth.users(id)
);

-- Ansitze
CREATE TABLE IF NOT EXISTS ansitze (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id             UUID NOT NULL REFERENCES reviere(id) ON DELETE CASCADE,
  ansitzeinrichtung_id  UUID NOT NULL REFERENCES ansitzeinrichtungen(id) ON DELETE RESTRICT,
  jaeger_id             UUID NOT NULL REFERENCES auth.users(id),
  datum                 DATE NOT NULL,
  beginn                TIMESTAMPTZ NOT NULL,
  ende                  TIMESTAMPTZ,
  bedingungen           JSONB NOT NULL DEFAULT '{}',
  erfolg                BOOLEAN NOT NULL DEFAULT FALSE,
  abschuss              JSONB,
  notizen               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beobachtungen
CREATE TABLE IF NOT EXISTS beobachtungen (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ansitz_id        UUID NOT NULL REFERENCES ansitze(id) ON DELETE CASCADE,
  revier_id        UUID NOT NULL REFERENCES reviere(id) ON DELETE CASCADE,
  wildart          TEXT NOT NULL,
  anzahl           SMALLINT NOT NULL DEFAULT 1 CHECK (anzahl > 0),
  geschlecht       TEXT NOT NULL DEFAULT 'unbekannt',
  verhalten        TEXT NOT NULL,
  position         GEOGRAPHY(POINT, 4326),
  uhrzeit          TIMESTAMPTZ NOT NULL,
  entfernung_meter INTEGER,
  notizen          TEXT,
  fotos            TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revier-Mitglieder
CREATE TABLE IF NOT EXISTS revier_mitglieder (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revier_id       UUID NOT NULL REFERENCES reviere(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle           TEXT NOT NULL DEFAULT 'jaeger',
  berechtigungen  JSONB NOT NULL DEFAULT '{}',
  eingeladen_von  UUID REFERENCES auth.users(id),
  eingeladen_am   TIMESTAMPTZ DEFAULT NOW(),
  aktiv           BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (revier_id, user_id)
);

-- ---- Indizes ----------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_einrichtungen_position
  ON ansitzeinrichtungen USING GIST(position);

CREATE INDEX IF NOT EXISTS idx_beobachtungen_position
  ON beobachtungen USING GIST(position);

CREATE INDEX IF NOT EXISTS idx_ansitze_datum
  ON ansitze(datum, revier_id);

CREATE INDEX IF NOT EXISTS idx_ansitze_jaeger
  ON ansitze(jaeger_id);

CREATE INDEX IF NOT EXISTS idx_mitglieder_user
  ON revier_mitglieder(user_id) WHERE aktiv = TRUE;

-- ---- Row Level Security -----------------------------------------------

ALTER TABLE reviere              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ansitzeinrichtungen  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ansitze              ENABLE ROW LEVEL SECURITY;
ALTER TABLE beobachtungen        ENABLE ROW LEVEL SECURITY;
ALTER TABLE revier_mitglieder    ENABLE ROW LEVEL SECURITY;

-- Helper: check active membership
CREATE OR REPLACE FUNCTION is_revier_member(p_revier_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM revier_mitglieder
    WHERE revier_id = p_revier_id
      AND user_id = auth.uid()
      AND aktiv = TRUE
  );
$$;

-- Helper: check specific permission
CREATE OR REPLACE FUNCTION has_revier_permission(p_revier_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM revier_mitglieder
    WHERE revier_id = p_revier_id
      AND user_id = auth.uid()
      AND aktiv = TRUE
      AND (berechtigungen ->> p_permission)::boolean = TRUE
  );
$$;

-- ---- RLS Policies: reviere --------------------------------------------

CREATE POLICY "reviere_select" ON reviere FOR SELECT
  USING (is_revier_member(id) OR eigentuemer_id = auth.uid());

CREATE POLICY "reviere_insert" ON reviere FOR INSERT
  WITH CHECK (eigentuemer_id = auth.uid());

CREATE POLICY "reviere_update" ON reviere FOR UPDATE
  USING (has_revier_permission(id, 'revier_bearbeiten'));

CREATE POLICY "reviere_delete" ON reviere FOR DELETE
  USING (eigentuemer_id = auth.uid());

-- ---- RLS Policies: ansitzeinrichtungen --------------------------------

CREATE POLICY "einrichtungen_select" ON ansitzeinrichtungen FOR SELECT
  USING (is_revier_member(revier_id));

CREATE POLICY "einrichtungen_insert" ON ansitzeinrichtungen FOR INSERT
  WITH CHECK (has_revier_permission(revier_id, 'einrichtungen_verwalten'));

CREATE POLICY "einrichtungen_update" ON ansitzeinrichtungen FOR UPDATE
  USING (has_revier_permission(revier_id, 'einrichtungen_verwalten'));

CREATE POLICY "einrichtungen_delete" ON ansitzeinrichtungen FOR DELETE
  USING (has_revier_permission(revier_id, 'einrichtungen_verwalten'));

-- ---- RLS Policies: ansitze --------------------------------------------

CREATE POLICY "ansitze_select" ON ansitze FOR SELECT
  USING (is_revier_member(revier_id));

CREATE POLICY "ansitze_insert" ON ansitze FOR INSERT
  WITH CHECK (
    has_revier_permission(revier_id, 'ansitze_erstellen')
    AND jaeger_id = auth.uid()
  );

CREATE POLICY "ansitze_update" ON ansitze FOR UPDATE
  USING (jaeger_id = auth.uid());

CREATE POLICY "ansitze_delete" ON ansitze FOR DELETE
  USING (jaeger_id = auth.uid());

-- ---- RLS Policies: beobachtungen --------------------------------------

CREATE POLICY "beobachtungen_select" ON beobachtungen FOR SELECT
  USING (is_revier_member(revier_id));

CREATE POLICY "beobachtungen_insert" ON beobachtungen FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ansitze a
      WHERE a.id = ansitz_id AND a.jaeger_id = auth.uid()
    )
  );

CREATE POLICY "beobachtungen_update" ON beobachtungen FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ansitze a
      WHERE a.id = ansitz_id AND a.jaeger_id = auth.uid()
    )
  );

CREATE POLICY "beobachtungen_delete" ON beobachtungen FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ansitze a
      WHERE a.id = ansitz_id AND a.jaeger_id = auth.uid()
    )
  );

-- ---- RLS Policies: revier_mitglieder ----------------------------------

CREATE POLICY "mitglieder_select" ON revier_mitglieder FOR SELECT
  USING (is_revier_member(revier_id) OR user_id = auth.uid());

CREATE POLICY "mitglieder_insert" ON revier_mitglieder FOR INSERT
  WITH CHECK (has_revier_permission(revier_id, 'mitglieder_einladen'));

CREATE POLICY "mitglieder_update" ON revier_mitglieder FOR UPDATE
  USING (has_revier_permission(revier_id, 'mitglieder_einladen'));

CREATE POLICY "mitglieder_delete" ON revier_mitglieder FOR DELETE
  USING (has_revier_permission(revier_id, 'mitglieder_einladen'));

-- ---- Eigentuemer wird automatisch Mitglied ----------------------------

CREATE OR REPLACE FUNCTION auto_add_eigentuemer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO revier_mitglieder (
    revier_id,
    user_id,
    rolle,
    berechtigungen,
    eingeladen_von,
    aktiv
  ) VALUES (
    NEW.id,
    NEW.eigentuemer_id,
    'eigentuemer',
    '{"ansitze_erstellen":true,"einrichtungen_verwalten":true,"mitglieder_einladen":true,"statistiken_sehen":true,"revier_bearbeiten":true}',
    NULL,
    TRUE
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_add_eigentuemer
  AFTER INSERT ON reviere
  FOR EACH ROW EXECUTE FUNCTION auto_add_eigentuemer();
