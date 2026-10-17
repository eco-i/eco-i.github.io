# 근무모아 2차·깊이8 종합검수 — 2-8-289

**공식 COMPLETE/CLEAN (Chromium PC/모바일·모의 RPC 검증 범위). 다음 2-8-290. 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이8·실제 20분 이상
- [289 GitHub Actions 전체 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/39015881283) **25/25 Job SUCCESS**, 초기 실행 전체 성공. 실제 **1250초 (20분 50초)**, **8회 × 23종 = 184묶음 PASS / 0 FAIL**. `QA289_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1250`.
- 신규 `QA_289_OVERTIME_RPC_CONTRACT_ORACLE.cjs`: 실제 Chrome 데스크톱/모바일 × 서울·UTC·LA **6환경**, 2026~2027 **730일**, **4,380 독립 사례, 122,670 PASS / 0 FAIL**. 조출/야근 10분 단위 10~1,440분, 이른/늦은 슬롯, 직원/날짜/슬롯 중복 차단, 작업시간 위변조 및 완료 플래그 오염, timestamp 형식, 날짜/직원 범위, 월초일만 편성확정·중복 월 거부 검사.
- 기존 288 휴일근무 RPC 96,384 PASS, 287 인사발령 1,261,446, 286 부재 1,007,406, 285 연가 111,042, 284 대휴 50,694, 283 교대 57,222, 282 시각 988,956, 281 제외 순열 658,206, 280 장기재직 1,734,246, 279 제외 636,354, 278 RPC행 245,406, 277 배지 205,884, 276 민감정보 1,326, 275 뷰어 10,518, 274 힌트 5,850, 273 picker 180, 272 RPC 498, 271 cross-tab 168 PASS. 289 무결성 16 PASS.
- 실브라우저/모의 RPC 기존 23종 전면회귀 8회 및 통합 독립검사 **19 검사군 PASS / 0 FAIL**. UI·권한·휴가·지문사진·모바일·다중 탭·세션·백업복원 모의 범위 축소 없음.

## 제품 결함과 초기 QA 실패 이력 보존
- 신규 확정 제품 결함 **0종**, 공식 누적 **540종**, 제품 본체 HTML 변경 없음.
- 265 SESSION_KEY/tombstone, 270 picker 첫 RED, 273 2탭 하네스 취소, 276 preflight/모달 RED 및 cross-tab timeout, 282 첫 navigation context RED, 284 신규 QA SyntaxError 첫 RED 보존·소급 성공 처리 금지.
- 실제 운영 Supabase/RLS 인증 다중사용자, 실물 Android/iOS 사진 선택·카메라, 지속 BFCache 및 운영 DB 백업·복원 직접 미검증. CLEAN 판정은 Chrome/모의 RPC 범위에만 해당.

## GitHub·운영 분리·인계
- `index.html`, 289 시작/작업본, **290 시작본** 모두 1,175,136 bytes, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 완전 동일.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로, APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 공식 기록 KST 2026-10-17T17:25:43.066+09:00. 다음 290도 High·깊이8·실제20분 이상·20분 이내 진행보고·독립검사 추가·제품 결함 즉시 수정/회귀·GitHub 직접연결·ZIP 금지·main/SQL/버전/운영배포 임의 변경 금지.

## 290 시작본 최종 인계검사
- [289 후속 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/39017334548) **14 PASS / 0 FAIL**, 제품 4개 파일 SHA-256·바이트 크기, 289 공식 state/manifest, JavaScript 문법 및 실제 Chromium PC·모바일 360/390/1280px 부팅 검증.
- 2026-10-17T17:26:41.030+09:00 KST 최종 확인, 265/270/273/276/282/284 이전 RED 이력 보존.
