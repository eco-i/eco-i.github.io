# 근무모아 3차·깊이8 공식 인수인계

- **3-8-44 공식 완료: MEDIUM 신규 결함 1종 실제 원본 storage 이벤트 핸들러 mock 재현·QA 수정, 최종 커밋 코드 1,473/1,473 scoped assertion PASS. 다음 3-8-45.** 3차 신규 제품 결함 누적 **36종**, 2차 별도 540종. CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`; QA 브랜치 `qa-3-8`; 운영 `main`. 새 채팅 첫 작업: `qa-round3/CURRENT_STATE.json`, 본 문서, `qa-round3/QA_3-8-44_REPORT.md`, `qa-round3/EXIT_CRITERIA.md` 직접 확인.
- **3-8-44-001 MEDIUM:** 다른 탭에서 `staffAttendance_updateLocalLoginPending_v1:local%3A7`을 기록했을 때, 이미 `local:7`로 열린 sibling 탭의 `handleSharedSessionStorageChange`가 이 신규 키를 무시하므로 guard가 남아 있어도 즉시 민감 UI를 정리하지 않음. 반면 `storedSessionTombstoned('local:7')`는 같은 guard에서 true. 모바일/PC 임시 실제 JS 핸들러 + 가짜 storage event에서 원본 재현; 실 서버 권한 탈취 입증 아님.
- **수정:** `qa-3-8/index.html`에서 **같은 `local:` token의 guard storage event**만 처리. 정상 로그인 도중 임시로 만들어지고 사라지는 guard 알림까지 logout하지 않도록 `setTimeout(...,80)` 후 현재 token 및 `sessionContextEpoch` 소유권 + 현재 `storedSessionTombstoned(current)` 재확인. 남아 있으면 관리자 지연 인증 proof 정리·`logout(false)`; 정상 로그인 guard 해제, 늦게 온 지난 이벤트, 다른 token/세션은 무시. 유효 guard read 실패는 fail-closed.
- 이슈 `qa-round3/issues/3-8-44-001_PENDING_LOCAL_LOGIN_GUARD_EVENT_IGNORED_BY_OPEN_TABS.md`, 보고서 `qa-round3/QA_3-8-44_REPORT.md`.
- 최종 QA `index.html` blob **`ab638a84e6c211a3845889c9ab9b69a1f2b4f1ea`**, 최종 제품코드 commit **`ba5a242ee66ac8aeacf7c5f7b255f8ac7e81989e`**; 43 기준 blob `44639c7e2f31f7037b4a10999c580348c083fd1e`. 먼저 immediate prototype commit `e20368da5d149a55a721324bfe12af8df9ad37ea`을 만들었다가 정상 재로그인 경합 고려 후 80ms 검증으로 최종 수정했으므로 **프로토타입을 최종 기준으로 쓰지 말 것**. APP_VERSION `ver20261018-2313` 불변.
- **최종 커밋 실제 함수/정적 1,473/1,473 PASS:** guard event 192 combinations×6=**1,152**, 과거 token-specific logout·suppression·foreign storage events **102**, local pending guard 성공·epoch 실패·guard remove 거부 복원 **180**, Realtime old/new channel reconnect와 지연 remove callback **32**, JS syntax2/script count1/HTML ID 488 count&unique2/version1/로그인 가드 3경로1 = **7**. 물리 브라우저·실계정 Supabase E2E 테스트 아님.
- `qa-round3/EXIT_CRITERIA.md`의 실제 Chrome 두 탭·Web Locks/Android-iOS·QA-only Supabase, 관리자 PIN/근태·지문 통합·마지막 2개 상이한 CLEAN 등이 아직 미충족. 이를 검수 완료했다고 오인하지 말 것. 새 MEDIUM은 종료 조건 충족이 아님.
- **운영 `main` baseline SHA `6c784210e048426f18a486d5602652626d97574d`**, 실제 직원 DB/근태/지문/실 RPC·SQL·배포 0. 다음 블록 시작/종료 때 main ref 확인.
- **다음 3-8-45:** guard storage event vs `logout(false)`의 suppression/tombstone 기록과 정상 재로그인 동시 경합을 별도 검사하고, 물리 Chrome/구버전 탭 실제 시험 가능 조건, QA-only 테스트 계정 사용 여부를 명확히 구분. `main`/실 직원 DB 금지. 실제 기기 환경이 없으면 미검증으로 남기며 mock 통과를 E2E로 표현하지 않음.
- 사용자 선호: 연결 안정성 우선, 보고 짧게, 상세 기록 GitHub, ZIP 파일 불필요, 검수 블록을 무의미하게 늘리지 않기.

