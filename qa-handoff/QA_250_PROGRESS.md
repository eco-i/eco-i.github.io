# 근무모아 2차·깊이8 — 2-8-250 중간 증거 (공식 완료 전)

- 작업 시작 2026-10-13 23:09:25 KST. 이 문서 작성 2026-10-13 23:26 KST. 아직 최소20분 미충족이므로 **2-8-249가 마지막 공식 완료 블록**, 누적 공식 533종 유지.
- GitHub `eco-i/eco-i.github.io`, QA branch `qa-2-8`. 운영 main 변경 금지.
- 불변 250 시작 SHA256 `4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef` / 1,172,999 bytes.
- 수정 후보 SHA256 `aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841` / 1,173,309 bytes.
- 실제 Chrome RED [#38411568281](https://github.com/eco-i/eco-i.github.io/actions/runs/38411568281), 7 PASS 2 FAIL: 로그인 유지 PC shared+tab 이중 토큰에서 state.me 로딩 전 공유 저장소 삭제 시, 오래된 tab admin unlock으로 복구가 승인됨.
- 수정: `pcSharedAuthorityRevoked`가 state.me 로드 전에도 동일 tab/shared 토큰과 PC remember 표식을 확인하여 탭별 공유 권한 이력을 기록하도록 제한된 1 source hunk 패치.
- 실제 Chrome GREEN [#38411996488](https://github.com/eco-i/eco-i.github.io/actions/runs/38411996488) 9 PASS 0 FAIL; 실제 페이지 cold load·RPC 지연·다른 탭 공유 삭제 [#38412684603](https://github.com/eco-i/eco-i.github.io/actions/runs/38412684603) 9 PASS 0 FAIL.
- Final SHA 8계층 213 PASS 0 FAIL 1회 [#38412437555](https://github.com/eco-i/eco-i.github.io/actions/runs/38412437555). 반복 2·3회 실행 중.
- PC/모바일 648 상태 행렬 [#38412921278](https://github.com/eco-i/eco-i.github.io/actions/runs/38412921278) PASS.
- 네이티브 Chrome 두 탭 [#38412975637](https://github.com/eco-i/eco-i.github.io/actions/runs/38412975637) 10 PASS 0 FAIL.
- 독립 소스 SHA·JS 2개·고유 DOM 457개·소스 변경 1hunk/6lines [#38412622859](https://github.com/eco-i/eco-i.github.io/actions/runs/38412622859) PASS.
- 네트워크 RPC는 모의 처리. 실 운영 Supabase/RLS, Android 실물, iOS Safari, BFCache, 운영 백업복원은 미검증.
- 미완료: 최소20분 실제 검수 충족 확인, 213 전체 회귀 독립 2·3회 결과, 최종 상태·다음 기준본 무결성 및 보고 저장.
