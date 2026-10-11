# 2-8-238 심층검수 중간 상태 (미완료)

- 프로젝트 근무모아 / 2차 깊이8 High. 직전 공식 완료 2-8-237, 누적 결함 510종.
- **현재 238 미완료**. 238을 239로 넘기거나 공식 누적에 선반영하지 않는다.
- 원본 기준 `qa-handoff/index.before-2-8-238.html`, SHA-256 `f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f`, 1,161,672 bytes.
- 신규 실제 재현 제품 결함 **1종**: 모바일 기기에 기존 sessionStorage 레거시 token A가 중복 존재하는 상태에서 다른 탭이 공유 토큰을 B로 교체하면, `sharedPersistentSessionMismatch`, `fingerprintCurrentSharedSessionMismatch`, `fingerprintBlockingPromptSessionSnapshot` 3개 경로가 PC 탭 전용 세션과 오분류하여 예전 관리자 화면을 유지하고 변경/RPC 차단을 우회한다.
- 재현 GitHub Action [38179703990](https://github.com/eco-i/eco-i.github.io/actions/runs/38179703990). 실제 Chromium 값: `mobile=true,oldActor=238,oldUiVisible=true,currentToken=A,sharedToken=B,tabToken=A,mismatch=false,sensitiveMismatch=false`.
- 수정 GitHub QA 파일에만 적용: 세 경로에서 sessionStorage 독립성 예외를 **PC (!MOBILE_SESSION_DEVICE)**로 한정.
- 후보 `qa-handoff/index.working-2-8-238.html` 및 QA `index.html` SHA-256 `6d6af0c6ef5608c47ac70902161c8ee4c65f934b8de473f1735e5823697fd9b3`, 1,161,746 bytes.
- [Chromium 회귀 CI 38179828866](https://github.com/eco-i/eco-i.github.io/actions/runs/38179828866) **119 PASS / 0 FAIL**. 실제 모바일 A→B 공유 계정 변경 후 이전 관리자 화면 폐기, PC tab-only 로그인 유지.
- [Chromium 회귀 CI 38179884797](https://github.com/eco-i/eco-i.github.io/actions/runs/38179884797) **125 PASS / 0 FAIL**. 추가 실제 Chromium mobile mutation/backup/ordinary-read dispatch guard 차단, PC tab-only 예외 허용.
- 메인 `main` 분기·실배포·SQL·APP_VERSION(`ver20260927-0944`) 변경 금지. 그대로 유지.
- 검수 블록별 최소 20분 실제 활동 요건 충족 여부는 **최종 종료 전 실시간 기록 확인**. 지금은 공식 완료 아님.
- 미검증 운영환경: 실 Supabase/RLS, 기기 Android 카메라/native picker, 실 멀티유저 인증 서버, iOS Safari, 실제 BFCache persisted.
- 이후 해야 할 일: 회귀 안정성 재확인(2회 이상), 추가 경계조건, 실제 20분 이상 직접 검수·로그 확인, 공식 보고서/SHA/evidence/238 완료/239 시작본 GitHub 인계.
