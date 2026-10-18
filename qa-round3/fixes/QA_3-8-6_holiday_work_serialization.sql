-- QA 3-8-6: complement 3-8-5 history guard with shared singleton row locking in both holiday-work write RPCs.
-- QA BRANCH ONLY. DO NOT APPLY TO PRODUCTION. Run transactional regression with BEGIN; ... ROLLBACK.
-- Intended order: holiday writer locks maintenance state FOR SHARE *before* checking current holiday status and inserting.
-- Schedule writer locks same state FOR UPDATE then checks existing work rows, minimizing check-then-insert race.
-- 3-8-5 QA-only correction. Do not apply to main/production without approval.
-- Tested via BEGIN / ROLLBACK for employee history safety and RPC CAS.
-- Refuse any maintenance holiday schedule that would invalidate existing holiday_work_entries rows.
CREATE OR REPLACE FUNCTION public.admin_save_maintenance_schedule(p_token uuid, p_expected_revision bigint, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
 v_actor smallint; v_current public.maintenance_schedule_state%rowtype;
 v_p jsonb; v_o jsonb; v_h jsonb;
 v_from date; v_to date; v_day date; v_other jsonb;
 v_id text; v_group text; v_shift text; v_title text;
 v_period_ids text[]:=array[]::text[]; v_pair_keys text[]:=array[]::text[]; v_holiday_keys text[]:=array[]::text[]; v_excluded_keys text[]:=array[]::text[];
begin
 v_actor:=public._require_admin(p_token);
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_MAINTENANCE_REVISION'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or length(p_data::text)>600000
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if (select count(*) from jsonb_object_keys(p_data))<>4
    or not (p_data ? 'periods' and p_data ? 'overrides' and p_data ? 'holidays' and p_data ? 'excludedHolidays')
    or jsonb_typeof(p_data->'periods')<>'array'
    or jsonb_typeof(p_data->'overrides')<>'array'
    or jsonb_typeof(p_data->'holidays')<>'array'
    or jsonb_typeof(p_data->'excludedHolidays')<>'array'
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if jsonb_array_length(p_data->'periods')>32 or jsonb_array_length(p_data->'overrides')>5000
    or jsonb_array_length(p_data->'holidays')>100
    or jsonb_array_length(p_data->'excludedHolidays')>250
 then raise exception 'MAINTENANCE_LIMIT'; end if;

 for v_p in select value from jsonb_array_elements(p_data->'periods') loop
   if jsonb_typeof(v_p)<>'object'
      or (select count(*) from jsonb_object_keys(v_p))<>4
      or jsonb_typeof(v_p->'id')<>'string'
      or jsonb_typeof(v_p->'label')<>'string'
      or jsonb_typeof(v_p->'start')<>'string'
      or jsonb_typeof(v_p->'end')<>'string'
   then raise exception 'INVALID_MAINTENANCE_PERIOD'; end if;
   v_id:=v_p->>'id';
   if v_id !~ '^[a-zA-Z0-9_-]{1,40}$' or v_id=any(v_period_ids)
      or length(trim(v_p->>'label')) not between 1 and 60
   then raise exception 'INVALID_MAINTENANCE_PERIOD'; end if;
   v_period_ids:=array_append(v_period_ids,v_id);
   if (v_p->>'start') !~ '^20(2[6-9]|3[0-5])-[0-9]{2}-[0-9]{2}$'
      or (v_p->>'end') !~ '^20(2[6-9]|3[0-5])-[0-9]{2}-[0-9]{2}$'
   then raise exception 'INVALID_MAINTENANCE_DATE'; end if;
   begin
     v_from:=(v_p->>'start')::date; v_to:=(v_p->>'end')::date;
   exception when others then raise exception 'INVALID_MAINTENANCE_DATE'; end;
   if to_char(v_from,'YYYY-MM-DD')<>v_p->>'start'
      or to_char(v_to,'YYYY-MM-DD')<>v_p->>'end'
      or v_to<v_from or v_to-v_from>60
      or (v_from<=date '2026-10-15' and v_to>=date '2026-10-01')
   then raise exception 'INVALID_MAINTENANCE_RANGE'; end if;
   for v_other in select value from jsonb_array_elements(p_data->'periods') loop
     if v_other->>'id'=v_id then continue; end if;
     if (v_other->>'start')<=v_p->>'end' and (v_other->>'end')>=v_p->>'start'
     then raise exception 'MAINTENANCE_OVERLAP'; end if;
   end loop;
 end loop;

 for v_o in select value from jsonb_array_elements(p_data->'overrides') loop
   if jsonb_typeof(v_o)<>'object'
      or (select count(*) from jsonb_object_keys(v_o))<>3
      or jsonb_typeof(v_o->'date')<>'string'
      or jsonb_typeof(v_o->'group')<>'string'
      or jsonb_typeof(v_o->'shift')<>'string'
   then raise exception 'INVALID_MAINTENANCE_OVERRIDE'; end if;
   v_group:=v_o->>'group'; v_shift:=v_o->>'shift';
   if v_group not in ('A','B','C','D') or v_shift not in ('주2','주','야','휴','비')
      or (v_o->>'date') !~ '^20(2[6-9]|3[0-5])-[0-9]{2}-[0-9]{2}$'
   then raise exception 'INVALID_MAINTENANCE_OVERRIDE'; end if;
   begin v_day:=(v_o->>'date')::date;
   exception when others then raise exception 'INVALID_MAINTENANCE_OVERRIDE'; end;
   if to_char(v_day,'YYYY-MM-DD')<>v_o->>'date'
      or v_group||':'||v_day::text=any(v_pair_keys)
   then raise exception 'INVALID_MAINTENANCE_OVERRIDE'; end if;
   v_pair_keys:=array_append(v_pair_keys,v_group||':'||v_day::text);
   if not exists (
     select 1 from jsonb_array_elements(p_data->'periods') p
     where v_o->>'date' between p.value->>'start' and p.value->>'end'
   ) then raise exception 'MAINTENANCE_OVERRIDE_OUTSIDE_PERIOD'; end if;
 end loop;

 for v_h in select value from jsonb_array_elements(p_data->'holidays') loop
   if jsonb_typeof(v_h)<>'object'
      or (select count(*) from jsonb_object_keys(v_h))<>2
      or jsonb_typeof(v_h->'date')<>'string'
      or jsonb_typeof(v_h->'title')<>'string'
      or (v_h->>'date') !~ '^20(2[6-9]|3[0-5])-[0-9]{2}-[0-9]{2}$'
      or length(trim(v_h->>'title')) not between 1 and 40
   then raise exception 'INVALID_MAINTENANCE_HOLIDAY'; end if;
   begin v_day:=(v_h->>'date')::date;
   exception when others then raise exception 'INVALID_MAINTENANCE_HOLIDAY'; end;
   if to_char(v_day,'YYYY-MM-DD')<>v_h->>'date'
     or (v_h->>'date')=any(v_holiday_keys)
   then raise exception 'INVALID_MAINTENANCE_HOLIDAY'; end if;
   v_holiday_keys:=array_append(v_holiday_keys,v_h->>'date');
 end loop;


 for v_h in select value from jsonb_array_elements(p_data->'excludedHolidays') loop
   if jsonb_typeof(v_h)<>'string'
      or (v_h #>> '{}') !~ '^20(2[6-9]|3[0-5])-[0-9]{2}-[0-9]{2}$'
   then raise exception 'INVALID_EXCLUDED_HOLIDAY'; end if;
   begin v_day:=(v_h #>> '{}')::date;
   exception when others then raise exception 'INVALID_EXCLUDED_HOLIDAY'; end;
   if to_char(v_day,'YYYY-MM-DD')<>(v_h #>> '{}')
      or (extract(month from v_day)=2 and extract(day from v_day)=12)
      or v_day between date '2026-10-01' and date '2026-10-15'
      or not public._maintenance_predefined_holiday(v_day)
      or (v_h #>> '{}')=any(v_excluded_keys)
      or (v_h #>> '{}')=any(v_holiday_keys)
   then raise exception 'INVALID_EXCLUDED_HOLIDAY'; end if;
   v_excluded_keys:=array_append(v_excluded_keys,(v_h #>> '{}'));
 end loop;

 select * into strict v_current from public.maintenance_schedule_state where id=1 for update;
 if v_current.revision<>p_expected_revision then raise exception 'STALE_MAINTENANCE_SCHEDULE'; end if;
 -- QA 3-8-5: Never reclassify a day with recorded holiday work into a working day.
 -- This protects both predefined-holiday exclusion and removal of a custom holiday.
 -- Existing entries remain untouched; administrator must resolve the conflicting records first.
 if exists(
   select 1
   from public.holiday_work_entries hw
   where extract(isodow from hw.work_date)::int not in (6,7)
     and not (extract(month from hw.work_date)=2 and extract(day from hw.work_date)=12)
     and (
       exists(
         select 1 from jsonb_array_elements_text(p_data->'excludedHolidays') excluded(date_key)
         where excluded.date_key=to_char(hw.work_date,'YYYY-MM-DD')
       )
       or (
         not public._maintenance_predefined_holiday(hw.work_date)
         and not exists(
           select 1 from jsonb_array_elements(p_data->'holidays') h(item)
           where h.item->>'date'=to_char(hw.work_date,'YYYY-MM-DD')
         )
       )
     )
 ) then raise exception 'HOLIDAY_WORK_HISTORY_CONFLICT'; end if;
 update public.maintenance_schedule_state
 set revision=revision+1,data=p_data,updated_at=now(),updated_by=v_actor where id=1;
 insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
 values(v_actor,v_actor,'대정비 근무표 설정',
   '정비기간 '||jsonb_array_length(p_data->'periods')||'건 · 조별 수정 '||
   jsonb_array_length(p_data->'overrides')||'건 · 추가 휴일 '||
   jsonb_array_length(p_data->'holidays')||'건 · 기존 공휴일 제외 '||jsonb_array_length(p_data->'excludedHolidays')||'건 · 변경 전 개정 '||v_current.revision);
 if to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
 return jsonb_build_object('revision',v_current.revision+1,'data',p_data);
end;
$function$;
CREATE OR REPLACE FUNCTION public.admin_save_holiday_work(p_token uuid, p_employee_id smallint, p_date date, p_start_time time without time zone, p_end_time time without time zone)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_actor smallint; v_emp public.employees%rowtype; v_net integer; v_id bigint; v_exists boolean;
begin
  v_actor:=public._require_admin(p_token);
  select * into v_emp from public.employees e where e.id=p_employee_id;
  if v_emp.id is null then raise exception 'INVALID_EMPLOYEE'; end if;
  if v_emp.category not in ('일근(사무)','일근(현장)') then raise exception 'NOT_DAY_EMPLOYEE'; end if;
  if p_date is null or p_date<v_emp.active_from or (v_emp.active_to is not null and p_date>v_emp.active_to) then raise exception 'EMPLOYEE_NOT_ACTIVE'; end if;
  -- Serialize holiday eligibility checks against maintenance holiday reclassification.
  -- Maintenance schedule RPC takes FOR UPDATE on this same singleton row.
  perform 1 from public.maintenance_schedule_state where id=1 for share;
  if not public._is_holiday_work_day(p_date) then raise exception 'NOT_HOLIDAY'; end if;
  v_net:=public._holiday_work_net_minutes(p_start_time,p_end_time);
  select exists(select 1 from public.holiday_work_entries h where h.employee_id=p_employee_id and h.work_date=p_date) into v_exists;
  insert into public.holiday_work_entries(employee_id,work_date,start_time,end_time,net_minutes,created_by)
  values(p_employee_id,p_date,p_start_time,p_end_time,v_net,v_actor)
  on conflict(employee_id,work_date)
  do update set start_time=excluded.start_time,end_time=excluded.end_time,net_minutes=excluded.net_minutes,updated_at=now()
  returning id into v_id;
  insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
  values(v_actor,p_employee_id,case when v_exists then '휴근 수정' else '휴근 등록' end,
    to_char(p_date,'YYYY-MM-DD')||' · '||to_char(p_start_time,'HH24:MI')||'~'||to_char(p_end_time,'HH24:MI')||' · 인정 '||v_net::text||'분');
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.save_my_holiday_work(p_token uuid, p_date date, p_start_time time without time zone, p_end_time time without time zone)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor smallint; v_emp public.employees%rowtype; v_net integer; v_id bigint; v_exists boolean;
begin
  v_actor:=public._session_employee(p_token);
  if public._employee_is_read_only(v_actor) then raise exception 'READ_ONLY_ACCOUNT'; end if;
  select * into v_emp from public.employees e where e.id=v_actor;
  if v_emp.id is null then raise exception 'INVALID_EMPLOYEE'; end if;
  if v_emp.category not in ('일근(사무)','일근(현장)') then raise exception 'NOT_DAY_EMPLOYEE'; end if;
  if p_date is null or p_date<v_emp.active_from or (v_emp.active_to is not null and p_date>v_emp.active_to) then raise exception 'EMPLOYEE_NOT_ACTIVE'; end if;
  -- Serialize holiday eligibility checks against maintenance holiday reclassification.
  -- Maintenance schedule RPC takes FOR UPDATE on this same singleton row.
  perform 1 from public.maintenance_schedule_state where id=1 for share;
  if not public._is_holiday_work_day(p_date) then raise exception 'NOT_HOLIDAY'; end if;

  v_net:=public._holiday_work_net_minutes(p_start_time,p_end_time);
  select exists(select 1 from public.holiday_work_entries h where h.employee_id=v_actor and h.work_date=p_date) into v_exists;

  insert into public.holiday_work_entries(employee_id,work_date,start_time,end_time,net_minutes,created_by)
  values(v_actor,p_date,p_start_time,p_end_time,v_net,v_actor)
  on conflict(employee_id,work_date)
  do update set start_time=excluded.start_time,end_time=excluded.end_time,net_minutes=excluded.net_minutes,updated_at=now()
  returning id into v_id;

  insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
  values(v_actor,v_actor,case when v_exists then '휴근 수정' else '휴근 등록' end,
    to_char(p_date,'YYYY-MM-DD')||' · '||to_char(p_start_time,'HH24:MI')||'~'||to_char(p_end_time,'HH24:MI')||' · 인정 '||v_net::text||'분');

  return v_id;
end;
$function$;
