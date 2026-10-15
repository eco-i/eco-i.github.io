# 근무모아 2차·깊이 8 종합검수 — 2-8-265 공식 완료

**판정: 2-8-265 CLEAN (검증된 제품 경로), 다음 시작 2-8-266. 신규 확정 독립 제품 결함 0종, 누적 540종.**

## 근거: High · 깊이8 · 실제 20분 이상
- [공식 Actions 본검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667447): **최종 attempt 2, Full/Backend/Frontend/Integrity/Independent/Depth-eight 6개 Job 모두 SUCCESS**. 최초 attempt 1의 backend 실패는 하단에 예외 기록으로 명시.
- **실제 지속 회귀 1,239초(20분39초), 9회 × 23개 = 207개 묶음 PASS/0 FAIL**. 2026/2027 교대패턴·지문·이미지·RPC·로그인·복원·연차·권한·시간대·백업·저장소 안정성을 실제 headless Chromium PC/mobile 에뮬레이션으로 반복했다. 최초 시작 시각 2026-10-15 17:26:35 KST, 17:47:14 KST 종료.
- **265 독립 검사:** 730일 근무패턴 및 연도 경계 6개 브라우저 환경 **30,606 PASS/0 FAIL**, 24개월 UI·저장소 접근 9+12환경 **1,401 PASS/0 FAIL**, 시간대/대정비/입력 경계 **765 PASS/0 FAIL**, 소스·인계 21 PASS/0 FAIL.
- [교차 독립 8개 계약](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667340): 기존 261 근무·대휴·연차·접근성·2027 절기와 265 브라우저 경계 검사 **20,301 PASS/0 FAIL**.
- [다중탭 RED/GREEN](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667397): **80+480=560 PASS/0 FAIL**.

## 최초 backend 실패 및 원인 분리 (반드시 보존)
- 최초 본검수 attempt 1의 `QA_256_RESTORE_RACE` PC `shared-removal`에서 **1/40 FAIL**. 다른 탭에서 `localStorage` SESSION_KEY를 **직접 제거하되 로그아웃 폐기 표식을 기록하지 않은** 역사적 QA 하네스가, 지연 타이밍에서 옛 토큰을 다시 관측하며 preview RPC 실행을 문제로 보고함. 이 실패 자체를 삭제하지 않았으며 [원래 본검수 Run의 attempt 1](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667447/attempts/1)에서 확인 가능.
- [동일 레거시 검사 12회](https://github.com/eco-i/eco-i.github.io/actions/runs/38705876497) 480 PASS, [계측 검사 7회](https://github.com/eco-i/eco-i.github.io/actions/runs/38706615800) 280 PASS, [backend 9개 스위트 단독 재검](https://github.com/eco-i/eco-i.github.io/actions/runs/38706273479) SUCCESS였으나, [4-worker 레거시 direct-removal 스트레스](https://github.com/eco-i/eco-i.github.io/actions/runs/38707280992)에서는 다시 재현됐고 [계측 병렬검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38707469965)에서도 1 worker에서 재현됨. 따라서 이를 단순한 무오류·무조건 재현 불가로 기재하지 않음.
- 실제 제품의 `logout` 흐름은 **먼저 `staffAttendance_sharedLoggedOutToken_v1`에 정확한 토큰 폐기 표식을 기록하고 공유 토큰을 제거**함. 레거시 하네스는 이 필수 프로토콜을 우회해 실제 로그아웃과 다른 조건을 시험했음.
- [정확한 폐기 표식+토큰 제거를 사용한 4-worker×4회 검증](https://github.com/eco-i/eco-i.github.io/actions/runs/38707807331): **16회 × 40 = 640 PASS/0 FAIL**. 이후 `QA_265_ADAPT.cjs`의 QA 전용 변환만 이 실로그아웃 순서로 보정. **원본 역사적 테스트는 보존**, 제품 HTML/SQL/운영버전 무변경.
- [보정 이후 전체 backend 9개 스위트](https://github.com/eco-i/eco-i.github.io/actions/runs/38708113447) SUCCESS. 원래 본검수도 attempt 2의 backend 재실행 성공으로 **6 Jobs 모두 SUCCESS**.
- 이 기록은 **직접 저장소 키를 외부에서 강제 삭제하는 비정상 조건의 타이밍 불확실성**을 제거했다는 뜻이 아니다. 실사용 로그아웃 경로에서는 신규 제품 결함 미확정. 해당 외부 저장소 변조 시나리오는 미해결 제한으로 계속 추적하고 과장된 무결함 보증을 하지 않는다.

## 형상관리 및 실환경 한계
- `index.html`, 265 시작본/작업본, 266 시작본 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 제품 코드 수정 없음.
- 운영 main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지. APP_VERSION `ver20260927-0944`, SQL 수정 및 운영 배포 없음.
- 실운영 Supabase 인증/RLS 다중계정, 물리 Android 카메라/파일선택기, iOS Safari, 영속 BFCache, 운영 DB 실제 복원은 직접 검증하지 않았음.

## 다음
공식 다음 시작 `qa-handoff/index.before-2-8-266.html`. High·깊이8·20분 이상 실제 검수·20분 이내 KST 중간보고·발견 결함 즉시 수정/회귀. ZIP 금지, main·SQL·APP_VERSION·운영배포 무단 변경 금지.
