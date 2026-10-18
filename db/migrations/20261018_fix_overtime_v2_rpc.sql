-- Repair missing optimistic-concurrency overtime RPCs used by index.html.
-- Existing server v1 methods remain the sole mutation/audit writers.
-- Same per-employee/date advisory lock serializes snapshot comparison and mutation.
create or replace function public.save_my_overtime_day_v2(
 p_token uuid, p_work_date date, p_early_minutes integer, p_early_completed boolean,
 p_late_minutes integer, p_late_completed boolean, p_expected jsonb
) returns boolean
language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare
 v_actor smallint;
 v_total integer;
 v_item jsonb;
 v_row public.overtime_entries%rowtype;
 v_seen bigint[] := array[]::bigint[];
 v_id bigint;
begin
 v_actor := public._session_employee(p_token);
 perform public._personnel_assert_actor_writable(v_actor);
 if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2027-12-31'
 then raise exception 'OVERTIME_DATE_OUT_OF_RANGE'; end if;
 if not public._personnel_operational_on(v_actor,p_work_date)
 then raise exception 'PERSONNEL_DATE_OUTSIDE_ASSIGNMENT'; end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array'
 then raise exception 'INVALID_OVERTIME_DAY_EXPECTED'; end if;

 perform pg_advisory_xact_lock(v_actor::integer,(p_work_date-date '2000-01-01')::integer);
 select count(*) into v_total from public.overtime_entries
 where employee_id=v_actor and work_date=p_work_date;
 if jsonb_array_length(p_expected)<>v_total
 then raise exception 'STALE_OVERTIME_DAY'; end if;

 for v_item in select value from jsonb_array_elements(p_expected) loop
   if jsonb_typeof(v_item)<>'object'
      or jsonb_typeof(v_item->'id')<>'number'
      or jsonb_typeof(v_item->'slot')<>'string'
      or jsonb_typeof(v_item->'minutes')<>'number'
      or jsonb_typeof(v_item->'completed')<>'boolean'
      or jsonb_typeof(v_item->'updatedAt')<>'string'
   then raise exception 'INVALID_OVERTIME_DAY_EXPECTED'; end if;
   v_id:=(v_item->>'id')::bigint;
   if v_id=any(v_seen) then raise exception 'STALE_OVERTIME_DAY'; end if;
   v_seen:=array_append(v_seen,v_id);
   select * into v_row from public.overtime_entries
    where id=v_id and employee_id=v_actor and work_date=p_work_date for update;
   if not found then raise exception 'STALE_OVERTIME_DAY'; end if;
   if v_row.slot is distinct from (v_item->>'slot')
      or v_row.minutes is distinct from (v_item->>'minutes')::integer
      or v_row.completed is distinct from (v_item->>'completed')::boolean
      or v_row.updated_at is distinct from (v_item->>'updatedAt')::timestamptz
   then raise exception 'STALE_OVERTIME_DAY'; end if;
 end loop;

 return public.save_my_overtime_day(
   p_token,p_work_date,p_early_minutes,p_early_completed,p_late_minutes,p_late_completed
 );
end;
$fn$;

create or replace function public.save_my_overtime_entry_v2(
 p_token uuid, p_work_date date, p_slot text, p_minutes integer,
 p_completed boolean, p_expected jsonb
) returns bigint
language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare
 v_actor smallint;
 v_row public.overtime_entries%rowtype;
begin
 v_actor := public._session_employee(p_token);
 perform public._personnel_assert_actor_writable(v_actor);
 if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2027-12-31'
 then raise exception 'OVERTIME_DATE_OUT_OF_RANGE'; end if;
 if not public._personnel_operational_on(v_actor,p_work_date)
 then raise exception 'PERSONNEL_DATE_OUTSIDE_ASSIGNMENT'; end if;
 if p_slot not in ('early','late') or p_slot is null
 then raise exception 'INVALID_OVERTIME_SLOT'; end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'object'
    or jsonb_typeof(p_expected->'id')<>'number'
    or jsonb_typeof(p_expected->'employeeId')<>'number'
    or jsonb_typeof(p_expected->'date')<>'string'
    or jsonb_typeof(p_expected->'slot')<>'string'
    or jsonb_typeof(p_expected->'minutes')<>'number'
    or jsonb_typeof(p_expected->'completed')<>'boolean'
    or jsonb_typeof(p_expected->'updatedAt')<>'string'
 then raise exception 'INVALID_OVERTIME_ENTRY_EXPECTED'; end if;

 perform pg_advisory_xact_lock(v_actor::integer,(p_work_date-date '2000-01-01')::integer);
 select * into v_row from public.overtime_entries
  where id=(p_expected->>'id')::bigint
    and employee_id=v_actor and work_date=p_work_date and slot=p_slot for update;
 if not found then raise exception 'STALE_OVERTIME_ENTRY'; end if;
 if v_row.employee_id is distinct from (p_expected->>'employeeId')::smallint
    or v_row.work_date is distinct from (p_expected->>'date')::date
    or v_row.slot is distinct from (p_expected->>'slot')
    or v_row.minutes is distinct from (p_expected->>'minutes')::integer
    or v_row.completed is distinct from (p_expected->>'completed')::boolean
    or v_row.updated_at is distinct from (p_expected->>'updatedAt')::timestamptz
 then raise exception 'STALE_OVERTIME_ENTRY'; end if;

 return public.save_my_overtime_entry(p_token,p_work_date,p_slot,p_minutes,p_completed);
end;
$fn$;

revoke all on function public.save_my_overtime_day_v2(uuid,date,integer,boolean,integer,boolean,jsonb) from public;
revoke all on function public.save_my_overtime_entry_v2(uuid,date,text,integer,boolean,jsonb) from public;
grant execute on function public.save_my_overtime_day_v2(uuid,date,integer,boolean,integer,boolean,jsonb) to anon, authenticated;
grant execute on function public.save_my_overtime_entry_v2(uuid,date,text,integer,boolean,jsonb) to anon, authenticated;
