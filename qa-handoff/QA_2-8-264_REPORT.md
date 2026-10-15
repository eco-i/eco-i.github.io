# 근무모아 2차·깊이8 공식 검수 — 2-8-264 CLEAN

## 공식 판정
- **2-8-264 COMPLETE/CLEAN**, 다음 **2-8-265**, 신규 독립 제품 결함 **0종**, 공식 누적 **540종**.
- 검수 조건: High, 깊이 8, GitHub Actions의 실제 Ubuntu headless Chromium PC/mobile 에뮬레이션과 mock RPC.
- [본검수 전체 6 Jobs 성공](https://github.com/eco-i/eco-i.github.io/actions/runs/38702058849): 2026-10-15 **16:55:36–17:17:14 KST**.
- **지속 실검수: 16:55:44–17:17:11 KST, 1,287초(21분27초)**, 10회 × 23개 = **230개 회귀 테스트 묶음 PASS / 0 FAIL**. 매 라운드 264 고유 브라우저 경계테스트도 추가 반복 통과.
- 264 신규 독립검사: 24개월 9환경(2026~27, 216개 달력 렌더), keyboard/ARIA/모바일, 저장소 거부 12환경 **1,401 PASS/0 FAIL**; 3시간대·3뷰포트/대정비 예외·KST 경계·XSS escape **765 PASS/0 FAIL**. 독립검증 합 **2,166 PASS/0 FAIL** (Job 116312361623).
- 인계·소스·JS 무결성 검사 **21 PASS/0 FAIL** (Job 116312361517).
- [과거 독립계약 8개 교차 검증](https://github.com/eco-i/eco-i.github.io/actions/runs/38702058894): 2026~27 교대, 로그인, 공휴일 대휴, 연차, 확대/접근성, 2027년 절기, 경계 테스트 **20,301 PASS/0 FAIL**.
- [다중탭 세션 경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38702058845): **RED/GREEN 80 + 복원경합 480 = 560 PASS/0 FAIL**.
- Full/Backend/Frontend 병렬 3 Job 전부 성공; 지문 촬영/파일선택·이미지 압축, 백업/복원, 권한·계정, 근태/대휴/달력 및 RPC 회귀 포함. 대량 소스 및 로그는 Actions 내 처리.

## 변경 관리
- 본체 HTML은 수정하지 않았으며, `index.html`·264 기준본·264 작업본·265 시작본 동일 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- QA 스크립트·Actions·검수 이력만 `qa-2-8` 업데이트. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로; SQL·APP_VERSION(`ver20260927-0944`)·운영 배포 무변경.
- PASS 횟수는 검사 횟수이며 독립 결함 건수로 합산하지 않음.

## 명시적 실환경 미검증
- 운영 Supabase 실제 다중계정/RLS, 물리 Android 카메라·OS 파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원 직접 확인하지 않음.
- 이러한 제한을 CLEAN의 실운영 보증으로 해석하지 않음.

## 다음
`qa-handoff/index.before-2-8-265.html`에서 2-8-265 시작. High·깊이8, 블록별 실제20분 이상, 20분 이내 KST 중간보고, 오류 발견 즉시 수정 후 RED→GREEN 회귀. ZIP 금지; main·SQL·APP_VERSION·배포 무단 변경 금지.
