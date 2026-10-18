-- ver20261018-2041: shared history release note. Preserve all admin edits and tombstones.
insert into public.site_update_history(version,release_date,items,display_order)
values ('ver20261018-2041',date '2026-10-18',
 '["매년 2월 12일 공단 창립기념일을 휴일로 표시","일근자 휴무·연차·휴일근무 판정에 창립기념일 반영","토·일요일과 겹쳐도 별도 대체휴일 없음"]'::jsonb,
 (select coalesce(max(display_order),0)+1 from public.site_update_history))
on conflict (version) do nothing;
