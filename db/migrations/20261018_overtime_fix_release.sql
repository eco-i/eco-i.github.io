-- Preserve existing update notes, including edits and tombstones.
insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-2100',date '2026-10-18',
 '["초과근무 조출·야근 저장 및 삭제 오류 수정","초과근무 목록 완료 체크 서버 연동 복구","저장 실패 안내와 미저장 상태 표시 개선"]'::jsonb,
 (select coalesce(max(display_order),0)+1 from public.site_update_history))
on conflict (version) do nothing;
