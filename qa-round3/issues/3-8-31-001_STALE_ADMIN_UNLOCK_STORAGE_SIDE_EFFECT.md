# 3-8-31-001 — 관리자 unlock 복구의 지연 콜백이 새 세션의 인증 표식을 정리하는 경합

**Severity:** medium · **Branch:** qa-3-8 only · **File:** index.html

## 재현 및 원인
`restoreSession`은 30번에서 관리자 unlock `await` 뒤 소유권을 확인하도록 수정됐지만, 실제 `ensureAdminUnlockForRestoreWithScope(isAdmin,token)`는 기다리던 Web Locks를 획득한 **그 콜백 내부**에서 옛 token 소유권을 검사하지 않았다. 그 사이 PC의 다른 탭/현재 탭 로그인 세션이 교체되면, 이전 비관리자 인증의 `revokeAdminUnlockForToken(old)` → `clearAdminUnlockForSession(old,...)` 경로가 새 탭의 `sessionStorage.ADMIN_UNLOCK_KEY`를 지울 수 있다. 화면 진입 방어(3-8-30-001)는 이 선행 storage side effect를 되돌리지 못한다.

격리 실제 함수 실행에서 PC 이전 remembered 세션의 delayed lock과 신규 tab-only / 새 remembered admin 세션 조합에, **새 인증 표식 삭제**를 재현. 원본의 일반/강제 세션 역전 및 변경 전 storage 이벤트 지연도 관찰했으며, 실제 브라우저 Web Locks와 실 Supabase 계정/직원 데이터는 접속하지 않았다. Mock이 실제 local/sessionStorage 메서드를 복제한 것은 아니므로 통합 환경에서의 사용자 피해 발생은 확정하지 않는다.

## QA 수정
`ensureAdminUnlockForRestoreWithScope` 진입 시 token/epoch를 고정하고, 진입 직전 및 Web Locks **콜백 내부**에서 `state.sessionToken`, `sessionContextEpoch`, `fingerprintCurrentSharedSessionMismatch()`를 확인. 부적합한 옛 작업은 `false`로 종료하고 인증 저장소에 접근하지 않음. PC tab-only 복구는 기존처럼 공유 Web Locks 비의존으로 유지.

## 검증 및 잔여 위험
실제 헬퍼 함수를 이용한 지연 잠금/저장소 가짜 환경 8/8 수정 회귀 PASS: 정상 관리자·비관리자, 신규 tab-only/remembered/mobile 관리자, 동일 토큰 보안 epoch 변경, 이전 관리자 handoff, storage-event 지연. 앞선 원본 재현 결함 케이스는 PASS 수에 포함하지 않음.
관리자 인증 영구 보존 여부와 브라우저 간 storage/lock 실제 동작은 QA 전용 인증 계정과 2탭 통합 테스트에서 별도 확인 필요. 운영 main 및 직원 DB 미접촉.

QA 후보 blob: `a6cc643cc1c7a39c0afdfa8b1790e116d324ff03`.