-- 근무모아 기존 공휴일 변경/복원 기능 배포 이력
-- 기존 관리자 편집·삭제 기록 유지: 해당 버전이 이미 있다면 아무것도 덮어쓰지 않음.
insert into public.site_update_history(version,release_date,items,display_order)
values (
 'ver20261018-2313',date '2026-10-18',
 '["관리자가 기존 공휴일을 날짜별로 근무일로 변경하고 다시 공휴일로 복원하는 기능 추가","공휴일 변경을 모든 직원의 근무표·정비 자동편성·연차 및 휴일근무 판정에 공통 적용","토·일요일·2월 12일 창립기념일 및 2026년 10월 1~15일 특별 편성 보호"]'::jsonb,
 (select coalesce(max(display_order),0)+1 from public.site_update_history)
)
on conflict(version) do nothing;
