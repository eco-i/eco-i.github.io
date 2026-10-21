-- ISOLATED CI TEST ONLY: synthetic memo store to verify zero-write behavior
-- for a missing RPC endpoint. Does NOT reproduce production memo SQL/RLS.
\set ON_ERROR_STOP on
BEGIN;
CREATE TABLE public.qa_memo_entries (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 employee_id smallint NOT NULL REFERENCES public.employees(id),
 memo_date date NOT NULL,
 memo_text text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(employee_id,memo_date)
);
COMMIT;
