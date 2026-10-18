-- 근무모아 2026~2035 서버 저장 연도 통일 (2026-10-18)
-- 2036년 이후 입력 우회 방지: 서버 RPC와 직접 쓰기 경로에 동일한 날짜 상한.
-- 기존 직원/근태/연차/휴근/사내일정/인사 데이터 UPDATE 또는 DELETE 없음.
-- 배포 전 실제 테이블의 범위 밖 기존 행이 0건임을 확인함.

alter table public.annual_leave_settings
  drop constraint annual_leave_settings_year_ck;
alter table public.annual_leave_settings
  add constraint annual_leave_settings_year_ck
    check (leave_year between 2026 and 2035);

alter table public.attendance_entries
  add constraint attendance_entries_supported_dates_ck
    check (start_date >= date '2026-01-01' and end_date <= date '2035-12-31');

alter table public.personnel_batches
  add constraint personnel_batches_supported_date_ck
    check (effective_date between date '2026-01-01' and date '2035-12-31');

alter table public.personnel_account_events
  add constraint personnel_account_events_supported_date_ck
    check (effective_date between date '2026-01-01' and date '2035-12-31');

alter table public.holiday_work_entries
  add constraint holiday_work_entries_supported_date_ck
    check (work_date between date '2026-01-01' and date '2035-12-31');

alter table public.company_events
  add constraint company_events_supported_dates_ck
    check (event_date >= date '2026-01-01' and coalesce(end_date,event_date) <= date '2035-12-31');
