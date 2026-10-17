# ★★★근무모아 2차·깊이 8 — 285 완료 / 286 다음

- 마지막 공식 **2-8-285 COMPLETE/CLEAN(Chromium/모의 RPC 범위)**, 다음 **2-8-286**, 누적 제품 결함 **540종**(285 신규 0종).
- [285 GitHub Actions 21/21 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39005214654) 첫 실행부터 전체 성공, 실제 **1210초(20분 10초)**, **10×23=230 반복 회귀 PASS / 실패 0건**.
- 285 신규 **2026~27 주·야·일근 및 연가 소정근로시간 5유형×730일×Chrome6환경 독립 검사 111,042 PASS / 0 FAIL**, 야간자정·시간연가·중복차감·2026/9/12 경계 포함.
- 기존 284 대휴명단 50,694, 283 교대달력 57,222, 282 시각 988,956, 281 제외기간 658,206, 280 장기재직 1,734,246 등 이전 회귀 유지.
- **286 시작본** `qa-handoff/index.before-2-8-286.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**, 제품 index.html 및 285 시작/작업본과 완전 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-285_REPORT.md`, `QA_2-8-285_SHA_MANIFEST.json`, `QA_285_EVIDENCE_AUDIT.json` 확인. WIP는 이전 진행 증거.
- 이전 QA 오류 **265/270/273/276/282/284** (특히 284 최초 QA SyntaxError RED) 이력 보존·소급 완료/삭제 금지.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 운영 Supabase/RLS 실제 다중사용자 인증, 실물 Android/iOS 기본 카메라/파일선택, 지속 BFCache, 운영 백업·복원 직접 미검증.
- 286도 High·깊이8·실제20분 이상·20분 내 KST 보고·새 독립검사·문제 즉시 수정/회귀, GitHub 직접 연결, ZIP 금지, main/SQL/APP_VERSION/배포 임의 변경 금지.
- [286 인계검사 14 PASS / 0 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/39006591036) 완료. `QA_285_POST_PROMOTE.cjs` 및 `qa-285-final.yml` 결과 보존.
