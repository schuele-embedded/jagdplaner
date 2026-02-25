-- ============================================================
-- JagdPlaner – Migration 002: Hilfsfunktionen
-- Run this after 001_initial_schema.sql
-- ============================================================

-- Lookup user_id by email (needed for client-side member invites)
-- SECURITY DEFINER so the caller doesn't need direct access to auth.users
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = lower(p_email) LIMIT 1;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;
