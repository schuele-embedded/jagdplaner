-- ============================================================
-- AnsitzPlaner – Migration 003: Mitglieder-Profile
-- Run this after 002_helper_functions.sql in the Supabase SQL Editor.
-- ============================================================

-- Name/E-Mail der Reviermitglieder für die Mitgliederverwaltung.
-- SECURITY DEFINER so the caller doesn't need direct access to auth.users;
-- guarded by is_revier_member() so only members can read profiles.
CREATE OR REPLACE FUNCTION get_revier_member_profiles(p_revier_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, email TEXT)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT u.id, u.raw_user_meta_data ->> 'name', u.email::TEXT
  FROM revier_mitglieder m
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.revier_id = p_revier_id
    AND is_revier_member(p_revier_id);
$$;

REVOKE ALL ON FUNCTION get_revier_member_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_revier_member_profiles(UUID) TO authenticated;
