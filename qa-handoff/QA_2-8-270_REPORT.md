# 근무모아 2차·깊이8 공식 종합검수 — 2-8-270

**공식 판정 2-8-270 COMPLETE/CLEAN (검증된 제품 및 모의 환경 범위), 다음 2-8-271. 신규 확정 제품 결함 0종, 누적 제품 결함 540종.**

## High·깊이8 실검수 증빙
- [270 보정 후 6개 Job 전체 성공](https://github.com/eco-i/eco-i.github.io/actions/runs/38743321207). 같은 기준본 SHA `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`의 실제 Ubuntu headless Chromium PC/mobile·mock RPC 검사.
- **실제 지속검수 1,278초(21분 18초)**, 10회 × 23개 기존 회귀 스위트 = **230묶음 PASS / 0 FAIL**. [기록](https://github.com/eco-i/eco-i.github.io/actions/runs/38743321207)의 `QA270_SOAK_FINAL_PASS rounds=10 suites=230 actual_seconds=1278`.
- 신규 지문 카메라/파일선택기 세션 소유권·로그인 토큰·세션 epoch·날짜/상세화면 변경·취소 정리·로그아웃 폐기 표식, 6개 Chrome PC/mobile·3 시간대에서 **114 PASS/0 FAIL**.
- [지문 picker change/cancel 이벤트 독립검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38744629389) **66 PASS/0 FAIL**, 초기화 완료 후 브라우저 synthetic 이벤트 검증. 실제 Android/iOS OS 선택창 직접 검증이 아님.
- 기존 이미지 입력 JPEG 압축 및 파일명/용량 제한 **474 PASS**, 지문 기록 730일 정합성 **21,930 PASS**, 날짜 730일 속성 **26,430 PASS**, 2년치 교대/대정비 **30,606 PASS**, UI/모바일 **1,401 PASS**, 시간대 경계 **765 PASS**, 세션보호 **60 PASS**, 소스·무결성 **21 PASS**, 모두 실패 0.
- [8계약 교차검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999006) SUCCESS, [다중탭 RED/GREEN](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999183) 80+480=**560 PASS**, [실제 logout 4병렬](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999174) **640 PASS**, [지문 RPC](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999085) **156 PASS**, [JPEG fallback 모의 크기](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999129) **186 PASS**.
- 새 270 검증 준비 중 추가로 시작한 [중복 회귀실행](https://github.com/eco-i/eco-i.github.io/actions/runs/38749151235)은 위 공식 21분18초 검수와 별개. 확인 당시 independent/integrity/full/backend/frontend 5개 PASS, 지속 Job은 별도 진행 중이므로 완료로 집계하지 않았다.

## 초기 RED 및 QA 오라클 수정 기록 — 삭제 금지
- [최초 270 full run](https://github.com/eco-i/eco-i.github.io/actions/runs/38742999298)는 신규 `QA270_PICKER_CONTEXT`에서 **90 PASS/24 FAIL**. 검사 하네스가 실제 로그인에서 권한을 판단할 때 필요한 localStorage 세션 토큰을 설정하지 않았으며, 제품 자체 결함으로 판정하지 않음. 이후 실제 로그인 초기화 시퀀스를 반영한 보정 검수에서 **114 PASS/0 FAIL**, 전체 6 Jobs SUCCESS.
- picker 이벤트 별도 진단 [trial 1](https://github.com/eco-i/eco-i.github.io/actions/runs/38743920973) **41 PASS/25 FAIL**, [trial 2](https://github.com/eco-i/eco-i.github.io/actions/runs/38744252108) **50 PASS/16 FAIL**. 앱 wire/Web Locks 및 비동기 초기화 완료 이전 synthetic 이벤트 dispatch, QA 세션 타이머 영향 등 시험 하네스 오류. 이벤트 시점·세션 초기화 보정 후 [최종](https://github.com/eco-i/eco-i.github.io/actions/runs/38744629389) **66 PASS/0 FAIL**. 초기 실패 증빙은 계속 보존.
- 265의 RAW localStorage 세션키 직접 삭제/정식 logout 폐기 표식 누락 간헐 QA 실패 이력도 유지. 실사용 토큰 폐기 경로와 구별.
- 이 결과는 물리 단말·native OS picker 또는 실제 운영 DB/실계정 멀티유저 동작까지 보증하지 않는다.

## 형상관리·다음 인계
- 제품 본체 `index.html`·270 기준본·270 작업본·271 시작본 모두 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 실제 앱 제품 수정 없음.
- QA 변경만 `qa-2-8`에 기록. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경·운영 배포 없음, APP_VERSION `ver20260927-0944` 유지.
- 미검증: 운영 Supabase/RLS 다중계정·실인증, 물리 Android 카메라/파일 선택 UI, iOS Safari, 영속 BFCache, 운영 DB 백업/복원.
- 다음 2-8-271 시작 파일 `qa-handoff/index.before-2-8-271.html`. High·깊이8, 블록당 실제20분+ / 20분 이내 KST 중간보고 / 오류 즉시 수정 후 RED-GREEN 회귀, ZIP 금지, 운영 main·SQL·APP_VERSION·배포 무단 변경 금지.
