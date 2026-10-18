-- 기존 공휴일 날짜별 근무일 예외 / 관리자만 저장; 기존 원본 및 근태 기록 보존.
update public.maintenance_schedule_state set data=jsonb_set(data,'{excludedHolidays}','[]'::jsonb,true)
where id=1 and not (data ? 'excludedHolidays');
create or replace function public._maintenance_predefined_holiday(p_date date)
returns boolean language sql stable security definer set search_path to 'public','extensions'
as $fn$
 select p_date in (date '2026-01-01',date '2026-02-16',date '2026-02-17',date '2026-02-18',date '2026-03-01',date '2026-03-02',date '2026-05-01',date '2026-05-05',date '2026-05-24',date '2026-05-25',date '2026-06-03',date '2026-06-06',date '2026-07-17',date '2026-08-15',date '2026-08-17',date '2026-09-24',date '2026-09-25',date '2026-09-26',date '2026-10-03',date '2026-10-05',date '2026-10-09',date '2026-12-25',date '2027-01-01',date '2027-02-06',date '2027-02-07',date '2027-02-08',date '2027-02-09',date '2027-03-01',date '2027-05-01',date '2027-05-03',date '2027-05-05',date '2027-05-13',date '2027-06-06',date '2027-07-17',date '2027-07-19',date '2027-08-15',date '2027-08-16',date '2027-09-14',date '2027-09-15',date '2027-09-16',date '2027-10-03',date '2027-10-04',date '2027-10-09',date '2027-10-11',date '2027-12-25',date '2027-12-27') or public._future_is_holiday(p_date);
$fn$;
create or replace function public._maintenance_excluded_holiday(p_date date)
returns boolean language sql stable security definer set search_path to 'public','extensions'
as $fn$
 select p_date is not null and exists (
  select 1 from public.maintenance_schedule_state s
  cross join lateral jsonb_array_elements_text(coalesce(s.data->'excludedHolidays','[]'::jsonb)) x(day)
  where s.id=1 and x.day=to_char(p_date,'YYYY-MM-DD'));
$fn$;
create or replace function public._is_holiday_work_day(p_date date)
returns boolean language sql stable set search_path to 'public','extensions'
as $fn$
 select p_date is not null and (extract(dow from p_date)::int in (0,6)
  or (extract(month from p_date)=2 and extract(day from p_date)=12)
  or (not public._maintenance_excluded_holiday(p_date) and
      (public._maintenance_extra_holiday(p_date) or public._maintenance_predefined_holiday(p_date))));
$fn$;
create or replace function public._personnel_is_holiday(p_date date)
returns boolean language sql stable set search_path to 'public','extensions'
as $fn$
 select p_date is not null and (extract(isodow from p_date)::int in (6,7)
  or (extract(month from p_date)=2 and extract(day from p_date)=12)
  or (not public._maintenance_excluded_holiday(p_date) and
      (public._maintenance_extra_holiday(p_date) or public._maintenance_predefined_holiday(p_date))));
$fn$;
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
$function$
;
revoke execute on function public._maintenance_predefined_holiday(date) from public,anon,authenticated;
revoke execute on function public._maintenance_excluded_holiday(date) from public,anon,authenticated;
