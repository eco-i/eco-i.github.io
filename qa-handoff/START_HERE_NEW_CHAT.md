# ★★★근무모아 2차·깊이 8 — 286 완료 / 287 다음

- 공식 **2-8-286 COMPLETE/CLEAN** (Chromium/모의 RPC 범위), 다음 **2-8-287**, 공식 누적 제품 결함 **540종**, 286 신규 0종.
- [286 GitHub Actions 22/22 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39009514749), 실제 **1249초(20분 49초)**, **10×23=230묶음 반복 회귀 PASS/0 FAIL**.
- 286 신규 **종일/부분/중복 부재·야간 새벽·타인 부재 상태** 730일×5조/일근×11패턴×Chrome6환경, **240,900 시나리오, 1,007,406 PASS / 0 FAIL**.
- 기존 285 연가 111,042 PASS, 284 대휴 50,694 PASS, 283 근무표 57,222, 282 타임스탬프 988,956, 281 제외순열 658,206, 280 장기재직 1,734,246 등의 회귀 유지.
- **287 시작본** `qa-handoff/index.before-2-8-287.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes; index.html/286 시작본·작업본과 동일.
- `qa-handoff/CURRENT_STATE.json`, `QA_2-8-286_REPORT.md`, `QA_2-8-286_SHA_MANIFEST.json`, `QA_286_EVIDENCE_AUDIT.json`, `QA_286_INDEPENDENT_EVIDENCE.json` 공식 참고. WIP는 과거 진행 기록.
- 265/270/273/276/282/284 초기 QA RED 이력 원본 **보존**, 소급 성공 또는 기록 삭제 금지.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경 없음, 운영 배포 없음. 실제 Supabase/RLS 인증·물리 폰 picker/카메라·지속 BFCache·운영 DB 복원 미검증.
- 287부터도 High·깊이 8·20분 이상 실제 검수·20분 이내 KST 진행보고·독립검사 추가·결함 즉시 수정 및 회귀, GitHub 직접연결, ZIP 제안 금지, 운영 배포/버전/SQL/main 임의 변경 금지.
- [287 인계검사 14 PASS / 0 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/39010949184) 완료. `QA_286_POST_PROMOTE.cjs` 및 `qa-286-final.yml` 결과 보존.
