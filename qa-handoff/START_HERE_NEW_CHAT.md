# ★★★근무모아 2차·깊이 8단계 공식 인계 — 243 완료

- 마지막 완료 **2-8-243**, 다음 **2-8-244**, 공식 누적 제품 결함 **522종**(이번 신규 **3종**).
- 검수 브랜치 `qa-2-8`, 운영 `main` **변경/배포 없음**, SQL 변경 없음. `APP_VERSION ver20260927-0944` 고정.
- 최종 `index.html`(qa 브랜치), `qa-handoff/index.working-2-8-243.html`, 다음 시작본 `qa-handoff/index.before-2-8-244.html`: SHA-256 **`fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4`**, **1,167,315 bytes**.
- 이번 불변 시작본 `qa-handoff/index.before-2-8-243.html`: SHA-256 `c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082`, **1,165,913 bytes**.
- 신규 ① 보호 RPC async task 사이 동일 토큰의 보안 epoch 변경: 전송 전 epoch 재검사.
- 신규 ② 강제 초기 PIN 게이트에서 일반 쓰기/민감 export RPC 허용: 공통 PIN 게이트 검사 도입, 본인 PIN 변경 예외 유지.
- 신규 ③ 최신 read-only 계정 변경 뒤 보호 쓰기 RPC 전송: 공통 accountReadOnly() 검사, 본인 PIN 변경 예외 유지.
- 실제 Chrome RED: [epoch #38259260719](https://github.com/eco-i/eco-i.github.io/actions/runs/38259260719), [PIN #38259767471](https://github.com/eco-i/eco-i.github.io/actions/runs/38259767471), [read-only #38260485665](https://github.com/eco-i/eco-i.github.io/actions/runs/38260485665); 집중 최종 GREEN [#38260657929](https://github.com/eco-i/eco-i.github.io/actions/runs/38260657929).
- 독립 전체 Chromium 최종 [#38260776545](https://github.com/eco-i/eco-i.github.io/actions/runs/38260776545) + [#38260978433](https://github.com/eco-i/eco-i.github.io/actions/runs/38260978433): **각 201 PASS / 0 FAIL**.
- 소스 독립 대조 [#38260859071](https://github.com/eco-i/eco-i.github.io/actions/runs/38260859071): 고정 원본 SHA, 수정 지점 3곳만 차이, 최종 SHA 일치.
- 근거 `qa-handoff/QA_2-8-243_REPORT.md`, `qa-handoff/QA_243_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-243_SHA_MANIFEST.json`.
- 운영 Supabase/RLS, 실제 backend 인증 다중 사용자, Android 물리 카메라/파일 picker, iOS, BFCache persisted, 운영 백업 복원은 직접 미검증.
- **High·깊이8·블록당 최소20분 실제 검수·20분 이내 중간보고·번호 연속·기술 결함 즉시 수정과 실 Chromium 회귀**. 사용자 승인 없이 APP_VERSION/SQL/main/실배포 변경하지 말 것. ZIP 불필요.
