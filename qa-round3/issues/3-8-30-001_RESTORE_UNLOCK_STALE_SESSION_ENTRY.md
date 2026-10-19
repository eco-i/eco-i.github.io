# 3-8-30-001 — 이전 세션 관리자 unlock 대기 완료 후 현재 세션 미확인으로 구 계정 화면 진입

- **Severity:** high
- **Scope:** QA `qa-3-8/index.html`, `restoreSession()` (기존 5504~5505 및 5521~5522 부근)
- **Root cause:** `tokenStillCurrent()`는 최초 PIN/사용자 read 직후 확인되지만 이후 `await ensureAdminUnlockForRestoreWithScope(...)` 동안 세션 토큰과 보안 epoch가 바뀔 수 있음. 완료 직후 소유권 재확인 없이 기존 직원 `me`로 `enterApp(me)` 또는 `enterInitialPinGate(me)` 호출.
- **Actual isolated source reproduction:** 원본 복구 함수에 실제 deferred 관리자-unlock promise를 주입한 뒤 잠금 중 `state.sessionToken` 교체, 동일 토큰 epoch 증가 또는 토큰 비움을 수행. 3가지 경로 (로컬, 서버 일반, 서버 forced initial PIN) × 3가지 역전 = **9/9에서 오래된 계정의 앱 진입 또는 PIN 게이트 호출 재현**. 실 직원 계정/DB는 접속하지 않음.
- **Impact:** 실제 경쟁 타이밍에서 새 세션 화면에 이전 직원 프로필이 재진입되거나 구 직원의 초기 PIN 게이트가 열릴 가능성. 화면 상태 소유권 오염이며 실제 직원 데이터 노출 여부는 실서버 환경에서 미검증.
- **Minimal QA fix:** `ensureAdminUnlockForRestoreWithScope` await 성공 이후 `if(!tokenStillCurrent())return;`를 로컬/서버 복구 두 경로 각각 삽입. 응답 거절 경로와 다음 세션 복구 예약 `finally`는 그대로 유지.
- **Regression:** 수정된 실제 `restoreSession()`에서 로컬·서버 일반·서버 초기 PIN 세 경로 각각 정상 유지, 토큰 변경, epoch 변경, 토큰 삭제, 관리자 unlock 거절 = **15/15 PASS**. 이전 세션 결과가 어떤 경로에서도 현 세션의 앱/게이트를 열지 않음. 원본 검증 9건은 결함 재현으로 기록하되 PASS 총수에서는 제외.
- **QA source candidate blob:** `8645c90182b9160951dde13e7249ca92dc43e373`.
- **Production:** `main` 변경 없음; 운영 DB 읽기/쓰기 없음; 배포 보류. 실제 브라우저/네트워크 lock 경합 및 2계정 인증 QA E2E 미검증.
