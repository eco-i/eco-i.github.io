-- 3차 QA 3-8-2: 2026~2035 calendar contract for personal memos and D-day selections.
-- QA BRANCH ONLY; NOT applied to production. Requires approval before release.
-- Read-only prerequisites: 2026~2035 outside count must be zero for both tables.
-- Existing records are NEVER UPDATED OR DELETED.
alter table public.personal_memos
  add constraint personal_memos_supported_dates_ck
  check (memo_date between date '2026-01-01' and date '2035-12-31');

alter table public.memo_dday_selections
  add constraint memo_dday_selections_supported_dates_ck
  check (memo_date between date '2026-01-01' and date '2035-12-31');

-- Preserve all legacy permission and session policy checks, only add year fence.
CREATE OR REPLACE FUNCTION public.save_my_memo(p_token uuid, p_date date, p_text text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_actor smallint; v_emp public.employees%rowtype; v_text text; v_id bigint;
begin
  v_actor:=public._session_employee(p_token);
  if public._employee_is_read_only(v_actor) then raise exception 'READ_ONLY_ACCOUNT'; end if;
  select * into v_emp from public.employees e where e.id=v_actor;
  if p_date is null then raise exception 'INVALID_DATE'; end if;
  if p_date < date '2026-01-01' or p_date > date '2035-12-31' then raise exception 'INVALID_DATE'; end if;
  if p_date<v_emp.active_from or (v_emp.active_to is not null and p_date>v_emp.active_to) then raise exception 'MEMO_DATE_OUTSIDE_EMPLOYMENT'; end if;
  v_text:=btrim(coalesce(p_text,''));
  if v_text='' then raise exception 'MEMO_REQUIRED'; end if;
  if char_length(v_text)>1000 then raise exception 'MEMO_TOO_LONG'; end if;
  insert into public.personal_memos(employee_id,memo_date,memo_text)
  values(v_actor,p_date,v_text)
  on conflict(employee_id,memo_date) do update set memo_text=excluded.memo_text,updated_at=now()
  returning id into v_id;
  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_my_memo_dday(p_token uuid, p_date date, p_selected boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_actor smallint; v_changed integer:=0;
begin
  v_actor:=public._session_employee(p_token);
  perform public._personnel_assert_actor_writable(v_actor);
  if p_date is null then raise exception 'INVALID_MEMO_DATE'; end if;
  if p_date < date '2026-01-01' or p_date > date '2035-12-31' then raise exception 'INVALID_MEMO_DATE'; end if;
  perform pg_advisory_xact_lock(v_actor::integer,(p_date-date '2000-01-01')::integer);
  if coalesce(p_selected,false) then
    if not exists(select 1 from public.personal_memos where employee_id=v_actor and memo_date=p_date) then raise exception 'MEMO_NOT_FOUND'; end if;
    insert into public.memo_dday_selections(employee_id,memo_date,selected_at) values(v_actor,p_date,now()) on conflict(employee_id,memo_date) do nothing;
    get diagnostics v_changed=row_count;
  else
    delete from public.memo_dday_selections where employee_id=v_actor and memo_date=p_date; get diagnostics v_changed=row_count;
  end if;
  if v_changed>0 and to_regprocedure('public._personnel_signal()') is not null then perform public._personnel_signal(); end if;
  return true;
end; $function$
;
