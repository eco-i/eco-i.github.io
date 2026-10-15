# 근무모아 2차·깊이8 공식 QA — 2-8-263 CLEAN

**공식 완료:** 2-8-263 CLEAN. **다음:** 2-8-264. 이번 신규 독립 제품 결함 0종, **누적 540종** 유지.
**검수 체계:** High·깊이8, headless real Chromium PC/mobile emulator, mock RPC; 운영 환경 직접 검증과 구분.

## 실행 및 증빙
- 본검수: [GitHub Actions Run 38696601055](https://github.com/eco-i/eco-i.github.io/actions/runs/38696601055) — **6개 작업 모두 SUCCESS**. 작업시작 2026-10-15 16:06:52 KST, 전체 워크플로 종료 16:28:07 KST.
- **실제 장시간 심층회귀: 16:07:11~16:28:03 KST = 1,252초 (20분52초)**. 9회 × 23묶음 = **207 회귀 스위트 PASS, FAIL 0**. Full Chromium, 백업/복원, 로그인/RPC, 지문 촬영/선택/압축, 2026~2027 달력, 관리자/권한, 시간대/저장소 오류 반복.
- 신규 UI 독립검수: **1,401 PASS/0 FAIL**, 9 브라우저 환경에서 24개월 × 9 = 216 달력 페이지, 화면 전환/ARIA/키보드, 12 저장소 제한 시나리오. Job `116294498026`.
- 공식 소스 무결성: **21 PASS/0 FAIL** (SHA256/1,175,136bytes/JS/버전/인계), Job `116294497819`.
- **추가교차검수**: [8개 독립 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38697446935) **20,301 PASS/0 FAIL** (261 인증·근무 730일·대휴·연차·텍스트 확대·접근성·2027 24절기, 262 브라우저 경계검사).
- **다중탭 독립회귀**: [RED/GREEN+restore race](https://github.com/eco-i/eco-i.github.io/actions/runs/38697137521) **80+480=560 PASS/0 FAIL**.
- Full/Backend/Frontend 병렬 Jobs 역시 SUCCESS (`116294498222` / `116294498107` / `116294498195`).
- 신규 검사 1,401, 교차검사 20,301, 다중탭 560, 무결성 21은 중복이 있을 수 있는 검사 통과 횟수이며 서로 다른 **제품 결함 수**로 세지 않음.

## 제품·변경관리
- 신규 제품 결함 없음. QA 스크립트/보고서만 qa-2-8 브랜치에 추가. 제품 본체 바이트 수정 없음.
- `index.html`, 263 시작본 및 작업본, 264 시작본 모두 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- SQL 수정·운영 배포 없음. APP_VERSION `ver20260927-0944` 유지. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지.

## 테스트 범위 제한
운영 Supabase/RLS 실제 다중계정, 물리 Android 카메라와 OS 파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원 미검증. Chrome PC/mobile emulator와 stub RPC로 본 운영 환경을 완전히 증명하지 않음.

## 다음
다음 시작 `qa-handoff/index.before-2-8-264.html`; High·깊이8·각 블록 실검수 20분 이상·20분 이내 KST 중간보고, 결함 발견 즉시 수정+RED/GREEN 회귀. ZIP 금지; main·SQL·APP_VERSION·배포 무단 변경 금지.
