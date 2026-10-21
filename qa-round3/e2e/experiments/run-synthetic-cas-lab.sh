#!/usr/bin/env bash
set -euo pipefail
# Genuine PostgreSQL transactions using *synthetic* rows, never Supabase production.
test "$PGHOST" = "127.0.0.1"
test "$PGDATABASE" = "postgres"
test "$PGUSER" = "postgres"
test -z "$(printenv DATABASE_URL || true)"
test -z "$(printenv SUPABASE_URL || true)"
psql -X -q -v ON_ERROR_STOP=1 -f qa-round3/e2e/experiments/synthetic-postgres-cas-lab.sql
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT

# Stale versions, future-only cancellation, audit atomicity and idempotent toggle.
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
DO $test$
DECLARE rejected boolean:=false;
BEGIN
  BEGIN
    PERFORM qa_rpc_cas_lab.cancel_future_batch(11,999);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_QA_BATCH' THEN RAISE; END IF;
    rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'TEST_NO_STALE_BATCH_REJECTION'; END IF;
END;$test$;
UPDATE qa_rpc_cas_lab.future_batches SET revision=2 WHERE batch_id=11;
DO $test$
DECLARE rejected boolean:=false;
BEGIN
  BEGIN
    PERFORM qa_rpc_cas_lab.cancel_future_batch(11,1);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_QA_BATCH' THEN RAISE; END IF;
    rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'TEST_OLD_BATCH_ACCEPTED'; END IF;
  IF (SELECT batch_status FROM qa_rpc_cas_lab.future_batches WHERE batch_id=11) <> 'active'
    THEN RAISE EXCEPTION 'TEST_BATCH_CHANGED_ON_REJECT'; END IF;
END;$test$;
SELECT qa_rpc_cas_lab.cancel_future_batch(11,2);
INSERT INTO qa_rpc_cas_lab.future_batches VALUES (12,DATE '2020-01-01','active',1);
DO $test$
DECLARE rejected boolean:=false;
BEGIN
  BEGIN
    PERFORM qa_rpc_cas_lab.cancel_future_batch(12,1);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'QA_BATCH_NOT_FUTURE_ACTIVE' THEN RAISE; END IF;
    rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'TEST_PAST_BATCH_ACCEPTED'; END IF;
END;$test$;
SELECT qa_rpc_cas_lab.set_eligibility(101,false,true,1);
DO $test$
DECLARE rejected boolean:=false;
BEGIN
  BEGIN
    PERFORM qa_rpc_cas_lab.set_eligibility(101,true,true,1);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'STALE_QA_ELIGIBILITY' THEN RAISE; END IF;
    rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'TEST_STALE_ELIGIBILITY_ACCEPTED'; END IF;
END;$test$;
SELECT qa_rpc_cas_lab.set_eligibility(101,false,false,2);
DO $test$ BEGIN
  IF (SELECT revision FROM qa_rpc_cas_lab.eligibility WHERE employee_id=101)<>2
    OR (SELECT historic_work_count FROM qa_rpc_cas_lab.eligibility WHERE employee_id=101)<>3
    OR (SELECT count(*) FROM qa_rpc_cas_lab.audit_log WHERE category='eligibility')<>1
    OR (SELECT count(*) FROM qa_rpc_cas_lab.audit_log WHERE category='batch_cancel')<>1
  THEN RAISE EXCEPTION 'TEST_INITIAL_INVARIANTS_FAILED'; END IF;
END;$test$;
SQL

# Rollback must remove both data and audit changes.
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SELECT qa_rpc_cas_lab.set_eligibility(101,true,false,2);
ROLLBACK;
DO $test$ BEGIN
  IF (SELECT enabled FROM qa_rpc_cas_lab.eligibility WHERE employee_id=101)<>false
    OR (SELECT count(*) FROM qa_rpc_cas_lab.audit_log WHERE category='eligibility')<>1
    THEN RAISE EXCEPTION 'TEST_ROLLBACK_FAILED'; END IF;
END;$test$;
UPDATE qa_rpc_cas_lab.eligibility SET enabled=true,revision=1 WHERE employee_id=101;
DELETE FROM qa_rpc_cas_lab.audit_log WHERE category='eligibility';
SQL

# Real concurrent connections: A holds row lock, B submits old expected revision.
psql -X -q -v ON_ERROR_STOP=1 >"$temp_dir/admin-a.log" 2>&1 <<'SQL' &
BEGIN;
SELECT employee_id FROM qa_rpc_cas_lab.eligibility WHERE employee_id=101 FOR UPDATE;
SELECT pg_sleep(3);
SELECT qa_rpc_cas_lab.set_eligibility(101,false,true,1);
COMMIT;
SQL
holder=$!
sleep 1
started=$(date +%s)
if psql -X -q -v ON_ERROR_STOP=1 >"$temp_dir/admin-b.log" 2>&1 <<'SQL'
SELECT qa_rpc_cas_lab.set_eligibility(101,true,true,1);
SQL
then echo 'FAIL: stale concurrent admin B unexpectedly succeeded'; exit 1; fi
ended=$(date +%s)
grep -q 'STALE_QA_ELIGIBILITY' "$temp_dir/admin-b.log" || { echo 'FAIL: missing stale conflict error'; exit 1; }
wait "$holder"
test $((ended-started)) -ge 1 || { echo 'FAIL: no overlapping row-lock wait'; exit 1; }
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
DO $test$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM qa_rpc_cas_lab.eligibility
      WHERE employee_id=101 AND enabled=false AND revision=2 AND historic_work_count=3)
    OR (SELECT count(*) FROM qa_rpc_cas_lab.audit_log WHERE category='eligibility')<>1
  THEN RAISE EXCEPTION 'TEST_TWO_SESSION_CAS_INVARIANT_FAILED'; END IF;
END;$test$;
SQL
echo 'REAL_POSTGRES_SYNTHETIC_CAS_LAB_PASS: row locking, stale rejection, 2 overlapping sessions, rollback'
echo 'NOT_APPLICATION_E2E: independent fake schema/functions only, no Auth/RLS/real RPC implementation'
