insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-2230',date '2026-10-18','["근무모아 달력·연차·초과근무·사내일정·인사발령 사용 연도를 2035년까지 확장","2028~2035년 음력 명절과 대체공휴일 예정 정보 보완 및 향후 공식 확정 안내","정비기간 등록·조별 수동 편성·임시공휴일 관리자 입력을 2035년까지 확대","기존 2026~2027년 근무표·근태 기록 보존 및 서버 저장 연도 제한 일치"]'::jsonb,
 (select coalesce(max(display_order),0)+1 from public.site_update_history))
on conflict(version) do nothing;
