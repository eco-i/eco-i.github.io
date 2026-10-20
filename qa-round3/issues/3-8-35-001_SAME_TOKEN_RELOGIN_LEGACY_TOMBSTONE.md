# 3-8-35-001 — 레거시 logout aggregate가 남으면 같은 토큰 신규 로그인이 성공해도 차단된 상태

## 분류 및 재현
- **심각도 MEDIUM.** 3차 기존 26종에서 신규 1종.
- 3-8-34에서 **다른** 레거시 token의 신형 키 이관이 저장용량 초과 등으로 실패하면, 기존 aggregate를 유효 증거로 보존한다. 그러나 이 aggregate에는 로그인하려는 **같은** token의 오래된 logout도 남을 수 있다.
- 기존 `clearUpdateHandoffLogoutTombstone(token)`은 새 개별 키만 삭제하며 aggregate 안의 같은 token 기록을 지우지 않는다. `storeLoginSession(token, ..., true)`는 해제 성공 여부도 확인하지 않고 **true**를 반환.
- 실제 3-8-34 QA blob `c754f9ff2be9e82768b550eb7ea3852f9b82d687`에서 원본 `storeLoginSession`과 tombstone 함수들을 추출해 모의 localStorage의 aggregate `A,B`, token B key 쓰기 실패를 주입. PC tab-only / PC remember / mobile 세 경로 모두 **A 신규 저장 성공(true), A logout 판정 true**를 재현. 즉 재로그인한 사용자는 여전히 인증정보가 차단될 수 있음. 실제 브라우저의 사용자 로그인 재현은 아님.

## QA 변경
- `clearUpdateHandoffLogoutTombstone`: 먼저 가능한 기존 이관, 남아있는 aggregate 안 정확히 같은 token만 제거. 다른 token 기록은 그대로 보존. aggregate 쓰기/개별 키 제거에 실패하거나 남은 tombstone으로 같은 token이 차단되면 명시적으로 false.
- `storeLoginSession`의 모바일 shared / PC remembered / PC tab 3갈래: fresh login 시 해제 실패를 성공으로 보고하지 않고 저장소 토큰을 가능한 이전 상태로 되돌려 false 반환, 관리자 표식/기존 다른 사용자 세션 보존. `clearLogoutTombstone=false` 복원/이관 경로는 기존대로 해제를 시도하지 않음.
- QA 전용 수정. 실제 동시 접근을 원자적으로 해결했다는 주장은 **하지 않음**. 남아있는 legacy shared JSON의 다른 구버전 탭 재쓰기와 같은 token 다중 로그인 세대 충돌은 실브라우저 2탭 QA 격리 테스트가 필요.

## 검사·한계
- **기존 원본 실패 확인** 뒤 패치 소스 격리 **77/77 PASS**: 세 로그인 저장방식 × 실패·성공·부분 실패·이전 토큰 롤백·타 토큰 표식 보존, 36개의 가변 quota 조합 등.
- 같은 source의 `restoreUpdateSessionHandoff` 실제 함수 격리 **16/16 PASS**.
- 실제 `startRealtime` source의 가짜 채널 구독/구독완료/status/INSERT 교차 **20/20 PASS**.
- JS 2개 파싱, 488 HTML ID 유일성, 기능 함수 존재 및 3-8-30~34 권한/세션 보호장치 등 **41/41 정적 PASS**.
- **154/154 유효 검사.** 원본 버그 재현 실패는 PASS 집계에서 제외. 실제 Supabase RPC·Realtime 서버, 직원 계정/DB, 전체 로그인 Chromium, Android/iOS PWA, 실 Web Locks 다중탭 E2E 미실시.
- QA 코드 커밋: `9eca7cef89362cc81fc052a82a1134c399340231`.
- QA HTML blob: `4fd569795a1eafbdaf0918c4f0dfca3cbe`, `APP_VERSION ver20261018-2313` 변경 없음.
- 운영 `main` 및 실 직원 DB/지문·근태 기록 읽기·쓰기·배포 **0**.
