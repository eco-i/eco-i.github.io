# 근무모아 3차·깊이8 — 3-8-45 공식 검수 보고서

## 판정
- **3-8-45 범위 완료 / MEDIUM 신규 제품 결함 1종(3-8-45-001) 재현·QA 코드 수정. CLEAN 아님.**
- 3차 누적 **37종**(3-8-44 완료 시 36종 +1). 과거 2차 결함 540종은 별도.
- 최종 QA `index.html` blob **`08867d7117ad9ae5a8247eda8d223687af2b8411`**, QA 제품코드 commit **`3db6b577a7caef8f8a7333885405d953b2d86e05`**. 기존 44 완료 blob `ab638a84e6c211a3845889c9ab9b69a1f2b4f1ea`. 버전 `ver20261018-2313` 불변, SQL 변경 없음.
- **최종 코드에서 608/608 격리 함수 assertions PASS.** 정적 스크립트 구문/DOM/버전 검사 별도 PASS. 실제 로그인한 완성 앱·멀티탭·모바일·Supabase E2E를 통과했다고 말하지 않음.
- 운영 main `6c784210e048426f18a486d5602652626d97574d` 불변, 직원 DB·근태·지문·SQL/RPC·배포 변경 없음.

## 깊이8 검수 및 재현
1. 사용자 인계의 43 완료와 달리 GitHub `CURRENT_STATE.json`·`START_HERE_NEW_CHAT.md`·44 보고서에는 **44 공식 완료, 다음 45**로 기록돼 중복 실행하지 않음. 43 보고서·`EXIT_CRITERIA.md`, 44 QA 원본 blob, 운영 main HEAD 확인.
2. `handleSharedSessionStorageChange`의 suppression 이벤트 분기와 `logout(false)`, `clearSharedLogoutSuppressionForFreshLogin`, `completeFreshLoginLogoutReset`을 대조. 새 로그인에서 이전 suppression을 제거해도 큐에 남은 오래된 storage event의 `newValue`는 유지됨.
3. **원본 함수 직접 실행 재현:** storageArea(local/foreign) 2 × 현 세션 토큰(local:7/local:8/빈 값) 3 × 이벤트 값(local:7/local:8/null) 3 × 현재 저장 상태(local:7/local:8/미설정/읽기 예외) 4 = 72 조합. old handler는 4개 오탐 로그아웃, 수정본은 0개. 수정본 72×3 = **216 assertions PASS**(logout 횟수, 민감 권한 proof 정리, logout(false)의 비서버 플래그).
4. **QA 최소 수정:** suppression의 이벤트 `newValue`가 현재 token과 같더라도 *실제 현재* localStorage 값을 다시 읽어 동일할 때만 revoke. getItem exception은 fail-closed. 다른 이벤트 종류, 외부 storageArea, 타인 토큰은 유지.
5. **이전 로그아웃 회귀:** 실제 원본 이벤트 핸들러의 token-specific/aggregate logout 24 조합×3 assertions = **72 PASS**.
6. **44블록 guard 회귀:** pending guard event 키/스토리지 영역/현재 세션·epoch/token 변경/guard 지속 96 조합의 소유권·80ms 지연·민감 proof·local logout **320 assertions PASS**. 무관 토큰 이벤트가 회귀로 폐기되지 않음.
7. **정적 회귀:** 최종 blob `08867d7117ad9ae5a8247eda8d223687af2b8411`에서 inline script 6개 구문 파싱 이상 0, HTML ID 488개 모두 고유, `ver20261018-2313` 보존. 새로운 수정은 suppression 분기의 1개 국소 영역만 변경.
8. **실제 브라우저 한계:** Chromium executable/Playwright 존재를 확인했으나 격리 URL localhost·file/data navigation이 실행 환경 정책 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단. 따라서 물리/완성 앱/두 탭 실제 동작 **미검증**, 격리 자바스크립트 함수 실행과 명시적으로 구분. 테스트에 운영 웹사이트·서버·실계정 연결하지 않음.

## 종료 기준 판단 및 다음 3-8-46
- `EXIT_CRITERIA.md`: 마지막 통합 회귀, 실제 PC 두 탭·Android/iOS 및 관리자 PIN·근태/지문 UI, 독립 QA 서버 Realtime, 서로 다른 위험을 검증한 마지막 CLEAN 2회 **미충족**.
- 기존 버전 탭은 현재 신규 로컬 guard를 이해하지 못할 수 있어 신/구 탭 호환 전체를 입증하지 않음.
- **다음 46 범위:** 동일한 로그아웃 예외조합 확장을 멈추고, 코드 단위에서 로그인/관리자 권한·근태 저장/삭제·지문·Realtime·대정비·연가의 상이한 통합 경로/고위험 결함을 우선 대조. 실제 E2E가 가능한 독립 QA 환경·사용자 승인 필요 항목을 종료 게이트에 구분. 미검증을 CLEAN으로 대체하지 않음.
- 이슈 상세: `qa-round3/issues/3-8-45-001_STALE_SUPPRESSION_EVENT_REVOKES_FRESH_LOCAL_LOGIN.md`.

기록(KST): 2026-10-20T19:44:11+09:00.
