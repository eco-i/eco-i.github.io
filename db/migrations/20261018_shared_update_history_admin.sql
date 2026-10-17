-- 근무모아 / 업데이트 내역 공유 수정·숨김 (2차 검수 이후 기능)
-- 이 파일은 DB 연결 및 검증 전까지 운영 DB에 미적용 상태입니다.
-- Admin editing uses existing server-side employee session token and the
-- authoritative public._require_admin(uuid) helper (active, non-readonly).
-- New releases remain immutable in the deployed HTML baseline; SQL stores
-- only admin overrides. A deleted version is a shared tombstone.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
BEGIN
  IF to_regprocedure('public._session_employee(uuid)') IS NULL
     OR to_regprocedure('public._require_admin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'REQUIRES_EXISTING_EMPLOYEE_SESSION_AND_ADMIN_HELPERS';
  END IF;
END
$preflight$;

CREATE TABLE IF NOT EXISTS public.site_update_history_overrides (
  version text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1,
  updated_by smallint NOT NULL REFERENCES public.employees(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_update_history_version_check CHECK (version ~ '^ver[0-9]{8}-[0-9]{4}$'),
  CONSTRAINT site_update_history_items_check CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT site_update_history_revision_check CHECK (revision > 0)
);
ALTER TABLE public.site_update_history_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_update_history_overrides FROM PUBLIC, anon, authenticated;

-- Staff can only read overrides through a valid, unexpired in-app session.
-- Table is not directly accessible using the published anon key.
CREATE OR REPLACE FUNCTION public.list_update_history_overrides_v1(p_token uuid)
RETURNS TABLE(version text, items jsonb, deleted boolean, revision bigint)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions
AS $fn$
BEGIN
  PERFORM public._session_employee(p_token);
  RETURN QUERY
    SELECT h.version,h.items,h.deleted,h.revision
    FROM public.site_update_history_overrides h
    ORDER BY h.version DESC;
END
$fn$;

-- Saves modified bullet points OR hides the complete release entry.
-- Server verifies real administrator permissions independent of browser UI.
-- p_expected_revision=0 means a new override, not an overwrite.
-- A mismatch raises STALE_UPDATE_HISTORY to prevent lost updates across admins.
CREATE OR REPLACE FUNCTION public.admin_save_update_history_override_v1(
  p_token uuid,
  p_version text,
  p_items jsonb,
  p_deleted boolean,
  p_expected_revision bigint
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions
AS $fn$
DECLARE
  v_actor smallint;
  v_items jsonb := '[]'::jsonb;
  v_part jsonb;
  v_text text;
  v_revision bigint;
BEGIN
  v_actor := public._require_admin(p_token);

  IF p_version IS NULL OR p_version !~ '^ver[0-9]{8}-[0-9]{4}$' THEN
    RAISE EXCEPTION 'INVALID_UPDATE_HISTORY_VERSION';
  END IF;
  IF p_deleted IS NULL OR p_expected_revision IS NULL OR p_expected_revision < 0 THEN
    RAISE EXCEPTION 'INVALID_UPDATE_HISTORY_REQUEST';
  END IF;

  IF p_deleted = false THEN
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 12 THEN
      RAISE EXCEPTION 'INVALID_UPDATE_HISTORY_ITEMS';
    END IF;
    FOR v_part IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
      IF jsonb_typeof(v_part) <> 'string' THEN
        RAISE EXCEPTION 'INVALID_UPDATE_HISTORY_ITEMS';
      END IF;
      v_text := btrim(v_part #>> '{}');
      IF char_length(v_text) NOT BETWEEN 1 AND 200 THEN
        RAISE EXCEPTION 'INVALID_UPDATE_HISTORY_ITEMS';
      END IF;
      v_items := v_items || jsonb_build_array(v_text);
    END LOOP;
  END IF;

  IF p_expected_revision = 0 THEN
    INSERT INTO public.site_update_history_overrides
      (version,items,deleted,revision,updated_at,updated_by)
    VALUES (p_version,v_items,p_deleted,1,now(),v_actor)
    ON CONFLICT (version) DO NOTHING
    RETURNING revision INTO v_revision;
  ELSE
    UPDATE public.site_update_history_overrides AS h
    SET items=v_items,deleted=p_deleted,
        revision=h.revision+1,updated_at=now(),updated_by=v_actor
    WHERE h.version=p_version AND h.revision=p_expected_revision
    RETURNING h.revision INTO v_revision;
  END IF;
  IF v_revision IS NULL THEN RAISE EXCEPTION 'STALE_UPDATE_HISTORY'; END IF;
END
$fn$;

REVOKE ALL ON FUNCTION public.list_update_history_overrides_v1(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_save_update_history_override_v1(uuid,text,jsonb,boolean,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_update_history_overrides_v1(uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_update_history_override_v1(uuid,text,jsonb,boolean,bigint) TO anon,authenticated;
COMMIT;

-- Acceptance gates BEFORE deploying frontend:
-- 1) Valid staff token lists overrides; invalid token -> SESSION_EXPIRED.
-- 2) Normal employee token sent to admin_save_update_history_override_v1
--    must fail NO_PERMISSION and leave table unchanged.
-- 3) Admin token with no active admin right or a readonly account must fail.
-- 4) Authorized admin can edit, hide; all staff see identical merged output.
-- 5) Stale revision update must fail STALE_UPDATE_HISTORY.
-- 6) No access to underlying table with anon/publishable key.
-- 7) Existing company events, fingerprint, attendance SQL untouched.
