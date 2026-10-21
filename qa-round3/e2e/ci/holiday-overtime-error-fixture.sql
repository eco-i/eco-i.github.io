-- Disposable PostgreSQL-only sentinel: this is NOT production overtime schema.
\set ON_ERROR_STOP on
BEGIN;
CREATE TABLE public.qa_overtime_failed_write_sentinel (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id smallint REFERENCES public.employees(id),
  work_date date,
  minutes integer
);
COMMIT;
