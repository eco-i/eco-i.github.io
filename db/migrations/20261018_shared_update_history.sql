-- Stage on GitHub feature branch before applying. Only additive objects are created.
-- Never let browser users modify this table directly; all access is via scoped RPCs.
create table if not exists public.site_update_history (
 version text primary key check (char_length(version) between 1 and 64),
 release_date date not null,
 items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 20),
 display_order integer not null,
 revision integer not null default 1 check (revision>=1),
 is_deleted boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 updated_by smallint references public.employees(id)
);
alter table public.site_update_history enable row level security;
revoke all on table public.site_update_history from public, anon, authenticated;
-- Seed exactly the inherited original history. Upserts deliberately avoid overwriting admin edits or tombstones.
insert into public.site_update_history(version, release_date, items, display_order) values
('ver20261017-2320','2026-10-17'::date,'["달력 메모 연필 및 메모 내용 테두리·그림자 제거"]'::jsonb,15),
('ver20261017-2311','2026-10-17'::date,'["달력 메모 연필·메모 내용 테두리 강조 및 가독성 개선"]'::jsonb,14),
('ver20261017-2302','2026-10-17'::date,'["내 근무표 메모 목록·연필·메모 내용 표시를 중립색으로 변경"]'::jsonb,13),
('ver20261017-2249','2026-10-17'::date,'["2차 종합검수 수정사항 반영","지문 출퇴근 사진 선택 후 등록 대기 오류 수정"]'::jsonb,12),
('ver20260917-2153','2026-09-17'::date,'["D-DAY 표시 기능 추가"]'::jsonb,11),
('ver20260916-1703','2026-09-16'::date,'["초과근무 계획·완료 관리 기능 추가"]'::jsonb,10),
('ver20260915-2352','2026-09-15'::date,'["사내일정 달력 표시 기능 추가"]'::jsonb,9),
('ver20260915-1326','2026-09-15'::date,'["내 근무표 메모 내용 표시 및 표시/숨김 기능 추가"]'::jsonb,8),
('ver20260913-1706','2026-09-13'::date,'["대체공휴일 대휴 발생 안내 기능 추가"]'::jsonb,7),
('ver20260913-1210','2026-09-13'::date,'["PC·태블릿 화면 최적화 기능 추가"]'::jsonb,6),
('ver20260913-0039','2026-09-13'::date,'["장기재직휴가 자동계산 및 근태 연동 기능 추가"]'::jsonb,5),
('ver20260912-2149','2026-09-12'::date,'["다크모드 기능 추가"]'::jsonb,4),
('ver20260912-2057','2026-09-12'::date,'["잔여연차 자동계산 및 근태 연동 기능 추가"]'::jsonb,3),
('ver20260911-2138','2026-09-11'::date,'["휴일근무 기본시간 자동입력 기능 추가"]'::jsonb,2),
('ver20260911-1806','2026-09-11'::date,'["업데이트 내역 확인 기능 추가"]'::jsonb,1)
on conflict (version) do nothing;

create or replace function public.list_site_update_history_v1(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $fn$
begin
 perform public._session_employee(p_token);
 return coalesce((
   select jsonb_agg(jsonb_build_object('version', h.version, 'date', to_char(h.release_date,'YYYY.MM.DD'), 'items',h.items,'revision',h.revision)
         order by h.display_order desc, h.version desc)
   from public.site_update_history h where not h.is_deleted
 ),'[]'::jsonb);
end;
$fn$;

create or replace function public.admin_edit_site_update_history_v1(
 p_token uuid, p_version text, p_release_date date, p_items jsonb, p_expected_revision integer
)
returns integer language plpgsql volatile security definer set search_path = ''
as $fn$
declare v_actor smallint; v_revision integer; v_item jsonb;
begin
 v_actor:=public._require_admin(p_token);
 if p_release_date is null or p_version is null or char_length(p_version)>64 or p_expected_revision is null or p_expected_revision<1 then
   raise exception 'UPDATE_HISTORY_INVALID_REQUEST';
 end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then
   raise exception 'UPDATE_HISTORY_INVALID_ITEMS';
 end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(v_item)<>'string' or char_length(btrim(v_item #>> '{}')) not between 1 and 300 then
     raise exception 'UPDATE_HISTORY_INVALID_ITEM';
   end if;
 end loop;
 update public.site_update_history h
 set release_date=p_release_date,items=p_items,revision=revision+1,updated_at=now(),updated_by=v_actor
 where h.version=p_version and h.revision=p_expected_revision and not h.is_deleted
 returning h.revision into v_revision;
 if v_revision is null then
   if exists(select 1 from public.site_update_history h where h.version=p_version) then
     raise exception 'UPDATE_HISTORY_CONFLICT';
   end if;
   raise exception 'UPDATE_HISTORY_NOT_FOUND';
 end if;
 insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
 values(v_actor,null,'업데이트 내역 수정',left(p_version,100));
 return v_revision;
end;
$fn$;

create or replace function public.admin_delete_site_update_history_v1(
 p_token uuid, p_version text, p_expected_revision integer
)
returns integer language plpgsql volatile security definer set search_path = ''
as $fn$
declare v_actor smallint;v_revision integer;
begin
 v_actor:=public._require_admin(p_token);
 if p_version is null or char_length(p_version)>64 or p_expected_revision is null or p_expected_revision<1 then
  raise exception 'UPDATE_HISTORY_INVALID_REQUEST';
 end if;
 update public.site_update_history h
 set is_deleted=true,revision=revision+1,updated_at=now(),updated_by=v_actor
 where h.version=p_version and h.revision=p_expected_revision and not h.is_deleted
 returning h.revision into v_revision;
 if v_revision is null then
  if exists(select 1 from public.site_update_history h where h.version=p_version) then
   raise exception 'UPDATE_HISTORY_CONFLICT';
  end if;
  raise exception 'UPDATE_HISTORY_NOT_FOUND';
 end if;
 insert into public.audit_logs(actor_employee_id,target_employee_id,action_type,summary)
 values(v_actor,null,'업데이트 내역 삭제',left(p_version,100));
 return v_revision;
end;
$fn$;

revoke all on function public.list_site_update_history_v1(uuid) from public;
revoke all on function public.admin_edit_site_update_history_v1(uuid,text,date,jsonb,integer) from public;
revoke all on function public.admin_delete_site_update_history_v1(uuid,text,integer) from public;
grant execute on function public.list_site_update_history_v1(uuid) to anon,authenticated;
grant execute on function public.admin_edit_site_update_history_v1(uuid,text,date,jsonb,integer) to anon,authenticated;
grant execute on function public.admin_delete_site_update_history_v1(uuid,text,integer) to anon,authenticated;
