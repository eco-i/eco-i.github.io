# QA 2-8-236 제품 수정 메모
1. 공유 잠금 대기 중에도 즉시 로그아웃: `logout()`의 `await safelyClearStoredLoginSession`을 관리자·직원/민감 화면 동기 초기화 이후로 이동; 요청된 옛 token의 서버 로그아웃을 별도 Promise로 즉시 dispatch하고 keepalive 유지; old session cleanup은 정확한 이전 token만 삭제.
2. Web Locks 없는 모바일 logout 재부활 방어: 독립 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY` exact-token 기록, `storedSessionToken()` 읽기 시 동일 token 제외, 정상 same-token fresh login 성공 시 차단 해제. storage marker event에 반응해 다른 탭의 same-token shared session 즉시 signout; 서로 다른 새 token, PC tab-only 로그인은 유지.
3. 검증: Chrome real 2탭 lock 150, 4탭 400, 계정 전환·실패 복구, 모바일 UA reload/no locks, sibling storage listener, 서버 logout 모의 1회; final 105 PASS x2.
4. 최종 SHA-256 `5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a`, `APP_VERSION=ver20260927-0944`, 운영 main·SQL·배포 변경 없음.
