# 3-8-43-001 — PC 임시 탭이 동일 토큰의 shared logout suppression 이벤트를 무시함

- **MEDIUM / QA-only 수정.** 이슈는 세션 종단간 로그아웃 전파의 일관성과 기존 민감 화면 노출에 관한 것으로, 실제 서버 권한 탈취를 검증한 것은 아님.
- **원본 재현:** `handleSharedSessionStorageChange`는 `staffAttendance_sharedLoggedOutToken_v1` storage 이벤트에서 `current===e.newValue`이더라도 `!MOBILE_SESSION_DEVICE && sessionStorage[SESSION_KEY]===current`인 PC 탭 임시 로그인일 때 `logout(false)`를 호출하지 않음. 반면 `storedSessionTombstoned`는 token이 동일한 shared suppression을 PC 임시 탭에도 권위 있는 signout 차단으로 간주한다. 같은 event와 토큰을 사용하는 PC persistent/mobile은 UI 정리 경로로 진입. 기존 exact per-token logout 이벤트는 임시 탭도 처리한다.
- **실제 원본 핸들러 함수/mock 재현:** 모바일/PC × sessionStorage 동일토큰 유무 × suppression/exact/guard 이벤트 조합에서 **PC 임시 동일토큰 suppression만** `logoutCalls=0` 확인. 이벤트 직후 캐시된 민감 UI가 즉시 숨겨지지 않을 수 있으나, 이후 action의 소유권 검사가 막을 수 있어 서버 측 unauthorized write의 입증은 아님.
- **QA 국소 수정:** suppression 이벤트가 현재 탭과 **정확히 동일한 토큰**일 때는 모바일·PC 저장 범위에 관계없이 `logout(false)`·local UI cleanup을 수행하도록 PC 임시 예외를 제거. 다른 직원 토큰 이벤트는 무시. 실제 서버 로그아웃 RPC를 재호출하지 않음.
- **최종 커밋 소스 검사:** storage event matrix 32종×3 assertions + foreign storage 6 = **102/102**; Realtime reconnect old/new channel·지연 teardown 32/32; `storeLoginSession` 기존 pending guard 정상 재인증/초기 session restoration 36×5 = **180/180**; 인라인 JS/HTML/APP_VERSION 정적 **7/7**; Realtime channel SUBSCRIBED/INSERT/CLOSED와 stale channel identity 18 케이스 총 **60/60**. 합계 **381/381**. 원본 실패 재현은 PASS 분모 제외.
- **코드:** QA `index.html` blob `44639c7e2f31f7037b4a10999c580348c083fd1e`; 수정 commit `baab6ab7704364fbfbbd74b11407625344079213`; APP_VERSION `ver20261018-2313` 불변.
- **남은 한계:** `staffAttendance_updateLocalLoginPending_v1:` 신규 guard 생성 storage 이벤트 자체는 구버전·현버전 간 즉시 로그아웃 UI 이벤트로 연결되지 않음. 이후 세션 문맥 검사·재복원은 guard를 차단하지만, 열린 탭 UI 지연 정리는 별도 risk triage. 실제 브라우저/실시간 Supabase 전파 및 직원 데이터는 테스트하지 않음.
- **운영:** main/실 직원 DB·지문·근태·실 RPC·SQL/배포 0.
- 작성 KST: 2026-10-20 18:20:51.
