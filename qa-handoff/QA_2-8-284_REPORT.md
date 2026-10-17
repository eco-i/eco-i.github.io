# 근무모아 2차·깊이8 종합검수 — 2-8-284

**공식 판정: COMPLETE/CLEAN (실제 Chromium·모의 RPC 범위, 최초 QA 스크립트 RED 기록 보존). 다음 2-8-285, 신규 확정 제품 결함 0종, 공식 누적 540종.**

## High·깊이 8·실제 20분 이상
- [284 수정 후 메인 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39002978396) **20/20 Job SUCCESS (첫 정상 스크립트 시도)**. 불변 제품 SHA `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` 기준 실제 **1269초 (21분 09초)** 지속 검사, **8×23종=184묶음 PASS / 0 FAIL**. 최종 로그 `QA284_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1269`.
- 신규 독립 `QA_284_SUBSTITUTE_HOLIDAY_ROSTER_ORACLE.cjs`: 실 Chrome PC·모바일 × 서울·UTC·LA **6환경**, **2026~2027 대체공휴일 11개 × 입·퇴사 경계 직원명단 96순열**: 근무자 동일시 대휴 4/1.5/5.5시간 합산, 근무자 변경시 인물별 분할, 경계날짜 범위 및 4조 교대 오라클과 대조. **50,694 PASS / 0 FAIL**.
- 기존 283 교대 달력 57,222 PASS, 282 타임스탬프 988,956 PASS, 281 장기재직 제외 순열 658,206 PASS, 280 장기재직 구간 1,734,246 PASS, 279 제외 636,354 PASS, 278 지문 RPC 245,406 PASS, 277 지문 배지 205,884 PASS, 276 개인정보 1,326 PASS, 275 뷰어 10,518 PASS, 274 optimistic 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 원본 168 PASS, 284 사전 무결성 16 PASS.
- 기존 23종 전면 회귀 8회 반복, 기본 프론트/백엔드·지문사진·모바일·세션·권한·휴가·백업/복원 모의 유지. 수정 후 모두 GREEN.

## 최초 QA 구문 오류 이력 — 보존 필수
- [첫 GitHub Actions RUN 39002924389](https://github.com/eco-i/eco-i.github.io/actions/runs/39002924389) **FAILED**: 신규 QA 파일 `QA_284_SUBSTITUTE_HOLIDAY_ROSTER_ORACLE.cjs`의 else 블록 닫는 괄호 누락, `SyntaxError: Unexpected token 'finally'`. `substitute-roster-oracle`, `independent` 2개 실패, 의존 `cross-tab` 1개 SKIPPED, 그외 17개 SUCCESS. **제품 HTML 결함 아님**. `QA_284_INITIAL_QA_FAILURE.json`과 원본 GitHub 로그에 최초 RED 영구 보존.
- QA 파일 수정 커밋 `2c5effa126453e338d918735d1af0bd6b5959f41`. **새 수정 후 워크플로 39002978396 20/20 SUCCESS**를 별도로 확보했으며 초기 실패를 소급 PASS로 처리하지 않음.
- 265 raw SESSION_KEY/tombstone, 270 picker 초기 RED, 273 2탭 QA 취소, 276 preflight/모달 78 RED/cross-tab 시간초과, 282 cross-tab 초기 navigation context RED 등 기존 이력도 보존.

## 무결성·운영 분리
- `index.html`, 284 시작/작업본, **285 시작본** 모두 1,175,136 bytes, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 일치. 제품 HTML 자체 수정 없음.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 운영 Supabase/RLS 인증 다중 사용자, 물리 Android/iOS 기본 카메라·파일 선택, 지속 BFCache, 운영 DB 백업·복원 직접 미검증. CLEAN은 Chrome PC/모바일 에뮬레이션·모의 RPC 범위에만 해당.
- 공식 기록 2026-10-17T13:55:35.678+09:00 KST. 다음 285도 High·깊이8·블록마다 실제20분 이상·20분 내 진행보고·새 독립 검사·기술 결함 즉시 수정/회귀·GitHub 직접 작업·ZIP 금지·main/SQL/APP_VERSION/배포 임의 변경 금지.

## 285 시작본 최종 인계검사
- [284 post-promote GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39004388509) **14 PASS / 0 FAIL**: 4개 제품 HTML의 SHA·실제 byte 길이, 284 공식 상태·SHA manifest, 스크립트 구문, Chromium PC/모바일 360/390/1280px 실제 부팅을 검사함.
- 결과 확인 2026-10-17T13:56:56.143+09:00 KST. 284 첫 QA 구문 실패 및 265/270/273/276/282 과거 RED 이력 보존.
