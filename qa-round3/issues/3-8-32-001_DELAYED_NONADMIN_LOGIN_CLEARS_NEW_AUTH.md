# 3-8-32-001 — 지연된 일반 직원 로그인 인증 정리가 새 관리자의 표식을 삭제

- **Severity:** HIGH. **QA branch:** qa-3-8. **Affected:** `login()` local/server branches, following `await withBrowserSharedSessionLock(...)`.
- **재현:** 실제 원본 `login()` 함수로 일반 직원 로그인 스토리지 저장 이후 Web Lock 콜백을 지연시킴. 이 사이 새 관리자 토큰/로그인 시도 세대가 현재 세션을 차지하고 새 `ADMIN_UNLOCK_KEY`가 기록된 후 이전 콜백을 해제. 원본 로컬·서버 경로에서 새 관리자의 tab/shared 관리자 표식이 삭제됨. 로컬 preview 경로에서는 이후 이전 직원 `enterApp`까지 호출됨. 이는 가짜 저장소/RPC에서 실제 함수 본문을 실행한 재현이며 실서버 사용자 데이터 노출 확인은 아님.
- **원인:** 이전 일반 직원 로그인 완료 대기 중 callback이 `state.sessionToken`을 다시 읽어 새 토큰으로 `clearAdminUnlockForSession`을 호출하고, 그 뒤 로컬 로그인 경로에 새 세션/시도번호 재검사가 없음. 서버 경로의 나중 소유권 검사는 이미 발생한 저장소 부작용을 되돌리지 못함.
- **QA 수정:** 두 브랜치 각각 정확히 캡처된 `localLoginToken`/`loginToken`을 사용하고, Web Lock의 콜백 내부 및 await 직후 `loginAttemptSeq`, `state.sessionToken`, shared storage mismatch로 새 계정 소유권을 검증. 다른 세션이면 변경/화면 진입 없이 return.
- **검증:** 실제 추출 `login()`의 local/server × 안정·새 토큰·동일 토큰 새 시도·storage event 지연·새 security epoch = **10/10 PASS**; 기존 결함 원본에서 local/server의 신규 관리자 표식 삭제를 재현. `login()`은 mock에서 실행하며 실제 서버 로그인/2세션 검증은 미실시.
- **수정 QA index blob:** `8d1793491a2ff6447011fde1b3db8eae05d05830`. **main/DB/버전 불변**.