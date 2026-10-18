-- 신규 배포 이력만 추가, 관리자가 기존에 편집/삭제한 과거 버전은 건드리지 않음.
insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-2256',date '2026-10-18',
  '["대정비 근무표 관리 창의 모바일 줄바꿈과 입력칸 배치를 자연스럽게 개선","휴일 추가 안내 문구와 버튼 겹침 방지 및 저장·다시 불러오기 버튼 세로 배치","2035년까지 근태·연차·휴근·사내일정·인사 관련 서버 저장 날짜 제한 일치"]'::jsonb,
  (select coalesce(max(display_order),0)+1 from public.site_update_history))
on conflict(version) do nothing;
