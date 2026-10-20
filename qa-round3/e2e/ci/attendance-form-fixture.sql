-- TEST FIXTURE ONLY. This is not the missing production attendance SQL.
-- Executed ONLY in disposable, loopback PostgreSQL on qa-3-8 Actions runner.
\set ON_ERROR_STOP on
BEGIN;
CREATE TABLE public.qa_attendance_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id smallint NOT NULL REFERENCES public.employees(id),
  attendance_type text NOT NULL,
  start_date date NOT NULL, end_date date NOT NULL,
  absence_mode text NOT NULL CHECK(absence_mode in ('all_day','time')),
  start_time time, end_time time,
  annual_leave_deduct boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- A minimal test replacement for a missing legacy production RPC.
-- Caller, field, day and full-day checks intentionally fail closed.
-- Use SECURITY INVOKER: this function does not represent production RLS.
CREATE FUNCTION public.save_attendance_personnel_v2(
 p_token uuid,p_id bigint,p_employee_id smallint,p_attendance_type text,
 p_start_date date,p_end_date date,p_absence_mode text,
 p_start_time time,p_end_time time,p_expected jsonb
) RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
 actor smallint;
 new_id bigint;
BEGIN
 actor := public._session_employee(p_token);
 IF actor IS DISTINCT FROM p_employee_id OR public._employee_is_read_only(actor) THEN
   RAISE EXCEPTION 'QA_ATTENDANCE_NOT_OWNED';
 END IF;
 IF p_id IS NOT NULL OR p_expected IS NOT NULL THEN
   RAISE EXCEPTION 'QA_CREATE_ONLY';
 END IF;
 IF p_attendance_type IS DISTINCT FROM '연가'
    OR p_start_date IS DISTINCT FROM date '2027-05-13'
    OR p_end_date IS DISTINCT FROM date '2027-05-13'
    OR p_absence_mode IS DISTINCT FROM 'all_day'
    OR p_start_time IS NOT NULL OR p_end_time IS NOT NULL
 THEN RAISE EXCEPTION 'QA_ATTENDANCE_BAD_FIELDS'; END IF;
 IF EXISTS (SELECT 1 FROM public.qa_attendance_entries
            WHERE employee_id=actor AND start_date=p_start_date)
 THEN RAISE EXCEPTION 'QA_ATTENDANCE_ALREADY_EXISTS'; END IF;
 INSERT INTO public.qa_attendance_entries (
   employee_id,attendance_type,start_date,end_date,absence_mode,
   start_time,end_time,annual_leave_deduct
 ) VALUES (actor,p_attendance_type,p_start_date,p_end_date,p_absence_mode,NULL,NULL,false)
 RETURNING id INTO new_id;
 RETURN new_id;
END $$;
COMMIT;
