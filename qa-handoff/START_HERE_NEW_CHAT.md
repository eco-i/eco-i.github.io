# 근무모아 공식 최신 GitHub 인계 — 2-8-236 완료

- 공식 완료 **2-8-236**, 다음 **2-8-237**, 공식 누적 제품 결함 **508종**(236 신규 **2종**).
- 236 검수: 2026-10-11 **19:43:23~20:04:07 KST (최소 20분 44초)**, High·깊이 8.
- 236 완료/237 시작 SHA-256 **5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a**, **1,161,068 bytes**.
- 최신 시작본 `qa-handoff/index.before-2-8-237.html`, QA 브랜치 `index.html` 동일 Git blob.
- APP_VERSION `ver20260927-0944` 유지, SQL 수정 없음, 운영 main 불변 및 배포 없음.
- 236 제품 결함 ① 다른 탭 Web Lock으로 인해 logout()의 관리자 UI 폐기가 지연됨 → 동기 폐기 및 서버 로그아웃 선전송.
- 236 제품 결함 ② Web Locks 미지원 모바일 logout 후 기존 token 재복원 및 다른 탭 관리자 UI 잔류 → exact-token 차단과 storage-event 형제 탭 즉시 종료.
- 보고서: `qa-handoff/QA_2-8-236_REPORT.md`; 근거: `qa-handoff/QA_236_EVIDENCE_AUDIT.json`; SHA 매니페스트: `qa-handoff/QA_2-8-236_SHA_MANIFEST.json`.
- 실제 headless Chrome 최종 105 PASS / 0 FAIL **2회 연속**, [CI 38134099849](https://github.com/eco-i/eco-i.github.io/actions/runs/38134099849), [CI 38134173052](https://github.com/eco-i/eco-i.github.io/actions/runs/38134173052).
- BFCache persisted 미확인. 실제 운영 DB/RLS·Android Native picker·실 계정 멀티탭·실기기/iOS·실백업 복원 미검증.
- 다음 반드시 **2-8-237**만 진행. High·깊이 8·각 블록 실제 20분 이상·기술결함 즉시 수정/회귀·번호 건너뛰기 금지. 새 APP_VERSION·SQL·운영 main·배포 임의변경 금지. ZIP 불필요(GitHub).
