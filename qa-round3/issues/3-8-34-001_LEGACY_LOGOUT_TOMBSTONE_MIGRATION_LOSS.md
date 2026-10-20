# 3-8-34-001 — 레거시 로그아웃 표식 이관 중 저장 실패 시 세션 차단 증거 유실

- **중요도:** MEDIUM. **변경 범위:** QA `index.html`의 `migrateLegacyUpdateHandoffLogoutTombstones`, `updateHandoffTokenWasLoggedOut` 두 함수만.
- **발생 조건:** 기존 `staffAttendance_updateSessionLogout_v1` aggregate에 60초 이내의 유효한 명시적 로그아웃 증거가 남은 상태에서, localStorage 용량 부족/쓰기 차단 등으로 새 `staffAttendance_updateSessionLogoutToken_v1:<token>` 저장이 실패.
- **근본 원인:** 기존 이관 함수는 `storageSet()` 결과를 확인하지 않고 이전 aggregate를 무조건 삭제. 이후 `updateHandoffTokenWasLoggedOut(token)`이 새 개별 키만 조회해 `false`를 반환. 이전 버전의 유효 로그아웃 차단 정보가 모두 사라짐.
- **실제 원본 재현:** GitHub 33 완료 HTML blob `d55a32fcbcad3110db76c8725b4b088fca7362d1`의 실제 함수 소스를 격리 실행. 가짜 localStorage에서 개별 키 `setItem`에 `QuotaExceededError`를 발생시키고 유효 OLD aggregate를 준비하면, OLD logout 판정이 `false`로 변하며 aggregate도 사라지는 결함을 확인함. 정상 읽기/삭제 가능한 저장소에서의 부분 쓰기 실패를 가정한 **격리 재현**이며, 실제 사용자 세션에서 관측한 것은 아님.
- **영향:** 짧은 자동업데이트 handoff 단계에서 OLD token의 로그아웃을 놓쳐 로컬 인계·관리자 잠금 복원 판단이 잘못될 수 있음. 서버 세션 인증까지 통과했다는 증거는 없음.
- **QA 수정:** 이관 대상의 모든 최신 표식이 새 키에 안전하게 기록된 경우에만 레거시 aggregate 제거. 하나라도 실패하면 원본 보존. 조회할 때 새 token 키가 없거나 만료된 경우 아직 남은 유효 aggregate에서 **정확히 같은 token**의 로그아웃 기록을 다시 확인하도록 보호. 정상 이관·exact-token 삭제·33번 handoff owner check는 유지.
- **검증:** candidate 실제 함수 메모리 격리 78/78, 커밋된 코드의 `restoreUpdateSessionHandoff` 경로 12/12, 실제 `scheduleRealtimeReconnect` 경합 모의 16/16, 커밋 코드 구문/DOM/보호 함수 25/25. 합계 131/131 유효 PASS. 원본에서의 실패 재현은 유효 PASS 수에 중복 포함하지 않음.
- **QA 코드 수정 커밋:** `47b6bb57dc042e5eed254bf02de5c62852683939`. HTML blob `c754f9ff2be9e82768b550eb7ea3852f9b82d687`. `APP_VERSION ver20261018-2313` 그대로.
- **운영 영향:** `main` 무변경, 운영 DB 조회·쓰기/SQL/직원·지문 자료 접근 0. 실제 Android/iOS, full-app Chromium, multi-tab Web Locks 및 서버 로그인 E2E는 수행하지 않았으므로 미검증.
- **추가 제한:** localStorage 자체가 읽기 불능이거나 처음부터 로그아웃 표식을 하나도 기록할 수 없는 환경의 전면 장애는 이 수정의 해결 대상 아님. 동일 token을 재사용한 fresh login과 다른 탭의 오래된 레거시 writer가 경합하는 통합 경계는 후속 QA 범위.
