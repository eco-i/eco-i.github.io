-- Deployment note: insert shared release entry BEFORE promoting feature branch to main.
-- This preserves all administrator edits/deletions; never UPDATE or resurrect existing rows.
insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-1200',date '2026-10-18',
 '["업데이트 내역을 모든 직원에게 동일하게 표시","관리자 전용 업데이트 내역 수정·삭제 기능 추가","변경 내용 저장과 수정 충돌 방지 기능 개선"]'::jsonb,16)
on conflict(version) do nothing;
