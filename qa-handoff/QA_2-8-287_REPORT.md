# 근무모아 2차·깊이8 종합검수 — 2-8-287

**공식 COMPLETE/CLEAN (Chromium + 모의 RPC 범위). 다음 2-8-288. 신규 확정 제품 결함 0종, 공식 누적 540종.**

## High·깊이8·실제 20분 이상
- [287 GitHub Actions 23/23 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39011420967); 처음부터 전체 통과. **1325초 (22분 05초)** 지속검사, **9회×23종=207묶음 PASS / 0 FAIL**. 최종 로그 `QA287_SOAK_FINAL_PASS rounds=9 suites=207 actual_seconds=1325`.
- 신규 독립 `QA_287_PERSONNEL_TIMELINE_ORACLE.cjs`: 실제 Chromium PC·모바일 × 서울·UTC·LA **6환경**, 2026~2027 730일, 4개 조·6개 날짜/발령 패턴 **105,120 시나리오**, **1,261,446 PASS / 0 FAIL**. 인사발령 적용일, 배치 생성시각·동일 시각 action_id 우선, 무효·미래 발령 차단, 조 배치, 휴직·전출·퇴직, sort_order 0, batch 제외선택, 타인 ID 격리 테스트.
- 기존 286 부재 판정 1,007,406 PASS, 285 연가 111,042 PASS, 284 대휴 인원 50,694 PASS, 283 교대 57,222 PASS, 282 시각 988,956 PASS, 281 제외 순열 658,206 PASS, 280 장기재직 1,734,246 PASS, 279 제외 636,354 PASS, 278 지문RPC행 245,406 PASS, 277 지문 배지 205,884 PASS, 276 개인정보 1,326 PASS, 275 뷰어 10,518 PASS, 274 optimistic 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS. 287 사전 SHA/코드 무결성 16 PASS.
- 기존 23종 Chrome UI/세션/권한/백엔드모의 RPC/휴가/지문/백업복원 등의 회귀 범위를 줄이지 않았으며 9회 반복.

## 결함·QA 이력
- 287 신규 확정 제품 결함 0종, 누적 540종, 제품 HTML 본체 변경 없음.
- 과거 265 tombstone, 270 picker RED, 273 두탭 harness cancellation, 276 preflight/modal RED 및 cross-tab timeout, 282 navigation context RED, 284 QA 스크립트 SyntaxError 첫 실행 RED 기록 보존. 소급 PASS 또는 삭제 금지.
- 운영 실제 Supabase/RLS 다중계정 인증, 실물 Android/iOS 카메라·파일선택, 지속 BFCache, 운영 DB 백업·복원 직접 미검증. 현재 CLEAN 판정을 그 영역으로 확대하지 않음.

## GitHub·보호·인계
- `index.html`, 287 시작/작업본, **288 시작본** 모두 1,175,136 bytes, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 동일.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로. APP_VERSION `ver20260927-0944`, SQL 변경 없음, 운영 배포 없음.
- KST 2026-10-17T16:15:42.312+09:00. 288도 High·깊이8·실제 20분 이상·20분 이내 KST 중간 보고·새 독립검사·발견 제품 결함 즉시 수정/회귀·GitHub 직접작업·ZIP 제안 금지·main/SQL/버전/운영 배포 무단 변경 금지.
