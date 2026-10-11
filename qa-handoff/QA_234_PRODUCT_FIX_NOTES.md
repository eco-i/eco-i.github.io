# 2-8-234 제품 수정 차이
- 이전: `acquireSharedSessionMutex()` / `releaseSharedSessionMutex()`는 `localStorage`에 타임스탬프/UUID 키를 게시한 뒤 스캔하는 동기 의사 잠금. 실제 Chrome 동일 출처 다중탭 상호배제 실패.
- 이후: `withBrowserSharedSessionLock(fn)`가 브라우저 `navigator.locks.request('staffAttendance_sharedSessionBrowserLock_v3', {mode:'exclusive'}, fn)`로 전역 보호; 내부 동기 RMW는 잠금 소유 callback에서만 허용.
- `storeLoginSessionForFreshLogin`, `storeAdminUnlockForFreshLogin`는 await 잠금 획득 후 attempt 및 stateToken을 다시 검증.
- `scheduleSharedAdminUnlockCleanup`, `scheduleSharedSessionCleanup` 비동기 Web Locks 재시도. `logout`의 공유 토큰 정리 및 `restoreSession` 관리자 복원, `restoreUpdateSessionHandoff` 및 부팅 초기 legacy 이관 경로 보호.
- `showLocalPreviewLoginAfterRestoreFailure`는 지연 정리 토큰 선캡처. `revokeAdminUnlockForToken` 관리자 정리를 잠금 내 예약.
- 구성/버전/SQL은 변경하지 않음.
- 수정 HTML 최종 SHA-256 `a46a2d8d11f1eaecab8b42e461804bad70650c4da462324e370dd307a112cd63`.
