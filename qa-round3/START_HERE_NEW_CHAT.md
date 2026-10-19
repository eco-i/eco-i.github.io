# 근무모아 3차·깊이8 공식 인수인계

- **3-8-32 완료: 신규 3종 (HIGH 1, MEDIUM 1, LOW 1), QA 코드 수정, 유효 격리/정적 136/136 PASS. 다음 3-8-33.** 3차 누적 **24종**(2차 과거 540종 별도). CLEAN 표기 금지(결함 발견).
- GitHub `eco-i/eco-i.github.io`; QA `qa-3-8`; 운영 `main`. 다음 방에서 `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-32_REPORT.md` 확인.
- 32-001 HIGH: 비관리자 `login()` 직후 Web Lock auth cleanup 대기 중 새로운 관리자 로그인으로 전환되면 새 관리자 인증표식 삭제; local preview는 구 계정 화면 재진입. local/server callback 소유권과 await 뒤 소유권 2개 분기 각각 보호.
- 32-002 MEDIUM: readonly/관리자 역할 철회의 `revokeAdminUnlockForToken` 비동기 정리가 새 관리자의 tab unlock 표식을 지울 수 있음. 비동기 callback epoch/token 검증 및 공통 `clearAdminUnlockForSession`의 exact-token tab unlock 삭제로 수정.
- 32-003 LOW: local preview 동일 token 재로그인 뒤 앞선 `scheduleSharedAdminUnlockCleanup` retry가 새 관리자 인증을 삭제. 예약 시 `loginAttemptSeq/sessionContextEpoch` 스냅샷을 잡아 retry/lock callback 내 재확인.
- 최종 QA `index.html` blob **`8d1793491a2ff6447011fde1b3db8eae05d05830`**; 운영 APP_VERSION **ver20261018-2313 유지**. 기존 30/31 fix 보존.
- 32 회귀검사 분류: login 10, revoke 12, same-token retry 7, logout-mismatch 6, Realtime 14, PIN 8, 정적·구문 64, restore 15 = **136 PASS**. 실 서버/브라우저/안드로이드/아이폰 인증은 미검증.
- `main` 기준 SHA **6c784210e048426f18a486d5602652626d97574d** 변경 없음. 실제 직원 DB 조회·수정, SQL 적용, 배포 **0건**. GitHub QA branch에만 코드+공식 보고서+이슈+인계 커밋.
- 다음 **3-8-33:** delayed shared-session cleanup/로그아웃 tombstone, PC vs mobile 저장소 owner, 초기 PIN 강제 게이트/Realtime 채널 경합.
- 짧은 진행 보고, 연결 안정성·채팅 용량 절약, ZIP 요청 불요.
