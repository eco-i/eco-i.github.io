# ★★★근무모아 2차·깊이 8 — 283 완료 / 284 다음

- 마지막 공식 **2-8-283 COMPLETE/CLEAN (Chromium/모의 RPC 범위)**, 다음 **2-8-284**, 공식 누적 제품 결함 **540종**(283 신규 0종).
- [283 GitHub Actions 19/19 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38998568240) 첫 시도에 전체 성공, 실제 **1249초(20분 49초)** 지속검사, **8×23=184 반복 회귀 묶음 PASS/0 FAIL**.
- 283 신규 **2026~2027 4조 8일근무·2026 10/1~15 대정비·대체공휴일·24개월 UI 독립 검증 57,222 PASS / 0 FAIL(Chrome 6환경)**.
- 기존 282 타임스탬프 988,956, 281 제외기간 658,206, 280 장기재직 1,734,246, 279 636,354, 278 RPC 245,406, 277 지문 달력 205,884 PASS 등을 유지.
- **284 시작본** `qa-handoff/index.before-2-8-284.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. 제품 index.html 및 283 시작/작업본과 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-283_REPORT.md`, `QA_2-8-283_SHA_MANIFEST.json`, `QA_283_EVIDENCE_AUDIT.json`; WIP는 당시 이력.
- 과거 QA 실패 기록 265/270/273/276 및 **282 첫 cross-tab navigation context RED** 보존. 초기 QA 실패를 소급 성공으로 처리하거나 기록 삭제 금지.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 카메라·기본 picker, 지속 BFCache, 운영 DB 백업·복원 직접 미검증.
- 284도 High·깊이8·실제20분 이상·20분 내 KST 보고·신규 독립 검증, 발견 기술 결함 즉시 수정/회귀, GitHub 직접 연결, ZIP 금지, main/SQL/APP_VERSION/운영 배포 임의 변경 금지, 채팅 로그 요약.
- `QA_283_POST_PROMOTE.cjs` 및 `.github/workflows/qa-283-final.yml`로 284 시작본 후속 인계 14항목 Chrome 검사 대기.
