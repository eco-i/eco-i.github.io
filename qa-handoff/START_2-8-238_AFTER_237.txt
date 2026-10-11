# 근무모아 공식 GitHub 인계 — 2-8-237 완료

- 공식 완료 **2-8-237**, 다음 **2-8-238**, 누적 제품 결함 **510종**(237 신규 **2종**).
- 237 검수 기록 **2026-10-11 22:22:27~22:46:22 KST (활동 구간 23분55초)**, High·깊이8. CI 실행·수정·반복 회귀는 이 구간에 분포하며 경과와 순수 작업시간은 구별할 것.
- 237 완료/238 시작 HTML SHA-256 **f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f**, **1,161,672 bytes**.
- QA 파일: `index.html`, `qa-handoff/index.working-2-8-237.html`, `qa-handoff/index.before-2-8-238.html` 동일 Git blob.
- APP_VERSION `ver20260927-0944` 유지, SQL·main·배포 변경 없음.
- 결함 ① 다른 탭의 localStorage.clear() 후 공유 관리자 UI 잔류 → key-null 전체 초기화 처리.
- 결함 ② 모바일 레거시 sessionStorage 토큰이 공유 로그아웃 marker 수신을 가로막음 → 모바일은 matching-token 공유 로그아웃을 항상 적용, PC 탭 전용 로그인 예외 유지.
- [CI #38144386221](https://github.com/eco-i/eco-i.github.io/actions/runs/38144386221) 및 [CI #38144472284](https://github.com/eco-i/eco-i.github.io/actions/runs/38144472284) 동일 HTML SHA 기준 각 **116 PASS / 0 FAIL**.
- BFCache persisted 미확인, 실 Supabase/RLS·Android native picker·운영 인증 멀티유저·iOS·실백업복원 미검증.
- 보고 `qa-handoff/QA_2-8-237_REPORT.md`, 근거 `qa-handoff/QA_237_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-237_SHA_MANIFEST.json`.
- 다음 **2-8-238**만. High·깊이8·블록별 최소20분 실제검수·기술결함 즉시수정/회귀·번호 연속. 운영변경 임의금지. ZIP 불필요.
