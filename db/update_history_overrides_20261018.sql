-- 근무모아 / 공동 업데이트 내역 관리자 편집 (2026-10-18)
-- 신규 테이블과 신규 RPC만 생성. 기존 근태/지문/직원 자료 및 기존 함수 변경 없음.
-- 실제 운영에서 관리자만 변경할 수 있는 서버 권한, 중복수정 검증, 삭제 tombstone 제공.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.update_history_overrides (
  version text primary key check (version ~ '^ver[0-9]{8}-[0-9]{4}$'),
  items text[] not null default '{}'::text[],
  is_deleted boolean not null default false,
  revision integer not null default 1 check (revision >= 1),
  updated_by smallint,
  updated_at timestamptz not null default now()
);
create index if not exists update_history_overrides_updated_idx
  on public.update_history_overrides(updated_at desc);

alter table public.update_history_overrides enable row level security;
revoke all on table public.update_history_overrides from public,anon,authenticated;

create or replace function public.list_update_history_overrides(p_token uuid)
returns jsonb
language plpgsql security definer set search_path=public,extensions
as $func$
declare v_actor smallint;
begin
  v_actor := public._session_employee(p_token);
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'version',h.version,
      'items',to_jsonb(h.items),
      'deleted',h.is_deleted,
      'revision',h.revision
    ) order by h.version desc),'[]'::jsonb)
    from public.update_history_overrides h
  );
end;
$func$;

create or replace function public.admin_set_update_history_override(
  p_token uuid,
  p_version text,
  p_items text[],
  p_is_deleted boolean,
  p_expected_revision integer
)
returns integer
language plpgsql security definer set search_path=public,extensions
as $func$
declare
  v_actor smallint;
  v_revision integer;
  v_version text := btrim(coalesce(p_version,''));
  v_items text[];
begin
  v_actor:=public._require_admin(p_token);
  if v_version !~ '^ver[0-9]{8}-[0-9]{4}$' then raise exception 'INVALID_UPDATE_HISTORY_VERSION'; end if;
  if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_UPDATE_HISTORY_REVISION'; end if;
  if p_is_deleted is null then raise exception 'INVALID_UPDATE_HISTORY_DELETION'; end if;
  if p_is_deleted then
    v_items := '{}'::text[];
  else
    if p_items is null or cardinality(p_items) not between 1 and 12 then raise exception 'INVALID_UPDATE_HISTORY_ITEMS'; end if;
    if exists (select 1 from unnest(p_items) as x(item) where x.item is null or length(btrim(x.item)) not between 1 and 220) then
      raise exception 'INVALID_UPDATE_HISTORY_ITEMS';
    end if;
    select array_agg(btrim(x.item) order by x.ord) into v_items
      from unnest(p_items) with ordinality as x(item,ord);
  end if;
  if p_expected_revision = 0 then
    insert into public.update_history_overrides(version,items,is_deleted,revision,updated_by,updated_at)
    values(v_version,v_items,p_is_deleted,1,v_actor,now())
    on conflict(version) do nothing
    returning revision into v_revision;
  else
    update public.update_history_overrides h
      set items=v_items,is_deleted=p_is_deleted,revision=h.revision+1,updated_by=v_actor,updated_at=now()
      where h.version=v_version and h.revision=p_expected_revision
      returning h.revision into v_revision;
  end if;
  if v_revision is null then raise exception 'UPDATE_HISTORY_STALE'; end if;
  return v_revision;
end;
$func$;

revoke all on function public.list_update_history_overrides(uuid) from public,anon,authenticated;
revoke all on function public.admin_set_update_history_override(uuid,text,text[],boolean,integer) from public,anon,authenticated;
grant execute on function public.list_update_history_overrides(uuid) to anon,authenticated;
grant execute on function public.admin_set_update_history_override(uuid,text,text[],boolean,integer) to anon,authenticated;
commit;
