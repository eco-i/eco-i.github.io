# 근무모아 2차·깊이 8단계 종합검수 — 2-8-286

**공식 판정: COMPLETE/CLEAN (Chromium/모의 RPC 범위), 다음 2-8-287, 신규 확정 제품 결함 0종, 누적 540종.**

## 20분 실검수·8단계·High
- [286 Actions 39009514749](https://github.com/eco-i/eco-i.github.io/actions/runs/39009514749) **22/22 Job SUCCESS**, 최초 시도 통과. 실제 `1249`초 (**20분 49초**), **10×23=230묶음 PASS/0 FAIL**. 최종 GitHub 로그 `QA286_SOAK_FINAL_PASS rounds=10 suites=230 actual_seconds=1249`.
- 신규 `QA_286_ABSENCE_COVERAGE_ORACLE.cjs`: 실제 Chrome PC/모바일×서울/UTC/LA 6환경, 2026~2027 **730일**, A/B/C/D·일근 **5유형**, **240,900 시나리오**. 종일·부분·중복 시간부재, 주간/야간 분할, 다음 날 새벽, 유효하지 않은 동일 시작/종료, 타인 부재 구분을 독립 시간구간 union 오라클과 비교. **1,007,406 PASS / 0 FAIL**. `attendanceStatusForEmployeeDate`, `effectiveAbsenceForDate`, `fullAbsentIds` 일관성 확인.
- 이전 285 연가 111,042 PASS, 284 대체공휴일 50,694 PASS, 283 교대 57,222 PASS, 282 타임스탬프 988,956 PASS, 281 제외순열 658,206 PASS, 280 재직구간 1,734,246 PASS, 279 제외기간 636,354 PASS, 278 지문 RPC행 245,406 PASS, 277 배지 205,884 PASS, 276 개인정보 1,326 PASS, 275 뷰어 10,518 PASS, 274 optimistic 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS; 286 preflight 16 PASS.
- 모든 원본 23종 실브라우저/모의 RPC 전면 회귀를 10회 반복. 기존 폼·권한·세션·다중 탭·지문 사진·연차/근태·백업·복원 모의 검사 범위 유지.

## 제품·QA 실패 이력
- 286에서 신규 확정 제품 결함 **0종**, 누적 **540종**, 제품 본체 HTML 변경 없음.
- 265 SESSION_KEY tombstone, 270 picker 최초 RED, 273 두 탭 QA 취소, 276 preflight/모달 RED 및 cross-tab timeout, 282 cross-tab navigation context RED, 284 최초 QA 스크립트 SyntaxError RED 원본 로그 및 보고서 **보존**. 초기 실패의 소급 성공 처리 금지.
- 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 기본 카메라·파일 picker, 지속 BFCache 및 운영 DB 백업/복원 직접 미검증. CLEAN 범위 확대 주장 금지.

## GitHub 소스 및 인계
- `index.html`, 286 시작/작업본, **287 시작본** 모두 **1,175,136 bytes**, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 일치.
- 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 완료 기준 KST 2026-10-17T15:43:02.382+09:00. 다음 287도 High/깊이8/실제20분 이상/20분 내 진행보고/결함 즉시 수정·회귀/새 독립검사/직접 GitHub, ZIP 금지, main·SQL·APP_VERSION·운영 배포 임의 변경 금지.
