# 근무모아 2차·깊이8단계 종합검수 — 2-8-285

**공식 판정: COMPLETE/CLEAN (Chromium PC/모바일·모의 RPC 검증 범위). 다음 2-8-286, 신규 확정 제품 결함 0종, 공식 누적 540종.**

## 실제 20분 이상·High·깊이8
- [285 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39005214654) **21/21 Job SUCCESS**, 초기 실행부터 실패 없이 종료. 불변 제품 SHA `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, 실제 **1210초 (20분 10초)** 지속검사, **10회 × 23종 = 230묶음 PASS / 0 FAIL**. 최종 로그 `QA285_SOAK_FINAL_PASS rounds=10 suites=230 actual_seconds=1210`.
- 285 신규 `QA_285_ANNUAL_LEAVE_WORKTIME_ORACLE.cjs`: 실제 Chromium PC/모바일 × 한국·UTC·LA **6환경**, 2026~2027 730일, A/B/C/D 및 일근 **5개 근무유형**의 주/주2/야/일근 근무 구간, 자정 넘는 야간 20~08, 종일 연가 차감, 09~11·22~02 시간연가, 중복 차감 병합 및 2026-09-12 자동적용 경계 대조. **111,042 PASS / 0 FAIL**.
- 이전 284 대휴 직원명단 50,694 PASS, 283 교대근무 57,222 PASS, 282 시각 동등성 988,956 PASS, 281 제외 순열 658,206 PASS, 280 장기재직 1,734,246 PASS, 279 제외 636,354 PASS, 278 RPC행 245,406 PASS, 277 지문 달력 205,884 PASS, 276 개인정보 1,326 PASS, 275 뷰어 10,518 PASS, 274 optimistic 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 원본 168 PASS, 285 사전 무결성 16 PASS.
- 23종 실브라우저·모의 RPC 전면회귀를 10회 반복(기존 최소 8회보다 2회 추가). UI·모바일·권한·세션·사진·백업·복원 모의 검증 범위를 축소하지 않음.

## 결함·과거 실패 이력
- 신규 확정 제품 결함 **0종**, 공식 누적 **540종**. 제품 본체 HTML은 수정하지 않음. 285 독립 QA 코드·워크플로·증거/인계 기록만 qa-2-8 브랜치에 추가.
- 과거 265 raw SESSION_KEY/tombstone, 270 picker 초기 RED, 273 2탭 하네스 취소, 276 preflight/모달 오라클 RED/cross-tab 시간초과, 282 처음 cross-tab navigation RED, 284 신규 QA 코드 SyntaxError 최초 RED를 모두 GitHub 이력으로 보존. 소급 PASS 처리나 삭제 금지.
- 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 기본 카메라/파일 picker, 지속 BFCache, 운영 DB 백업/복원 미검증. Chromium/모의 RPC 범위 CLEAN 밖으로 확대 주장 금지.

## 무결성 및 배포 보호
- `index.html`, 285 시작/작업본 및 **286 시작본** 모두 1,175,136 bytes, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 동일.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 공식 기록 2026-10-17T14:31:35.094+09:00 KST. 286에서도 High·깊이8·실제20분 이상·20분 이내 KST 중간보고·새 독립검사·결함 즉시 수정/회귀·GitHub 직접 작업, ZIP 금지, main/SQL/버전/운영배포 임의 변경 금지.

## 286 시작본 최종 인계 검사
- [285 post-promote GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39006591036) **14 PASS / 0 FAIL**: 4개 제품 HTML의 SHA 및 바이트 크기, 공식 상태/매니페스트, JS 스크립트 구문, 실제 Chrome 360·390·1280px PC/모바일 초기부팅 확인.
- 2026-10-17T14:32:40.110+09:00 KST 검사 완료. 265/270/273/276/282/284 첫 QA 실패 이력 원본 유지.
