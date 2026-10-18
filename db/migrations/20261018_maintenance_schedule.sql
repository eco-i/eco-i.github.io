-- Maintenance configuration. No existing attendance, holiday work, leave or overtime rows are updated.
create table if not exists public.maintenance_schedule_state (
  id smallint primary key default 1 check (id=1),
  revision bigint not null default 0 check (revision>=0),
  data jsonb not null default '{"periods":[],"overrides":[],"holidays":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by smallint references public.employees(id)
);
alter table public.maintenance_schedule_state enable row level security;
revoke all on public.maintenance_schedule_state from public, anon, authenticated;
insert into public.maintenance_schedule_state(id) values(1) on conflict(id) do nothing;

-- Custom session/auth gate for every read; no direct Data API table access.
create or replace function public.get_maintenance_schedule(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare v_actor smallint; v_state public.maintenance_schedule_state%rowtype;
begin
  v_actor:=public._session_employee(p_token);
  select * into strict v_state from public.maintenance_schedule_state where id=1;
  return jsonb_build_object('revision',v_state.revision,'data',v_state.data,'updated_at',v_state.updated_at);
end;
$fn$;

-- Whole-document optimistic revision update: periods, group/day overrides and extra holidays commit atomically.
create or replace function public.admin_save_maintenance_schedule(
  p_token uuid, p_expected_revision bigint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $fn$
declare
 v_actor smallint; v_current public.maintenance_schedule_state%rowtype;
 v_p jsonb; v_o jsonb; v_h jsonb;
 v_from date; v_to date; v_day date; v_other jsonb;
 v_id text; v_group text; v_shift text; v_title text;
 v_period_ids text[]:=array[]::text[]; v_pair_keys text[]:=array[]::text[]; v_holiday_keys text[]:=array[]::text[];
begin
 v_actor:=public._require_admin(p_token);
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_MAINTENANCE_REVISION'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or length(p_data::text)>100000
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if (select count(*) from jsonb_object_keys(p_data))<>3
    or not (p_data ? 'periods' and p_data ? 'overrides' and p_data ? 'holidays')
    or jsonb_typeof(p_data->'periods')<>'array'
    or jsonb_typeof(p_data->'overrides')<>'array'
    or jsonb_typeof(p_data->'holidays')<>'array'
 then raise exception 'INVALID_MAINTENANCE_DATA'; end if;
 if jsonb_array_length(p_data->'periods')>16 or jsonb_array_length(p_data->'overrides')>1500
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
   if (v_p->>'start') !~ '^20(26|27)-[0-9]{2}-[0-9]{2}$'
      or (v_p->>'end') !~ '^20(26|27)-[0-9]{2}-[0-9]{2}$'
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
      or (v_o->>'date') !~ '^20(26|27)-[0-9]{2}-[0-9]{2}$'
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
      or (v_h->>'date') !~ '^20(26|27)-[0-9]{2}-[0-9]{2}$'
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
$fn$;

revoke all on function public.get_maintenance_schedule(uuid) from public,anon,authenticated;
revoke all on function public.admin_save_maintenance_schedule(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.get_maintenance_schedule(uuid) to anon,authenticated;
grant execute on function public.admin_save_maintenance_schedule(uuid,bigint,jsonb) to anon,authenticated;

-- Dynamic official holidays are visible in the holiday-work eligibility server validators.
-- Existing statutory holidays and company anniversary remain exactly as before.
create or replace function public._maintenance_extra_holiday(p_date date)
returns boolean language sql stable security definer set search_path to 'public','extensions'
as $fn$
 select exists(
   select 1 from public.maintenance_schedule_state s,
     jsonb_array_elements(s.data->'holidays') h
   where s.id=1 and h->>'date'=to_char(p_date,'YYYY-MM-DD')
 );
$fn$;
revoke all on function public._maintenance_extra_holiday(date) from public,anon,authenticated;
-- Staff can check a holiday date through existing legacy predicates; no table direct read is granted.
grant execute on function public._maintenance_extra_holiday(date) to anon,authenticated;

-- The following two legacy predicates are updated in a separate forward migration
-- using their current production definitions, preserving all original holiday dates.
