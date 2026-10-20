# 근무모아 3차·깊이8 공식 인수인계

- **3-8-43 공식 완료: MEDIUM 신규 제품 결함 1종 원본 함수 재현·QA 수정, 최종 381/381 scoped assertion PASS. 다음 3-8-44.** 3차 누적 **35종**, 2차 기존 540종 별도. CLEAN 아님.
- 저장소 `eco-i/eco-i.github.io`; 검수 `qa-3-8`; 운영 `main`. 새 채팅: `qa-round3/CURRENT_STATE.json`, 이 문서, `qa-round3/QA_3-8-43_REPORT.md`, `qa-round3/EXIT_CRITERIA.md` 직접 확인.
- **3-8-43-001 MEDIUM:** `handleSharedSessionStorageChange`에서 정확히 같은 토큰의 `staffAttendance_sharedLoggedOutToken_v1` storage 이벤트가 발생해도, PC 임시 sessionStorage에 같은 token이 있으면 `logout(false)` 호출을 건너뜀. `storedSessionTombstoned`는 해당 token의 shared suppression을 authoritative로 보므로 민감 UI 즉시 정리 일관성 위반. 원본 실제 이벤트 핸들러 mock으로 확인. 원격 서버 authorization bypass 주장은 아님.
- QA 수정: 해당 **같은 token** suppression 이벤트의 PC 임시 탭 예외 제거. 다른 token 이벤트는 무시하고, 모바일/PC remember 기존 동작과 일치. 이슈 `qa-round3/issues/3-8-43-001_PC_TAB_IGNORES_SAME_TOKEN_LOGOUT_SUPPRESSION_EVENT.md`; 보고서 `qa-round3/QA_3-8-43_REPORT.md`.
- 최종 QA HTML blob **`44639c7e2f31f7037b4a10999c580348c083fd1e`**, 제품코드 commit **`baab6ab7704364fbfbbd74b11407625344079213`**. 42 이전 blob `6c9727dcb3f39d1c2f3063fafbdbe6838cfb345b`. APP_VERSION `ver20261018-2313` 그대로.
- 최종 커밋 실제 소스 격리·정적 **381/381 PASS**: storage 이벤트 32×3+외부 storage 6=**102**, Realtime old/new reconnect/removeChannel async 소유권 **32**, local pending guard 정상 재로그인/epoch 실패/삭제 실패 세 범위 **180**, JS 2 파싱/2개 스크립트·HTML 488 IDs count/unique·버전·3 login guard **7**, Realtime 구독 상태 `SUBSCRIBED`/`INSERT`/`CLOSED` 및 stale channel callback **60**. 전부 함수 격리 mock/정적이며 실제 browser/QA-only Supabase E2E 실행 아님.
- 운영 `main` 기준 HEAD **`6c784210e048426f18a486d5602652626d97574d`** 유지; 직원 DB/지문/근태/실 RPC/SQL/배포 조회·수정 0. 마무리에서 main ref 재조회.
- **종료 기준 문서 신설: `qa-round3/EXIT_CRITERIA.md`.** 단순 블록 수가 아닌 마지막 주요 코드 변경 뒤 차별화된 2 CLEAN, 고위험 결함 0, 로그인/근태·관리자·지문 회귀, 실제 Chrome 다중탭/Web Locks/Android-iOS PWA, 독립 QA Supabase Realtime/E2E, 사용자 명시 배포 승인 등을 분리. 현 단계 완료 아님. 55~70블록은 추정일 뿐 무조건 계속하거나 무조건 종료하지 않음.
- **다음 3-8-44:** 새 pending-login guard의 구버전 탭/storage event UX, 오래된 차단 표식의 정상 회수, 실제 사용 가능한 QA 전용 환경의 통합검증 우선순위, 종료 기준 갭 점검. 같은 예외 mock만 무한히 확장하지 말 것. 운영 직원 DB 금지.
- 연결 안정성·채팅 용량 최소·상세 GitHub 저장·ZIP 불필요.

