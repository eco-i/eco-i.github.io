# 3-8-45-001 MEDIUM — 지연된 suppression storage 이벤트가 신선한 동일 토큰 로그인을 로그아웃시킴

- **유형:** 클라이언트 권한/세션 UI 불필요 폐기(가용성·편집 중 입력 손실 우려), 실 서버 인증 우회가 입증된 것은 아님.
- **원본:** 3-8-44 완료 QA `index.html` blob `ab638a84e6c211a3845889c9ab9b69a1f2b4f1ea`.
- **조건:** 탭 A가 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY`에 `local:7` 기록 → 다른 탭의 정상 재로그인이 해당 표식을 제거 → 탭 B에 이전 `storage` 이벤트(`newValue=local:7`)가 뒤늦게 전달됨. 같은 토큰으로 갱신한 B의 이벤트 핸들러는 *현재 저장소*가 아니라 과거 event.newValue만 검사하고 `logout(false)` 호출.
- **실제 소스 격리 재현:** 72개 저장소/이벤트/토큰/스토리지 영역 조합 중 false logout 4건. 전부 현재 공유 suppression 값이 null 또는 다른 토큰인데 옛 이벤트 토큰만 현 세션과 일치한 경우.
- **QA 수정:** `qa-3-8/index.html`의 suppression event 분기에서 현재 `localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)` 값을 재확인. 현재 토큰과 같은 표식이 *지금도 남을 때만* 로컬 권한/화면 폐기. 읽기 자체 실패는 보안상 fail-closed로 폐기. 기존 token-specific logout 및 pending guard(80ms) 분기는 그대로 둠.
- **최종 코드 commit:** `3db6b577a7caef8f8a7333885405d953b2d86e05`; blob `08867d7117ad9ae5a8247eda8d223687af2b8411`.
- **수정 후 격리 검증:** suppression 72 시나리오 모두 통과; 기존 aggregate/token-specific logout 24 시나리오와 pending guard 96 시나리오 회귀 통과; 해당 항목 총 608 assertions PASS. 추가로 6개 inline script 문법, HTML ID 488개/중복 0, APP_VERSION 불변 확인.
- **검증 한계:** 브라우저 이벤트의 실제 순서/렌더와 멀티탭 Web Locks·Android/iOS 및 Supabase 실제 QA 계정 E2E는 **미실행**. 시도한 샌드박스 Chromium navigation(로컬 주소 및 file/data URL)은 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단되어 물리 브라우저 결과로 취급하지 않음.
- **보호:** 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d` 불변, 운영 DB/실제 직원/지문/SQL/RPC/배포 변경 0.
