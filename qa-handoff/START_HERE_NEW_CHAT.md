# ★★★근무모아 2차·깊이 8 — 279 완료 / 280 다음

- 공식 마지막 **2-8-279 CLEAN(Chromium/모의 RPC 검증 범위)**, 다음 **2-8-280**, 누적 확정 제품 결함 **540종**(279 신규 0종).
- [279 GitHub Actions 15/15 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38927474536): 실제 **1242초(20분 42초)** 지속검수, **9×23=207묶음 PASS/0 FAIL**. 신규 장기재직휴가 인정 제외기간(중첩·인접·윤일 입사·연도경계·입사 3종×12 시나리오×730일×Chrome PC/mobile 3시간대) **636,354 PASS/0 FAIL**.
- 기존 278 RPC rows 245,406 PASS, 277 badge 205,884 PASS, 276 PIN 1,326 PASS, 275 viewer 10,518 PASS, 274 mutation 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`; 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`; SQL/운영 배포 없음.
- 280 시작 기준본 `qa-handoff/index.before-2-8-280.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 제품 index.html 및 279 시작/작업본 동일.
- 공식 `CURRENT_STATE.json`, `QA_2-8-279_REPORT.md`, `QA_2-8-279_SHA_MANIFEST.json`, `QA_279_EVIDENCE_AUDIT.json`. WIP 기록은 중간사항만.
- 역사적 QA 예외 보존: 265 raw localStorage SESSION_KEY 직접 삭제와 로그아웃 tombstone 누락의 간헐 QA 실패; 270 초기 picker 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 preflight 이전 번호 참조, modal oracle 78 RED 및 초회 cross-tab 제한시간 취소 후 단일 Job 재검증으로 복구. 초기 실패 이력 삭제 금지.
- 실운영/실물 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native picker/카메라, 영속 BFCache, 실운영 DB 백업·복원은 직접 검증하지 않음.
- 다음 280도 High·깊이8·실제20분+·20분 내 한국시각 진행보고·확정 제품 결함 즉시 수정+회귀. GitHub 연결 직접 사용, ZIP 요청/제안 금지, main/SQL/APP_VERSION/운영 배포 임의 변경 금지. 채팅창 코드/로그 과다 노출 지양.
