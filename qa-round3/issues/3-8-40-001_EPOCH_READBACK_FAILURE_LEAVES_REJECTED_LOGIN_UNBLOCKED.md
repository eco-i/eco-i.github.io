# 3-8-40-001 — 로컬 epoch 쓰기 후 확인 읽기 실패 시 거부된 동일 토큰의 이전 로그아웃 보호 해제

- **MEDIUM**, QA-only 수정, 운영 미반영.
- 기존 3-8-38-001의 write 자체 실패와 다른 분기: `recordLocalFreshLoginEpoch`의 `storageSet`은 `setItem(key,newEpoch)`를 성공시켰지만 즉시 이어지는 `getItem(key)`가 일시적으로 예외를 던지는 경우 false 반환. 기존 `completeFreshLoginLogoutReset`은 이 false 경로에서 **새로 남은 epoch를 원복하지 않고** 종료했다.
- 재현: 같은 `local:7` token의 이전 sessionStorage/localStorage 로그인 기록 + 1초 전 legacy logout aggregate를 준비. 실제 `storeLoginSession`·`storedSessionTombstoned`·epoch 필터 함수를 모의 저장소에서 실행해 epoch setItem 성공 후 readback 1회 실패 주입. 모바일/PC 로그인 유지/PC 임시 모두 **새 로그인 false, 신 epoch 잔존, 이전 legacy logout은 epoch 필터로 무시, 이전 토큰은 저장소에 잔존**을 확인. 실 브라우저/서버 E2E가 아닌 실제 JS 함수+저장소 예외 순서 mock.
- 위험 경계: 로그인 실패 뒤 구버전 탭 등에서 잔존된 `local:` 토큰을 이전 logout으로 차단하지 못할 수 있음. 이 현상이 실제 직원 인증 서버 token의 권한 탈취를 입증하는 것은 아니며, configured Supabase 로그인은 고유 UUID token을 사용하므로 해당 local-epoch 필터의 직접 대상이 아님.
- QA 수정: `completeFreshLoginLogoutReset`에 `restorePreviousEpoch`를 공통화하고 epoch 기록 false(쓰기 실패뿐 아니라 *쓰기 성공+확인 읽기 실패*)에서도 이전 epoch 복원을 시도. 이후 logout cleanup 실패 분기의 기존 rollback도 같은 helper 사용. 수정 후 원본의 3가지 로그인 경로와 서버 token 무변경, 신구 logout 방어 유지.
- **한계:** `removeItem`이나 이전 epoch 복원 setItem까지 연쇄 거절되면 저장소만으로 fail-closed 증거를 복원할 수 없는 경우가 남는다. 해당 복합 장애는 3-8-41 후속으로 남기고 실 데이터에서는 검증하지 않음.
- 원본 QA blob `5ef9c5c4d2e94498e7285b55079454e37ac16d96`; 수정 QA blob `a86df78b95ae19fffe0f0bb49d613f2f7336a66b`; QA 코드 커밋 `139360be01d772c6fd9fdbe0a6170d12961af0bd`.
- 최종 커밋 실제 함수 격리 검증: 3 storage scopes × 2 prior epochs × 4 logout marker types × 3 epoch write/read failure modes × 4 assertions = **288**, JS/DOM/버전 등 정적 **7**, Realtime `scheduleRealtimeRefresh` 타이머/Promise 2×2×2×2×2 = **32**, **유효 327/327 PASS**. 테스트 harness 중간 실패/원본 실패 재현은 수치에 포함하지 않음.
- 실 직원 DB·지문 기록·근태 기록, 실제 Supabase 인증 RPC·SQL, 운영 `main`·배포 전부 무접근·무변경.
- 작성: 2026-10-20 17:20:32 KST
