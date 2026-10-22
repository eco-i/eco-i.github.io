-- QA ONLY: two isolated synthetic tables for genuine browser -> HTTP -> PG commits.
-- This is not the operational backend source and must never be deployed.
\set ON_ERROR_STOP on
BEGIN;
CREATE TABLE public.qa_browser_overtime(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 employee_id smallint NOT NULL REFERENCES public.employees(id),
 work_date date NOT NULL, slot text NOT NULL CHECK(slot IN ('early','late')),
 minutes integer NOT NULL CHECK(minutes BETWEEN 10 AND 1440 AND minutes%10=0),
 completed boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(employee_id,work_date,slot)
);
CREATE TABLE public.qa_browser_fingerprint(
 employee_id smallint NOT NULL REFERENCES public.employees(id),
 record_date date NOT NULL,
 clock_in_photo bytea,clock_in_uploaded_at timestamptz,
 clock_out_photo bytea,clock_out_uploaded_at timestamptz,
 confirmed boolean NOT NULL DEFAULT false,
 confirmed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(employee_id,record_date)
);
CREATE FUNCTION public.qa_browser_overtime_day(
 p_token uuid,p_date date,p_early integer,p_ed boolean,p_late integer,p_ld boolean,p_expected jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
 actor smallint; actual jsonb; v_slot text; v_minutes integer; v_complete boolean;
BEGIN
 actor:=public._session_employee(p_token);
 IF actor<>2 OR public._employee_is_read_only(actor) OR p_date<>DATE '2027-05-13'
   OR p_expected IS NULL OR jsonb_typeof(p_expected)<>'array'
 THEN RAISE EXCEPTION 'QA_OVERTIME_DENIED'; END IF;
 PERFORM pg_advisory_xact_lock(actor::integer,(p_date-DATE '2000-01-01')::integer);
 SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'slot',slot,
 'minutes',minutes,'completed',completed,'updatedAt',updated_at)
 ORDER BY CASE WHEN slot='early' THEN 0 ELSE 1 END),'[]'::jsonb)
 INTO actual FROM public.qa_browser_overtime WHERE employee_id=actor AND work_date=p_date;
 IF actual<>p_expected THEN RAISE EXCEPTION 'STALE_OVERTIME_DAY'; END IF;
 FOREACH v_slot IN ARRAY ARRAY['early','late'] LOOP
   v_minutes:=CASE WHEN v_slot='early' THEN COALESCE(p_early,0) ELSE COALESCE(p_late,0) END;
   v_complete:=CASE WHEN v_slot='early' THEN COALESCE(p_ed,false) ELSE COALESCE(p_ld,false) END;
   IF v_minutes<>0 AND (v_minutes<10 OR v_minutes>1440 OR mod(v_minutes,10)<>0)
   THEN RAISE EXCEPTION 'QA_OVERTIME_BAD_MINUTES'; END IF;
   IF v_minutes=0 THEN
     DELETE FROM public.qa_browser_overtime
     WHERE employee_id=actor AND work_date=p_date AND slot=v_slot;
   ELSE
     INSERT INTO public.qa_browser_overtime(employee_id,work_date,slot,minutes,completed)
     VALUES(actor,p_date,v_slot,v_minutes,v_complete)
     ON CONFLICT(employee_id,work_date,slot) DO UPDATE
     SET minutes=excluded.minutes,completed=excluded.completed,
         updated_at=GREATEST(clock_timestamp(),qa_browser_overtime.updated_at+INTERVAL '1 microsecond')
     WHERE qa_browser_overtime.minutes IS DISTINCT FROM excluded.minutes
        OR qa_browser_overtime.completed IS DISTINCT FROM excluded.completed;
   END IF;
 END LOOP;
 RETURN true;
END $$;

CREATE FUNCTION public.qa_browser_fingerprint_save(
 p_token uuid,p_date date,p_kind text,p_base64 text,p_expected_updated_at timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE actor smallint; stamp timestamptz; existing timestamptz; bytes bytea; was_found boolean;
BEGIN
 actor:=public._session_employee(p_token);
 IF actor<>2 OR public._employee_is_read_only(actor) OR p_date<>DATE '2026-10-21'
 OR p_kind NOT IN ('clock_in','clock_out') OR p_base64 IS NULL OR length(p_base64)>200000
 THEN RAISE EXCEPTION 'QA_FINGERPRINT_DENIED'; END IF;
 SELECT updated_at INTO existing FROM public.qa_browser_fingerprint
 WHERE employee_id=actor AND record_date=p_date FOR UPDATE;
 was_found:=FOUND;
 IF (was_found AND (p_expected_updated_at IS NULL OR existing IS DISTINCT FROM p_expected_updated_at))
 OR (NOT was_found AND p_expected_updated_at IS NOT NULL) THEN
  RAISE EXCEPTION 'STALE_FINGERPRINT';
 END IF;
 BEGIN
 bytes:=decode(p_base64,'base64');
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'QA_INVALID_PHOTO'; END;
 IF octet_length(bytes)<100 OR octet_length(bytes)>131072 OR
    encode(substring(bytes FROM 1 FOR 3),'hex')<>'ffd8ff'
 THEN RAISE EXCEPTION 'QA_INVALID_JPEG'; END IF;
 stamp:=GREATEST(clock_timestamp(),COALESCE(existing+INTERVAL '1 microsecond',clock_timestamp()));
 IF NOT was_found THEN
   INSERT INTO public.qa_browser_fingerprint(employee_id,record_date,updated_at)
   VALUES(actor,p_date,stamp);
 END IF;
 UPDATE public.qa_browser_fingerprint
 SET clock_in_photo=CASE WHEN p_kind='clock_in' THEN bytes ELSE clock_in_photo END,
     clock_in_uploaded_at=CASE WHEN p_kind='clock_in' THEN stamp ELSE clock_in_uploaded_at END,
     clock_out_photo=CASE WHEN p_kind='clock_out' THEN bytes ELSE clock_out_photo END,
     clock_out_uploaded_at=CASE WHEN p_kind='clock_out' THEN stamp ELSE clock_out_uploaded_at END,
     confirmed=false,confirmed_at=NULL,updated_at=stamp
 WHERE employee_id=actor AND record_date=p_date;
END $$;
COMMIT;
