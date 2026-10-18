-- 2026~2035 ceiling expansion. Install 2028-2035 future_holiday_calendar first.
-- Existing records and 2026~2027 configured holidays stay untouched.
-- Preserve original month/date validations, extend upper bound to 2035.
alter table public.holiday_work_month_confirmations
 drop constraint holiday_work_month_confirmations_month_ck,
 add constraint holiday_work_month_confirmations_month_ck check (
   month_start=date_trunc('month',month_start::timestamptz)::date and month_start>=date '2026-01-01' and month_start<=date '2035-12-01'
 );
alter table public.overtime_entries
 drop constraint overtime_entries_date_ck,
 add constraint overtime_entries_date_ck check (work_date>=date '2026-01-01' and work_date<=date '2035-12-31');

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public._data_restore_admin_section(p_actor smallint, p_section text, p_value jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  r jsonb;
  n integer:=0;
  v_settings jsonb;
  v_exclusions jsonb;
  v_start date;
  v_end date;
  v_hire date;
  v_prev integer;
  v_band text;
  v_year integer;
  v_base integer;
  v_grant integer;
  v_carry integer;
  v_overtime_emp smallint;
  v_overtime_date date;
  v_overtime_minutes integer;
  v_overtime_slot text;
  v_overtime_completed boolean;
  v_confirmed_by smallint;
  v_confirmed_at timestamptz;
begin
  case p_section
    when 'attendance' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.attendance_entries;
      for r in select value from jsonb_array_elements(p_value) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        if nullif(btrim(coalesce(r->>'attendance_type','')),'') is null then raise exception 'TYPE_REQUIRED'; end if;
        begin v_start:=nullif(r->>'start_date','')::date; v_end:=nullif(r->>'end_date','')::date; exception when others then raise exception 'INVALID_DATE'; end;
        if v_start is null or v_end is null or v_end<v_start or (v_end-v_start)>800 then raise exception 'INVALID_DATE'; end if;
        if not public._personnel_operational_range((r->>'employee_id')::smallint,v_start,v_end) then raise exception 'PERSONNEL_DATE_OUTSIDE_ASSIGNMENT'; end if;
        if coalesce(r->>'absence_mode','') not in ('all_day','time') then raise exception 'INVALID_ABSENCE_MODE'; end if;
        if (r->>'absence_mode')='time' and (nullif(r->>'start_time','') is null or nullif(r->>'end_time','') is null) then raise exception 'INVALID_TIME'; end if;
        if r ? 'annual_leave_deduct' and r->'annual_leave_deduct' <> 'null'::jsonb and jsonb_typeof(r->'annual_leave_deduct')<>'boolean' then raise exception 'INVALID_ANNUAL_LEAVE_DEDUCT'; end if;
        if nullif(r->>'created_by','') is not null and not exists(select 1 from public.employees where id=(r->>'created_by')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'created_by'; end if;
        insert into public.attendance_entries(employee_id,attendance_type,start_date,end_date,absence_mode,start_time,end_time,annual_leave_deduct,created_by,updated_at)
        values((r->>'employee_id')::smallint,btrim(r->>'attendance_type'),v_start,v_end,r->>'absence_mode',
               case when (r->>'absence_mode')='time' then nullif(r->>'start_time','')::time end,
               case when (r->>'absence_mode')='time' then nullif(r->>'end_time','')::time end,
               case when r ? 'annual_leave_deduct' then (r->>'annual_leave_deduct')::boolean else null end,
               nullif(r->>'created_by','')::smallint,now());
        n:=n+1;
      end loop;
    when 'holiday_work' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.holiday_work_entries;
      for r in select value from jsonb_array_elements(p_value) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        begin v_start:=nullif(r->>'work_date','')::date; exception when others then raise exception 'INVALID_WORK_DATE'; end;
        if v_start is null or not public._personnel_is_holiday(v_start) then raise exception 'INVALID_WORK_DATE'; end if;
        if not public._personnel_operational_on((r->>'employee_id')::smallint,v_start) or not public._personnel_is_day_worker_on((r->>'employee_id')::smallint,v_start) then raise exception 'NOT_DAY_EMPLOYEE'; end if;
        if nullif(r->>'start_time','') is null or nullif(r->>'end_time','') is null then raise exception 'INVALID_TIME'; end if;
        if nullif(r->>'created_by','') is not null and not exists(select 1 from public.employees where id=(r->>'created_by')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'created_by'; end if;
        insert into public.holiday_work_entries(employee_id,work_date,start_time,end_time,net_minutes,created_by,updated_at)
        values((r->>'employee_id')::smallint,v_start,(r->>'start_time')::time,(r->>'end_time')::time,
               public._personnel_holiday_net_minutes((r->>'start_time')::time,(r->>'end_time')::time),
               nullif(r->>'created_by','')::smallint,now());
        n:=n+1;
      end loop;
    when 'personal_memos' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.personal_memos;
      for r in select value from jsonb_array_elements(p_value) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        begin v_start:=nullif(r->>'memo_date','')::date; exception when others then raise exception 'INVALID_MEMO_DATE'; end;
        if v_start is null then raise exception 'INVALID_MEMO_DATE'; end if;
        if not public._personnel_operational_on((r->>'employee_id')::smallint,v_start) then raise exception 'MEMO_DATE_OUTSIDE_EMPLOYMENT'; end if;
        if char_length(coalesce(r->>'memo_text',''))>1000 then raise exception 'MEMO_TOO_LONG'; end if;
        if r ? 'dday_selected' and r->'dday_selected' <> 'null'::jsonb and jsonb_typeof(r->'dday_selected')<>'boolean' then raise exception 'INVALID_DDAY_SELECTED'; end if;
        insert into public.personal_memos(employee_id,memo_date,memo_text,updated_at)
        values((r->>'employee_id')::smallint,v_start,coalesce(r->>'memo_text',''),now());
        if coalesce((r->>'dday_selected')::boolean,false) then
          insert into public.memo_dday_selections(employee_id,memo_date,selected_at) values((r->>'employee_id')::smallint,v_start,now());
        end if;
        n:=n+1;
      end loop;
    when 'annual_leave_settings' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.annual_leave_settings;
      for r in select value from jsonb_array_elements(p_value) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        begin
          v_year:=nullif(r->>'leave_year','')::integer;
          v_base:=nullif(r->>'baseline_remaining_minutes','')::integer;
          v_grant:=nullif(r->>'granted_minutes','')::integer;
          v_carry:=nullif(r->>'carryover_minutes','')::integer;
        exception when others then raise exception 'INVALID_LEAVE_SETTING'; end;
        if v_year is null or v_year<2000 or v_year>2200 then raise exception 'INVALID_LEAVE_YEAR'; end if;
        if coalesce(v_base,0)<0 or coalesce(v_grant,0)<0 or coalesce(v_carry,0)<0 then raise exception 'INVALID_LEAVE_MINUTES'; end if;
        if (v_year=2026 and v_base is null) or (v_year<>2026 and (v_grant is null or v_carry is null)) then raise exception 'INVALID_LEAVE_SETTING'; end if;
        insert into public.annual_leave_settings(employee_id,leave_year,baseline_remaining_minutes,granted_minutes,carryover_minutes,updated_at)
        values((r->>'employee_id')::smallint,v_year,v_base,v_grant,v_carry,now());
        n:=n+1;
      end loop;
    when 'long_service' then
      if jsonb_typeof(p_value)<>'object' then raise exception 'INVALID_SECTION_DATA:long_service'; end if;
      v_settings:=coalesce(p_value->'settings','[]'::jsonb); v_exclusions:=coalesce(p_value->'exclusions','[]'::jsonb);
      perform public._data_assert_array_section(v_settings,'long_service.settings'); perform public._data_assert_array_section(v_exclusions,'long_service.exclusions');
      delete from public.long_service_exclusions; delete from public.long_service_settings;
      for r in select value from jsonb_array_elements(v_settings) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        begin v_hire:=nullif(r->>'hire_date','')::date; v_prev:=coalesce(nullif(r->>'previous_used_minutes','')::integer,0); exception when others then raise exception 'INVALID_HIRE_DATE'; end;
        v_band:=coalesce(r->>'previous_used_band','');
        if v_hire is null or v_hire>public._personnel_today() then raise exception 'INVALID_HIRE_DATE'; end if;
        if v_prev<0 then raise exception 'INVALID_PREVIOUS_USED'; end if;
        if v_band not in ('','1-5','5-10','10-20','20-30','30+') then raise exception 'INVALID_SERVICE_BAND'; end if;
        insert into public.long_service_settings(employee_id,hire_date,previous_used_minutes,previous_used_band,updated_at)
        values((r->>'employee_id')::smallint,v_hire,v_prev,v_band,now());
        n:=n+1;
      end loop;
      for r in select value from jsonb_array_elements(v_exclusions) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        begin v_start:=nullif(r->>'start_date','')::date; v_end:=nullif(r->>'end_date','')::date; exception when others then raise exception 'INVALID_LONG_SERVICE_EXCLUSION'; end;
        select hire_date into v_hire from public.long_service_settings where employee_id=(r->>'employee_id')::smallint;
        if v_start is null or v_end is null or v_end<v_start then raise exception 'INVALID_LONG_SERVICE_EXCLUSION'; end if;
        if v_hire is null or v_start<v_hire then raise exception 'EXCLUSION_BEFORE_HIRE'; end if;
        if char_length(coalesce(r->>'reason',''))>80 then raise exception 'INVALID_LONG_SERVICE_EXCLUSION'; end if;
        insert into public.long_service_exclusions(employee_id,start_date,end_date,reason,updated_at)
        values((r->>'employee_id')::smallint,v_start,v_end,coalesce(r->>'reason',''),now());
        n:=n+1;
      end loop;
    when 'company_events' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.company_events;
      for r in select value from jsonb_array_elements(p_value) loop
        begin v_start:=nullif(r->>'start_date','')::date; v_end:=nullif(r->>'end_date','')::date; exception when others then raise exception 'INVALID_DATE'; end;
        if v_start is null or v_end is null or v_end<v_start then raise exception 'INVALID_DATE'; end if;
        if nullif(btrim(coalesce(r->>'memo_text','')),'') is null or char_length(coalesce(r->>'memo_text',''))>1000 then raise exception 'INVALID_COMPANY_EVENT'; end if;
        if nullif(r->>'created_by','') is not null and not exists(select 1 from public.employees where id=(r->>'created_by')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'created_by'; end if;
        insert into public.company_events(event_date,end_date,memo_text,created_by,updated_at)
        values(v_start,v_end,coalesce(r->>'memo_text',''),nullif(r->>'created_by','')::smallint,now());
        n:=n+1;
      end loop;
    when 'holiday_work_eligibility' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.holiday_work_eligibility;
      for r in select value from jsonb_array_elements(p_value) loop
        if not exists(select 1 from public.employees where id=nullif(r->>'employee_id','')::smallint) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',r->>'employee_id'; end if;
        if not (r ? 'enabled') or jsonb_typeof(r->'enabled')<>'boolean' then raise exception 'INVALID_HOLIDAY_WORK_ELIGIBILITY'; end if;
        insert into public.holiday_work_eligibility(employee_id,enabled) values((r->>'employee_id')::smallint,(r->>'enabled')::boolean);
        n:=n+1;
      end loop;
    when 'overtime' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.overtime_entries;
      for r in select value from jsonb_array_elements(p_value) loop
        begin
          v_overtime_emp:=nullif(r->>'employee_id','')::smallint;
          v_overtime_date:=nullif(r->>'work_date','')::date;
          v_overtime_minutes:=nullif(r->>'minutes','')::integer;
          v_overtime_slot:=coalesce(r->>'slot','');
          if r ? 'completed' and r->'completed' <> 'null'::jsonb and jsonb_typeof(r->'completed')<>'boolean' then raise exception 'INVALID_OVERTIME_BACKUP'; end if;
          v_overtime_completed:=coalesce((r->>'completed')::boolean,false);
        exception when others then raise exception 'INVALID_OVERTIME_BACKUP'; end;
        if v_overtime_emp is null or not exists(select 1 from public.employees where id=v_overtime_emp) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',coalesce(v_overtime_emp::text,'NULL'); end if;
        if v_overtime_date is null or not public._personnel_operational_on(v_overtime_emp,v_overtime_date) then raise exception 'INVALID_OVERTIME_BACKUP'; end if;
        if v_overtime_slot not in ('early','late') or v_overtime_minutes is null or v_overtime_minutes<10 or v_overtime_minutes>1440 or mod(v_overtime_minutes,10)<>0 then raise exception 'INVALID_OVERTIME_BACKUP'; end if;
        insert into public.overtime_entries(employee_id,work_date,slot,minutes,completed,updated_at)
        values(v_overtime_emp,v_overtime_date,v_overtime_slot,v_overtime_minutes,v_overtime_completed,now());
        n:=n+1;
      end loop;
    when 'holiday_work_month_confirmation' then
      perform public._data_assert_array_section(p_value,p_section);
      delete from public.holiday_work_month_confirmations;
      for r in select value from jsonb_array_elements(p_value) loop
        begin
          v_overtime_date:=nullif(r->>'month_start','')::date;
          v_confirmed_by:=nullif(r->>'confirmed_by','')::smallint;
          v_confirmed_at:=coalesce(nullif(r->>'confirmed_at','')::timestamptz,now());
        exception when others then raise exception 'INVALID_HOLIDAY_WORK_CONFIRMATION_BACKUP'; end;
        if v_overtime_date is null or v_overtime_date<date '2026-01-01' or v_overtime_date>date '2035-12-01' or v_overtime_date<>date_trunc('month',v_overtime_date)::date then raise exception 'INVALID_HOLIDAY_WORK_CONFIRMATION_BACKUP'; end if;
        if v_confirmed_by is null or not exists(select 1 from public.employees where id=v_confirmed_by) then raise exception 'PERSONNEL_EMPLOYEE_MISSING:%',coalesce(v_confirmed_by::text,'NULL'); end if;
        insert into public.holiday_work_month_confirmations(month_start,confirmed_by,confirmed_at)
        values(v_overtime_date,v_confirmed_by,v_confirmed_at);
        n:=n+1;
      end loop;
    when 'personnel' then return public._data_restore_personnel(p_actor,p_value);
    else raise exception 'INVALID_ADMIN_SECTION:%',p_section;
  end case;
  return n;
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public._is_holiday_work_day(p_date date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select p_date is not null and (
    extract(dow from p_date)::int in (0,6)
    or (extract(month from p_date)::int = 2 and extract(day from p_date)::int = 12)
    or public._maintenance_extra_holiday(p_date)
      or public._future_is_holiday(p_date)
    or p_date in (
      date '2026-01-01',date '2026-02-16',date '2026-02-17',date '2026-02-18',
      date '2026-03-01',date '2026-03-02',date '2026-05-01',date '2026-05-05',
      date '2026-05-24',date '2026-05-25',date '2026-06-03',date '2026-06-06',
      date '2026-07-17',date '2026-08-15',date '2026-08-17',date '2026-09-24',
      date '2026-09-25',date '2026-09-26',date '2026-10-03',date '2026-10-05',
      date '2026-10-09',date '2026-12-25',
      date '2027-01-01',date '2027-02-06',date '2027-02-07',date '2027-02-08',
      date '2027-02-09',date '2027-03-01',date '2027-05-01',date '2027-05-03',
      date '2027-05-05',date '2027-05-13',date '2027-06-06',date '2027-07-17',
      date '2027-07-19',date '2027-08-15',date '2027-08-16',date '2027-09-14',
      date '2027-09-15',date '2027-09-16',date '2027-10-03',date '2027-10-04',
      date '2027-10-09',date '2027-10-11',date '2027-12-25',date '2027-12-27'
    )
  );
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public._personnel_is_holiday(p_date date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select extract(isodow from p_date) in (6,7)
     or (extract(month from p_date)::int = 2 and extract(day from p_date)::int = 12)
     or public._maintenance_extra_holiday(p_date)
      or public._future_is_holiday(p_date)
     or p_date = any(array[
      date '2026-01-01',date '2026-02-16',date '2026-02-17',date '2026-02-18',date '2026-03-01',date '2026-03-02',
      date '2026-05-01',date '2026-05-05',date '2026-05-24',date '2026-05-25',date '2026-06-03',date '2026-06-06',
      date '2026-07-17',date '2026-08-15',date '2026-08-17',date '2026-09-24',date '2026-09-25',date '2026-09-26',
      date '2026-10-03',date '2026-10-05',date '2026-10-09',date '2026-12-25',
      date '2027-01-01',date '2027-02-06',date '2027-02-07',date '2027-02-08',date '2027-02-09',date '2027-03-01',
      date '2027-05-01',date '2027-05-03',date '2027-05-05',date '2027-05-13',date '2027-06-06',date '2027-07-17',
      date '2027-07-19',date '2027-08-15',date '2027-08-16',date '2027-09-14',date '2027-09-15',date '2027-09-16',
      date '2027-10-03',date '2027-10-04',date '2027-10-09',date '2027-10-11',date '2027-12-25',date '2027-12-27'
    ]);
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
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
 v_period_ids text[]:=array[]::text[]; v_pair_keys text[]:=array[]::text[]; v_holiday_keys text[]:=array[]::text[];
begin
 v_actor:=public._require_admin(p_token);
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_MAINTENANCE_REVISION'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or length(p_data::text)>600000
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if (select count(*) from jsonb_object_keys(p_data))<>3
    or not (p_data ? 'periods' and p_data ? 'overrides' and p_data ? 'holidays')
    or jsonb_typeof(p_data->'periods')<>'array'
    or jsonb_typeof(p_data->'overrides')<>'array'
    or jsonb_typeof(p_data->'holidays')<>'array'
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if jsonb_array_length(p_data->'periods')>32 or jsonb_array_length(p_data->'overrides')>5000
    or jsonb_array_length(p_data->'holidays')>100
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

 select * into strict v_current from public.maintenance_schedule_state where id=1 for update;
 if v_current.revision<>p_expected_revision then raise exception 'STALE_MAINTENANCE_SCHEDULE'; end if;
 update public.maintenance_schedule_state
 set revision=revision+1,data=p_data,updated_at=now(),updated_by=v_actor where id=1;
 insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
 values(v_actor,v_actor,'대정비 근무표 설정',
   '정비기간 '||jsonb_array_length(p_data->'periods')||'건 · 조별 수정 '||
   jsonb_array_length(p_data->'overrides')||'건 · 추가 휴일 '||
   jsonb_array_length(p_data->'holidays')||'건 · 변경 전 개정 '||v_current.revision);
 if to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
 return jsonb_build_object('revision',v_current.revision+1,'data',p_data);
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.admin_set_holiday_work_month_confirmation(p_token uuid, p_month_start date, p_confirmed boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_actor smallint; v_month date;
begin
  v_actor:=public._require_admin(p_token);
  perform public._personnel_assert_actor_writable(v_actor);
  if p_month_start is null then raise exception 'INVALID_DATE'; end if;
  v_month:=date_trunc('month',p_month_start)::date;
  if v_month<date '2026-01-01' or v_month>date '2035-12-01' then raise exception 'OVERTIME_MONTH_OUT_OF_RANGE'; end if;
  if coalesce(p_confirmed,false) then
    insert into public.holiday_work_month_confirmations(month_start,confirmed_by,confirmed_at)
    values(v_month,v_actor,now())
    on conflict(month_start) do update set confirmed_by=excluded.confirmed_by,confirmed_at=excluded.confirmed_at;
    insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
    values(v_actor,null,'휴일근무 편성 확정',to_char(v_month,'YYYY-MM'));
  else
    delete from public.holiday_work_month_confirmations where month_start=v_month;
    insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
    values(v_actor,null,'휴일근무 편성 확정 취소',to_char(v_month,'YYYY-MM'));
  end if;
  if to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
  return true;
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.restore_operational_backup_with_company_events_v2(p_token uuid, p_admin_pin text, p_attendance_rows jsonb, p_holiday_work_rows jsonb, p_audit_rows jsonb, p_company_event_rows jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor smallint;
  v_count integer:=0;
  v_preserved boolean:=false;
begin
  v_actor:=public._require_admin(p_token);
  perform public.restore_operational_backup(p_token,p_admin_pin,p_attendance_rows,p_holiday_work_rows,p_audit_rows);

  if p_company_event_rows is null then
    v_preserved:=true;
    select count(*) into v_count from public.company_events;
    insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
    values(v_actor,null,'사내일정 유지',v_count::text||'건 유지 · 구형 백업 복원');
  else
    if jsonb_typeof(p_company_event_rows)<>'array' then raise exception 'INVALID_COMPANY_EVENT_BACKUP'; end if;
    if exists(
      select 1
      from jsonb_to_recordset(p_company_event_rows) as x(start_date date,end_date date,event_date date,memo_text text,created_by smallint,updated_at timestamptz)
      left join public.employees e on e.id=x.created_by
      where coalesce(x.start_date,x.event_date) is null
         or coalesce(x.end_date,x.start_date,x.event_date) is null
         or coalesce(x.end_date,x.start_date,x.event_date)<coalesce(x.start_date,x.event_date)
         -- 구형 v5/v6 백업 호환을 위해 여기서는 과거와 동일하게 연도 범위를 추가 제한하지 않습니다.
         -- 새 관리 UI/v3 저장은 2026~2035만 허용하지만, 이미 만들어진 구형 백업은 그대로 복원 가능해야 합니다.
         or coalesce(btrim(x.memo_text),'')=''
         or char_length(btrim(x.memo_text))>1000
         or (x.created_by is not null and e.id is null)
    ) then raise exception 'INVALID_COMPANY_EVENT_BACKUP'; end if;

    delete from public.company_events;
    insert into public.company_events(event_date,end_date,memo_text,created_by,updated_at)
    select
      coalesce(x.start_date,x.event_date),
      coalesce(x.end_date,x.start_date,x.event_date),
      btrim(x.memo_text),
      coalesce(x.created_by,v_actor),
      coalesce(x.updated_at,now())
    from jsonb_to_recordset(p_company_event_rows) as x(start_date date,end_date date,event_date date,memo_text text,created_by smallint,updated_at timestamptz)
    order by coalesce(x.start_date,x.event_date);
    get diagnostics v_count=row_count;

    insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
    values(v_actor,null,'사내일정 복원',v_count::text||'건 복원');
  end if;

  if to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
  return jsonb_build_object('company_event_count',v_count,'company_events_preserved',v_preserved);
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.save_company_event_v3(p_token uuid, p_id bigint, p_start_date date, p_end_date date, p_text text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor smallint;
  v_id bigint;
  v_text text;
  v_action text;
  v_summary text;
begin
  v_actor:=public._require_admin(p_token);
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date then
    raise exception 'INVALID_DATE_RANGE';
  end if;
  if p_start_date<date '2026-01-01' or p_end_date>date '2035-12-31' then
    raise exception 'COMPANY_EVENT_DATE_OUT_OF_RANGE';
  end if;
  v_text:=btrim(coalesce(p_text,''));
  if v_text='' then raise exception 'COMPANY_EVENT_REQUIRED'; end if;
  if char_length(v_text)>1000 then raise exception 'COMPANY_EVENT_TOO_LONG'; end if;

  if p_id is null then
    insert into public.company_events(event_date,end_date,memo_text,created_by,updated_at)
    values(p_start_date,p_end_date,v_text,v_actor,now())
    returning id into v_id;
    v_action:='사내일정 등록';
  else
    update public.company_events
       set event_date=p_start_date,
           end_date=p_end_date,
           memo_text=v_text,
           updated_at=now()
     where id=p_id
     returning id into v_id;
    if v_id is null then raise exception 'NOT_FOUND'; end if;
    v_action:='사내일정 수정';
  end if;

  v_summary:=to_char(p_start_date,'YYYY-MM-DD')||
             case when p_end_date<>p_start_date then ' ~ '||to_char(p_end_date,'YYYY-MM-DD') else '' end||
             ' · '||left(regexp_replace(v_text,E'[\r\n\t ]+',' ','g'),160);
  insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
  values(v_actor,null,v_action,v_summary);

  if to_regprocedure('public._personnel_signal()') is not null then
    perform public._personnel_signal();
  end if;
  return v_id;
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.save_my_overtime_day(p_token uuid, p_work_date date, p_early_minutes integer, p_early_completed boolean, p_late_minutes integer, p_late_completed boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor smallint;
  v_minutes integer;
  v_completed boolean;
  v_slot text;
  v_before_minutes integer;
  v_before_completed boolean;
  v_changed boolean:=false;
begin
  v_actor:=public._session_employee(p_token);
  perform public._personnel_assert_actor_writable(v_actor);
  if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2035-12-31' then raise exception 'OVERTIME_DATE_OUT_OF_RANGE'; end if;
  if not public._personnel_operational_on(v_actor,p_work_date) then raise exception 'PERSONNEL_DATE_OUTSIDE_ASSIGNMENT'; end if;

  -- 조출/야근 두 슬롯을 하루 단위로 원자적으로 저장하고, 단일 슬롯 완료체크 RPC와도 직렬화합니다.
  perform pg_advisory_xact_lock(v_actor::integer,(p_work_date-date '2000-01-01')::integer);

  foreach v_slot in array array['early','late'] loop
    v_minutes:=case when v_slot='early' then coalesce(p_early_minutes,0) else coalesce(p_late_minutes,0) end;
    v_completed:=case when v_slot='early' then coalesce(p_early_completed,false) else coalesce(p_late_completed,false) end;
    if v_minutes<>0 and (v_minutes<10 or v_minutes>1440 or mod(v_minutes,10)<>0) then raise exception 'INVALID_OVERTIME_MINUTES'; end if;

    v_before_minutes:=null;
    v_before_completed:=null;
    select o.minutes,o.completed
      into v_before_minutes,v_before_completed
    from public.overtime_entries o
    where o.employee_id=v_actor and o.work_date=p_work_date and o.slot=v_slot
    for update;

    if v_minutes=0 then
      if v_before_minutes is not null then
        delete from public.overtime_entries where employee_id=v_actor and work_date=p_work_date and slot=v_slot;
        v_changed:=true;
        insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
        values(v_actor,v_actor,'초과근무 계획 삭제',to_char(p_work_date,'YYYY-MM-DD')||' · '||case v_slot when 'early' then '조출' else '야근' end||' · '||v_before_minutes||'분');
      end if;
    elsif v_before_minutes is null or v_before_minutes<>v_minutes or v_before_completed is distinct from v_completed then
      insert into public.overtime_entries(employee_id,work_date,slot,minutes,completed,updated_at)
      values(v_actor,p_work_date,v_slot,v_minutes,v_completed,now())
      on conflict(employee_id,work_date,slot) do update set minutes=excluded.minutes,completed=excluded.completed,updated_at=now();
      v_changed:=true;
      insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
      values(v_actor,v_actor,case when v_before_minutes is null then '초과근무 계획 등록' else '초과근무 계획 수정' end,
        to_char(p_work_date,'YYYY-MM-DD')||' · '||case v_slot when 'early' then '조출' else '야근' end||' · '||v_minutes||'분 · '||case when v_completed then '완료' else '계획' end);
    end if;
  end loop;
  if v_changed and to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
  return true;
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.save_my_overtime_day_v2(p_token uuid, p_work_date date, p_early_minutes integer, p_early_completed boolean, p_late_minutes integer, p_late_completed boolean, p_expected jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
 if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2035-12-31'
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
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.save_my_overtime_entry(p_token uuid, p_work_date date, p_slot text, p_minutes integer, p_completed boolean DEFAULT false)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor smallint;
  v_id bigint;
  v_before_minutes integer;
  v_before_completed boolean;
  v_exists boolean:=false;
  v_completed boolean:=coalesce(p_completed,false);
begin
  v_actor:=public._session_employee(p_token);
  perform public._personnel_assert_actor_writable(v_actor);
  if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2035-12-31' then raise exception 'OVERTIME_DATE_OUT_OF_RANGE'; end if;
  if not public._personnel_operational_on(v_actor,p_work_date) then raise exception 'PERSONNEL_DATE_OUTSIDE_ASSIGNMENT'; end if;
  if p_slot is null or p_slot not in ('early','late') then raise exception 'INVALID_OVERTIME_SLOT'; end if;
  if p_minutes is null or p_minutes<10 or p_minutes>1440 or mod(p_minutes,10)<>0 then raise exception 'INVALID_OVERTIME_MINUTES'; end if;

  -- 같은 직원·같은 날짜의 상세저장/목록체크가 여러 탭에서 겹쳐도 순서대로 처리합니다.
  perform pg_advisory_xact_lock(v_actor::integer,(p_work_date-date '2000-01-01')::integer);

  select o.id,o.minutes,o.completed
    into v_id,v_before_minutes,v_before_completed
  from public.overtime_entries o
  where o.employee_id=v_actor and o.work_date=p_work_date and o.slot=p_slot
  for update;
  v_exists:=v_id is not null;

  -- 같은 값 재저장은 DB/audit/realtime을 불필요하게 흔들지 않고 그대로 성공 처리합니다.
  if v_exists and v_before_minutes=p_minutes and v_before_completed=v_completed then
    return v_id;
  end if;

  insert into public.overtime_entries(employee_id,work_date,slot,minutes,completed,updated_at)
  values(v_actor,p_work_date,p_slot,p_minutes,v_completed,now())
  on conflict(employee_id,work_date,slot) do update
     set minutes=excluded.minutes,completed=excluded.completed,updated_at=now()
  returning id into v_id;

  insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
  values(v_actor,v_actor,case when v_exists then '초과근무 계획 수정' else '초과근무 계획 등록' end,
    to_char(p_work_date,'YYYY-MM-DD')||' · '||case p_slot when 'early' then '조출' else '야근' end||' · '||p_minutes||'분 · '||case when v_completed then '완료' else '계획' end);
  if to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
  return v_id;
end;
$function$
;

-- Preserved existing security/authorization logic, adjusted only year ceiling and future-holiday hook.
CREATE OR REPLACE FUNCTION public.save_my_overtime_entry_v2(p_token uuid, p_work_date date, p_slot text, p_minutes integer, p_completed boolean, p_expected jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
 v_actor smallint;
 v_row public.overtime_entries%rowtype;
begin
 v_actor := public._session_employee(p_token);
 perform public._personnel_assert_actor_writable(v_actor);
 if p_work_date is null or p_work_date<date '2026-01-01' or p_work_date>date '2035-12-31'
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
$function$
;
