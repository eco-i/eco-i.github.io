# 근무모아 2차·깊이8 종합검수 — 2-8-288

**공식 완료: COMPLETE/CLEAN (Chromium·모의 RPC 범위). 다음 2-8-289. 신규 확정 제품 결함 0종, 누적 540종.**

## 실제 20분 이상 High·깊이8 검수
- [288 GitHub Actions 39013935140](https://github.com/eco-i/eco-i.github.io/actions/runs/39013935140) **24/24 Job SUCCESS**, 초기 실행부터 성공. 불변 제품 SHA `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` 기준 **실제 1249초 (20분 49초)**, **8회×23종=184묶음 PASS / 0 FAIL**. 최종 로그 `QA288_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1249`.
- 신규 `QA_288_HOLIDAY_WORK_RPC_ORACLE.cjs`: 실제 Chromium PC/모바일·한국/UTC/LA **6환경**, 2026~27 **730일**, **4,380 사례**, **96,384 PASS / 0 FAIL**. 휴일근무 4시간당 30분 차감, 1/239/240/241/479/480/481분 등 경계, HH:MM·초·소수초, net_minutes 위변조, 중복 ID·직원/날짜, 타인 직원 범위, 날짜 경계, 누락·위조 updated_at, 미래 직원 소유권 검사.
- 기존 287 인사발령 1,261,446 PASS, 286 부재 1,007,406 PASS, 285 연가 111,042 PASS, 284 대휴 50,694 PASS, 283 교대 57,222 PASS, 282 타임스탬프 988,956 PASS, 281 제외순열 658,206 PASS, 280 장기재직 구간 1,734,246 PASS, 279 제외기간 636,354 PASS, 278 RPC행 245,406 PASS, 277 배지 205,884 PASS, 276 모달 개인정보 1,326 PASS, 275 뷰어 10,518 PASS, 274 힌트 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 원본 cross-tab 168 PASS; 사전 무결성 16 PASS.
- 기존 UI·백엔드 모의·권한·지문사진·모바일·세션·휴가·백업복원 모의 **23종 × 8회**, 범위 축소 없이 완료. 통합 독립검사 18 검사군 PASS / 0 FAIL.

## 결함·이전 QA 실패 원본 보존
- 신규 확정 제품 결함 **0종**, 누적 **540종**, 제품 HTML 변경 없음.
- 265 raw SESSION_KEY/tombstone, 270 picker 초기 RED, 273 두 탭 harness 취소, 276 preflight/modal RED/cross-tab timeout, 282 첫 cross-tab navigation context RED, 284 첫 QA SyntaxError RED 이력은 원본 GitHub 실행/기록으로 보존. 소급 성공 처리 또는 삭제 금지.
- 실제 운영 Supabase/RLS 다중 인증, 물리 Android/iOS 카메라·기본 picker, 지속 BFCache, 운영 DB 백업/복원은 직접 미검증. CLEAN 판정은 Chrome PC·모바일 emulation/모의 RPC 범위 한정.

## GitHub/운영 보호
- `index.html`, 288 시작/작업본, **289 시작본** 모두 **1,175,136 bytes**, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 동일.
- 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 공식 기록 2026-10-17T16:54:09.089+09:00 KST. 289도 High·깊이8·실제20분 이상·20분 이내 진행 보고·새 독립검사·결함 즉시 수정/회귀·GitHub 직접작업·ZIP 금지·main/SQL/버전/운영배포 무단 변경 금지.

## 289 시작본 최종 인계 검사
- [288 post-promote GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39015373395) **14 PASS / 0 FAIL**: 4개 HTML 소스 SHA/바이트 동일성, 288 공식 state·manifest, JavaScript 파싱, 실제 Chrome PC/모바일 360/390/1280px 초기 부팅 검증.
- 완료 검증 2026-10-17T16:55:25.305+09:00 KST. 265/270/273/276/282/284 기존 QA RED 원본 기록 보존.
