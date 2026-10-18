-- Release note: one insert, preserve previous admin edits and soft deletions.
insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-2150',date '2026-10-18',
 '["관리자용 상·하반기 정비기간 등록·변경과 4개 조 자동편성 기능 추가","정비 마지막 날 야간근무·휴무 보장·주말 및 공휴일 적용","조별·날짜별 수동 편성 및 임시공휴일 추가, 연차·초과근무 자동 연동"]'::jsonb,
 (select coalesce(max(display_order),0)+1 from public.site_update_history))
on conflict(version) do nothing;
