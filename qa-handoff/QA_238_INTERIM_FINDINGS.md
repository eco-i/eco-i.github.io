# 2-8-238 심층검수 중간 상태 (미완료)

- 프로젝트 근무모아 / 2차 깊이8 High. 직전 공식 완료 2-8-237, 누적 결함 510종.
- **현재 238 미완료**. 238을 239로 넘기거나 공식 누적에 선반영하지 않는다.
- 원본 기준 `qa-handoff/index.before-2-8-238.html`, SHA-256 `f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f`, 1,161,672 bytes.
- 첫 번째 신규 실제 재현 제품 결함 **1종**: 모바일 기기에 기존 sessionStorage 레거시 token A가 중복 존재하는 상태에서 다른 탭이 공유 토큰을 B로 교체하면, `sharedPersistentSessionMismatch`, `fingerprintCurrentSharedSessionMismatch`, `fingerprintBlockingPromptSessionSnapshot` 3개 경로가 PC 탭 전용 세션과 오분류하여 예전 관리자 화면을 유지하고 변경/RPC 차단을 우회한다.
- 재현 GitHub Action [38179703990](https://github.com/eco-i/eco-i.github.io/actions/runs/38179703990). 실제 Chromium 값: `mobile=true,oldActor=238,oldUiVisible=true,currentToken=A,sharedToken=B,tabToken=A,mismatch=false,sensitiveMismatch=false`.
- 수정 GitHub QA 파일에만 적용: 세 경로에서 sessionStorage 독립성 예외를 **PC (!MOBILE_SESSION_DEVICE)**로 한정.
- 후보 `qa-handoff/index.working-2-8-238.html` 및 QA `index.html` SHA-256 `6d6af0c6ef5608c47ac70902161c8ee4c65f934b8de473f1735e5823697fd9b3`, 1,161,746 bytes.
- [Chromium 회귀 CI 38179828866](https://github.com/eco-i/eco-i.github.io/actions/runs/38179828866) **119 PASS / 0 FAIL**. 실제 모바일 A→B 공유 계정 변경 후 이전 관리자 화면 폐기, PC tab-only 로그인 유지.
- [Chromium 회귀 CI 38179884797](https://github.com/eco-i/eco-i.github.io/actions/runs/38179884797) **125 PASS / 0 FAIL**. 추가 실제 Chromium mobile mutation/backup/ordinary-read dispatch guard 차단, PC tab-only 예외 허용.
- **두 번째 신규 제품 결함 1종**: 모바일에서 더 최신 공유 로그인 B가 명시적으로 로그아웃되고 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY=B`인 상태에서 과거 레거시 탭 토큰 A로 `storedSessionToken()`이 잘못 복귀. B가 저장소에 남아 있을 때 [재현 CI 38180041278](https://github.com/eco-i/eco-i.github.io/actions/runs/38180041278), B가 정상 삭제된 후에도 [재현 CI 38180141002](https://github.com/eco-i/eco-i.github.io/actions/runs/38180141002). 둘은 동일 원인의 1종으로 중복 산정하지 않음.
- 수정: 모바일 공유 저장소에 newer record가 있거나 삭제 후에도 logout suppression marker가 유지되면, 탭의 오래된 A 토큰으로 복원 금지. 진정한 레거시 단독 A(공유 세션·로그아웃 표식 둘 다 없는 경우)와 독립 PC 탭 로그인은 보존.
- 현재 QA 후보 SHA-256 **`1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360`**, **1,161,777 bytes**. 시작본의 원래 SHA는 불변.
- [Chrome CI 38180247760](https://github.com/eco-i/eco-i.github.io/actions/runs/38180247760) **131 PASS / 0 FAIL**: 모바일 newer 공유 세션 유무/삭제/명시로그아웃, 레거시 단독, PC 독립 인증, 사진 및 4조 근무/연차/다중 탭 회귀. 전체 검수 범위를 확대 중이며 이번 블록 **현재 제품 결함 잠정 2종**, 공식 누적 510종은 그대로 유지.
- 메인 `main` 분기·실배포·SQL·APP_VERSION(`ver20260927-0944`) 변경 금지. 그대로 유지.
- 검수 블록별 최소 20분 실제 활동 요건 충족 여부는 **최종 종료 전 실시간 기록 확인**. 지금은 공식 완료 아님.
- 미검증 운영환경: 실 Supabase/RLS, 기기 Android 카메라/native picker, 실 멀티유저 인증 서버, iOS Safari, 실제 BFCache persisted.
- 이후 해야 할 일: 회귀 안정성 재확인(2회 이상), 추가 경계조건, 실제 20분 이상 직접 검수·로그 확인, 공식 보고서/SHA/evidence/238 완료/239 시작본 GitHub 인계.
