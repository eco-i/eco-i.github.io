# ★★★근무모아 2차·깊이8 — 270 완료 / 271 다음

- 공식 완료 **2-8-270 CLEAN (테스트 범위 내)**, 다음 **2-8-271**, 신규 확정 제품 결함 **0종**, 누적 **540종**.
- GitHub `eco-i/eco-i.github.io`, QA `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL·운영 배포 없음, APP_VERSION `ver20260927-0944`.
- `qa-handoff/index.before-2-8-271.html` SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. index.html 및 270 작업본과 동일.
- [270 본검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38743321207) 6개 Job SUCCESS, **실제 21분18초(1278초), 10×23=230 회귀 묶음 PASS**, 신규 picker session ownership 114 PASS.
- [270 picker change/cancel 이벤트](https://github.com/eco-i/eco-i.github.io/actions/runs/38744629389) 66 PASS. 최초 [picker-context 90/24 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999298) 및 [picker event 41/25 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/38743920973), [50/16 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/38744252108)은 **QA 테스트 로그인 저장소/비동기 초기화 오류**이며 기록 보존. 제품 결함 아님으로 분류.
- [8개 교차](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999006) 성공, [다중탭](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999183) 560 PASS, [실제 로그아웃](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999174) 640 PASS.
- 추가 중복 본검수 [38749151235](https://github.com/eco-i/eco-i.github.io/actions/runs/38749151235)은 위 성공한 21분18초와 별도이며 그 작업의 종료 여부는 다음 채팅에서 확인하여 필요 시 증빙 추가. **별도 미완료 실행을 성공했다고 주장하지 말 것**.
- QA 보고서 `qa-handoff/QA_2-8-270_REPORT.md`, SHA `qa-handoff/QA_2-8-270_SHA_MANIFEST.json`, 증빙 `qa-handoff/QA_270_EVIDENCE_AUDIT.json`.
- 265 레거시 raw localStorage 직접삭제·로그아웃 폐기 표식 누락 예외와 실환경 제약 계속 유지. 실운영 Supabase/RLS 실계정, Android/iOS 물리 native picker, 영속 BFCache, 운영 DB 복원 직접 미검증.
- 271 High·깊이8·블록당 실제20분 이상/20분 이내 KST 중간보고/오류 즉시 수정+RED-GREEN/번호 연속. ZIP 금지, main·SQL·APP_VERSION·운영 배포 무단 변경 금지.
