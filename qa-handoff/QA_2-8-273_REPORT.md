# 근무모아 2차·깊이 8 종합검수 — 2-8-273

**공식 판정: 2-8-273 COMPLETE/CLEAN (실제 검증한 Chromium/모의 RPC 범위). 다음 2-8-274, 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이 8·실제 20분 이상 근거
- [최종 273 검수 Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38871054655) **9/9 Jobs 전부 SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle.
- 같은 불변 제품 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`을 대상으로 **실제 1216초(20분 16초)** 지속검수: **8회 × 23 스위트 = 184묶음 PASS, 0 FAIL**. 로그 `QA273_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1216`.
- **신규 실제 Chrome 앱의 wire() 이벤트 경로**: PC/모바일 × 한국·UTC·LA 6개 환경에서 파일 선택 change 중복, cancel 중복, change 누락 watchdog 회복, actor/날짜/탭/세션 epoch 변경, logout tombstone으로 예전 업로드 컨텍스트 폐기 검사 **180 PASS/0 FAIL**. 이 QA는 업로드 끝단만 stub 처리했으며 실제 Supabase 업로드로 주장하지 않는다.
- 272 RPC 상태·범위·ISO 날짜/시간대·지문 타임스탬프 fail-closed **498 PASS**, 271 실제 2탭 세션 보호 **168 PASS**, 독립 2개년 교대/대정비 **30,606 PASS**, 날짜 속성 **26,430 PASS**, 지문 날짜 **21,930 PASS**, UI·월뷰 **1,401 PASS**, 시간대/Chrome 경계 **765 PASS**, 이미지 **474 PASS**, 세션 보호 **60 PASS**, 무결성 인계 **15 PASS** 모두 관측 실패 0.
- 기존 full/backend/frontend의 근무표·대정비·초과근무·인사/연차·관리권한·RPC·백업/복원 모의·사진 입력·세션보안·이벤트 등 반복 23개 회귀 스위트 성공.

## 최초 QA 이벤트 하네스 시도·예외 이력 삭제 금지
- 첫 [273 Run 38870038990](https://github.com/eco-i/eco-i.github.io/actions/runs/38870038990)은 원본 새 파일 선택 테스트 하네스에서 두 탭을 동시에 연 상태로 검사했고, 전면 탭/백그라운드 조건이 불명확하여 picker-lifecycle 및 independent Jobs 취소 기록이 발생. 별개 지속 반복 회귀는 실제 **1,225초, 10×23=230묶음 PASS**였으나 이 Run을 완전 성공으로 집계하지 않는다.
- [두 번째 QA 시도](https://github.com/eco-i/eco-i.github.io/actions/runs/38870690285)에서 foreground 처리만 보정했으나 두 탭 경쟁으로 picker/independent 취소 기록을 보존한다. 실제 사용 중인 파일 선택 탭은 단독 전면 탭으로 유지하고 별도 `QA_271_CROSS_TAB_SESSION.cjs`에서 두 탭 보안 회귀를 수행하는 최종 하네스로 분리했다. 새 [최종 Run](https://github.com/eco-i/eco-i.github.io/actions/runs/38871054655)의 9 Job 모두 성공 및 180 PASS로 교차 확인. QA fixture 이슈를 임의의 제품 결함으로 계상하지 않음.
- **265 기존 예외 유지:** 정상 로그아웃과 다른 raw localStorage `SESSION_KEY` 직접 삭제/폐기 마커 누락 레거시 검사에서 간헐 실패가 발생한 역사적 기록을 해결된 것으로 지우거나 원본 검사로부터 오인하지 않는다.
- 270 picker 하네스 초기 로그인·비동기 초기화 오류로 인한 RED trial 로그도 보존. 제품 결함 재현·RED/GREEN 테스트 수정 여부를 분리한다.

## 형상·한계·다음 인계
- 본 블록의 신규 확정 제품 결함 **0종**. 제품 `index.html` 자체와 SQL/APP_VERSION/운영 배포 변경 없음. 273 QA 테스트 스크립트·워크플로 및 문서만 `qa-2-8`에 반영.
- `index.html`, 273 시작/작업본, 274 시작본의 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, 동일 Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, APP_VERSION `ver20260927-0944` 불변.
- 미검증: 실운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS native picker·카메라, 영속 BFCache, 운영 데이터베이스 백업·복원.
- 2026-10-16T17:25:04.423+09:00 기준 공식 인계. **다음 2-8-274**, High·깊이8·20분 이상 실제 검수·20분 이내 KST 진행보고·기술 결함 즉시 수정과 회귀·ZIP 금지·main/SQL/APP_VERSION/배포 무단 변경 금지. 채팅에는 핵심만, 검수 원본은 GitHub Actions 및 인계 파일 유지.
