# ★★★근무모아 2차·깊이8 — 284 완료 / 285 다음

- 마지막 공식 **2-8-284 COMPLETE/CLEAN(실제 Chromium/모의 RPC 범위)**, 다음 **2-8-285**, 누적 제품 결함 **540종**(284 신규 확정 0종).
- [284 수정 후 GitHub Actions 20/20 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39002978396), 실제 **1269초(21분9초)** 지속, **8×23=184묶음 PASS / 0 FAIL**.
- **284 최초 RED 이력 중요:** [최초 RUN 39002924389 FAILED](https://github.com/eco-i/eco-i.github.io/actions/runs/39002924389); QA 테스트 코드의 else 닫는 괄호 누락(SyntaxError Unexpected token finally), independent 및 신규 테스트 FAILED, cross-tab SKIPPED. 제품 결함 아님. `QA_284_INITIAL_QA_FAILURE.json` 필히 보존, 소급 성공 처리 금지. 커밋 `2c5effa126453e338d918735d1af0bd6b5959f41`에서 QA 코드만 수정한 별도 20/20 실행으로 회복.
- 신규 **대체공휴일 11개×직원 재직경계 96순열×Chrome6환경, 대휴 시간/사람별 분리 독립검사 50,694 PASS/0 FAIL**. 기존 283 교대 57,222, 282 타임스탬프 988,956, 281 658,206, 280 1,734,246, 279 636,354 등 회귀 유지.
- **285 시작본** `qa-handoff/index.before-2-8-285.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**; 제품 `index.html`·284 시작/작업본과 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-284_REPORT.md`, `QA_2-8-284_SHA_MANIFEST.json`, `QA_284_EVIDENCE_AUDIT.json`, `QA_284_INITIAL_QA_FAILURE.json`(WIP도 당시 이력 보존).
- 과거 QA 실패 이력 **265/270/273/276/282/284** 소급 수정/삭제 금지. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 운영 Supabase/RLS 실제 인증 다중사용자, 물리 Android/iOS 기본 picker·카메라, 지속 BFCache, 운영 DB 백업·복원 직접 미검증.
- 다음에도 High·깊이8·실제20분 이상·20분 내 KST 진행보고·신규 독립검사, 기술 제품 결함 즉시 수정/회귀, GitHub 직접 작업·ZIP 금지, main/SQL/버전/배포 임의 변경 금지.
- `QA_284_POST_PROMOTE.cjs`와 `qa-284-final.yml` 통한 285 시작본 최종 14항목 Chromium 인계검사 대기.
