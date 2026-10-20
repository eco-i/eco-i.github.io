# 3-8-36-001 — 동일 토큰 shared logout suppression 잔존 시 fresh login 성공 오판

## 발생·심각도
- **MEDIUM 신규 결함.** 3-8-35에서 처리한 token별/legacy handoff tombstone과 **별개의** `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY` 경계.
- `storedSessionTombstoned(token)`의 첫 검사에서는 `localStorage.SHARED_SESSION_LOGOUT_SUPPRESSION_KEY===token`을 언제나 로그아웃된 세션으로 간주한다.
- 그러나 35 완료 `storeLoginSession`은 **PC 임시 로그인**의 fresh 성공 뒤에는 그 공유 suppression 표식을 해제하지 않는다. **PC 로그인 유지/모바일**은 제거를 요청하더라도 `storageRemove`의 실패 여부를 검사하지 않고 성공(true)을 반환한다.
- 실제 GitHub QA 35 HTML blob `4fd569795a1eafbdaf0918c4e0f2c4f0dfca3cbe`의 저장·로그아웃 판정 원본 함수 격리 실행: `supp=A`에서 PC 임시 로그인은 제거 가능한 저장소여도 `stored=true / tombstoned=true`. PC 로그인 유지와 모바일은 suppression 키 `removeItem` 실패를 주입하면 동일 결과를 재현. 실제 직원 계정에서 재현한 것은 아니다.
- 실패 결과: 사용자는 로그인이 성공한 것으로 처리되었으나 앱의 다른 세션 검사가 곧 차단하므로 로그인 유지·자동업데이트/화면 복원에 불일치.

## QA 전용 보정
- `clearSharedLogoutSuppressionForFreshLogin(token)`으로 exact-token suppression이 없으면 성공, 있으면 해당 표식 제거 후 **실제 읽기로 해제 확인**. 다른 토큰의 suppression은 불변.
- `storeLoginSession`의 모바일 / PC 영구 / PC 임시 세 경로 모두 fresh login일 때 **기존 35 handoff tombstone 해제 + shared logout suppression 해제** 두 가지가 함께 통과해야 성공. 해제 실패 시 false와 가능한 이전 tab/shared token rollback. 관리자 unlock 표시 및 다른 토큰의 logout 상태를 보존. `clearLogoutTombstone=false` 복원 경로는 해제하지 않음.
- 세 경로 모두 로그인 저장 실패 메시지를 사용하는 상위 `storeLoginSessionForFreshLogin` 및 `login` 처리는 건드리지 않음. 운영 버전 `ver20261018-2313` 유지.
- 신규 소스 blob `86ff27b08a66f7e1853f3888a74a7d8ba0109471`, QA 코드 커밋 `5126e7d2a2382af0e404987f4aa3f0f48cf0120f`.

## 격리·회귀 결과
- **189/189** 유효 격리/정적 PASS: 실제 `storeLoginSession`, `storedSessionTombstoned`, handoff tombstone과 storage 키를 가짜 quota/remove fault로 실행한 세 경로 및 72개 교차 변형 **108**; 실제 `restoreUpdateSessionHandoff` 함수 **20**; 실제 `startRealtime` 채널/구 채널 늦은 callback **20**; JS 2개 파싱·HTML ID 488개 무중복·이전 30~35 보호 함수 존재 등 **41**. 원본 결함 재현 실패는 PASS 카운트 제외.
- QA 이외 코드/운영 `main` 변경 0, 직원 DB 자료 접근·SQL/RPC·배포 0.
- **미검증:** 전체 브라우저 로그인, 실제 Android/iOS PWA 및 QA Supabase 다계정·Web Locks 경합·Realtime 구독. old client가 미리 읽은 legacy aggregate를 재쓰기하면서 새 로그인된 같은 token에 과거 기록을 다시 노출하는 경합은 구버전 코드와 실제 물리 탭의 통합검사가 필요. 완전 storage 고장·rollback 자체의 실패도 별도 범위. 이번 변경이 그 문제들까지 해결했다고 주장하지 않는다.
