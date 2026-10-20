# 3-8-33-001 — 이전 토큰의 지연 로그아웃이 새 토큰의 업데이트 인계정보를 제거

- **분류:** MEDIUM · **수정 위치:** `index.html`의 `markUpdateHandoffLoggedOut(token)`. QA 브랜치 전용.
- **원인:** 이전 토큰 `OLD`의 `safelyClearStoredLoginSession` 또는 `clearStoredLoginSession`가 지연되어 실행될 수 있는데, `markUpdateHandoffLoggedOut(OLD)`에서 `sessionStorage[UPDATE_SESSION_HANDOFF_KEY]`를 소유 토큰 비교 없이 삭제. 그 사이 새 로그인 `NEW`의 자동업데이트 handoff가 만들어져 있으면 `NEW` 인계 표식까지 지워질 수 있음.
- **재현:** 실제 원본 `markUpdateHandoffLoggedOut` 함수 소스를 추출해 가짜 local/sessionStorage로 실행. old-token logout + new-token handoff, other-token handoff, future new handoff 등에서 원본이 신규 handoff를 제거하는 결과 확인. 실제 서비스 DB·브라우저 저장소에는 접근하지 않음.
- **영향:** 자동업데이트/리로드 시 새 사용자 로그인 유지용 인계정보가 사라져 재로그인을 요구하거나 후속 handoff가 실패할 가능성. 실 브라우저 전체 앱에서 이용자 영향이 발생했는지는 미검증.
- **QA 조치:** 탭 전용 handoff를 읽어 `info.token===token`인 경우에만 제거. 새 토큰/토큰 불명/파싱 실패 handoff는 구 토큰의 로그아웃에서 함부로 삭제하지 않음. localStorage의 legacy shared handoff exact-token 삭제는 그대로 유지.
- **회귀:** 수정된 실제 함수 10/10, 예약 shared cleanup 10/10, PC/모바일 `clearStoredLoginSession` 분기 14/14, Realtime 22/22, PIN 10/10, 정적·구문 무결성 62/62, 이전 restoreSession 15/15 = **143/143 격리·정적 통과**. 원본 실패/모의 fixture 시행착오는 PASS에 미포함.
- **QA 결과 파일 blob:** `d55a32fcbcad3110db76c8725b4b088fca7362d1`, APP_VERSION `ver20261018-2313` 유지. 운영 `main`과 직원 DB 미접촉.
