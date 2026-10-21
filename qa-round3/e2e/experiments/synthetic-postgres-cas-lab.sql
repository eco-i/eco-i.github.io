-- Public, synthetic-only QA experiment. Never run against a Supabase project.
-- This models explicit caller-supplied expected-state + DB row locking for 2 unresolved RPC contracts.
-- It does NOT implement original functions, authentication, RLS, PIN, or operational schema.
BEGIN;
CREATE SCHEMA qa_rpc_cas_lab;
CREATE TABLE qa_rpc_cas_lab.future_batches (
  batch_id bigint PRIMARY KEY,
  effective_date date NOT NULL,
  batch_status text NOT NULL CHECK (batch_status IN ('active','cancelled')),
  revision bigint NOT NULL CHECK (revision > 0)
);
CREATE TABLE qa_rpc_cas_lab.eligibility (
  employee_id bigint PRIMARY KEY,
  enabled boolean NOT NULL,
  revision bigint NOT NULL CHECK (revision > 0),
  historic_work_count integer NOT NULL CHECK (historic_work_count >= 0)
);
CREATE TABLE qa_rpc_cas_lab.audit_log (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category text NOT NULL,
  target_id bigint NOT NULL,
  from_revision bigint NOT NULL,
  to_revision bigint NOT NULL
);

-- Lab-only name deliberately different from live RPC name.
-- A caller supplies the version of the item the administrator actually saw.
-- This input DOES NOT EXIST in the current production UI call and requires an approved API change.
CREATE FUNCTION qa_rpc_cas_lab.cancel_future_batch(
  p_batch_id bigint, p_expected_revision bigint
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE previous_revision bigint; previous_status text; previous_date date;
BEGIN
  SELECT b.revision,b.batch_status,b.effective_date
    INTO previous_revision,previous_status,previous_date
    FROM qa_rpc_cas_lab.future_batches AS b
    WHERE b.batch_id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QA_BATCH_NOT_FOUND'; END IF;
  IF p_expected_revision IS NULL OR previous_revision <> p_expected_revision
    THEN RAISE EXCEPTION 'STALE_QA_BATCH'; END IF;
  IF previous_status <> 'active' OR previous_date <= CURRENT_DATE
    THEN RAISE EXCEPTION 'QA_BATCH_NOT_FUTURE_ACTIVE'; END IF;
  UPDATE qa_rpc_cas_lab.future_batches
    SET batch_status='cancelled',revision=revision+1 WHERE batch_id=p_batch_id;
  INSERT INTO qa_rpc_cas_lab.audit_log(category,target_id,from_revision,to_revision)
    VALUES ('batch_cancel',p_batch_id,previous_revision,previous_revision+1);
  RETURN true;
END;$$;

CREATE FUNCTION qa_rpc_cas_lab.set_eligibility(
  p_employee_id bigint,p_enabled boolean,p_expected_enabled boolean,p_expected_revision bigint
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE previous_revision bigint; previous_enabled boolean;
BEGIN
  SELECT e.revision,e.enabled
    INTO previous_revision,previous_enabled
    FROM qa_rpc_cas_lab.eligibility AS e
    WHERE e.employee_id=p_employee_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QA_EMPLOYEE_NOT_FOUND'; END IF;
  IF p_enabled IS NULL OR p_expected_enabled IS NULL OR p_expected_revision IS NULL OR
      previous_revision<>p_expected_revision OR previous_enabled IS DISTINCT FROM p_expected_enabled
    THEN RAISE EXCEPTION 'STALE_QA_ELIGIBILITY'; END IF;
  -- Explicitly treat same-value submit as idempotent: no revision or audit increment.
  IF previous_enabled IS NOT DISTINCT FROM p_enabled THEN RETURN true; END IF;
  UPDATE qa_rpc_cas_lab.eligibility SET enabled=p_enabled,revision=revision+1
    WHERE employee_id=p_employee_id;
  INSERT INTO qa_rpc_cas_lab.audit_log(category,target_id,from_revision,to_revision)
    VALUES ('eligibility',p_employee_id,previous_revision,previous_revision+1);
  RETURN true;
END;$$;

INSERT INTO qa_rpc_cas_lab.future_batches VALUES (11,DATE '2099-04-14','active',1);
INSERT INTO qa_rpc_cas_lab.eligibility VALUES (101,true,1,3);
COMMIT;
