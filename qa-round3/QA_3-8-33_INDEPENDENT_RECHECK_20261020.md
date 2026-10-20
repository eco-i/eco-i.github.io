# 근무모아 3차·깊이8 — 3-8-33 독립 재검증 기록 (2026-10-20)

## 기준선 충돌 및 처리
- 이번 요청에 포함된 인계 시점은 공식 3-8-32 완료 / 다음 33 / 3차 신규 결함 24종. 그러나 작업 시작 전 `qa-3-8`의 `CURRENT_STATE.json`과 `START_HERE_NEW_CHAT.md`에 **3-8-33 완료 / 다음 34 / 25종**으로 이미 기재되어 있음. `QA_3-8-33_REPORT.md`와 결함 기록도 이미 존재하여 번호/결함을 중복 집계하지 않고 **공식 기록 보존 후 독립 재검증**으로 처리.
- 33 공식 기록의 결함: `3-8-33-001` MEDIUM. 옛 token 지연 logout이 새 token의 `sessionStorage` 업데이트 handoff까지 지움.
- 공식 QA 소스 `index.html` blob `d55a32fcbcad3110db76c8725b4b088fca7362d1`; 33 직전 blob `8d1793491a2ff6447011fde1b3db8eae05d05830`. 두 GitHub blob 전체를 직접 비교. 변경 구간은 `markUpdateHandoffLoggedOut(token)`에서 세션 handoff 무조건 제거 1곳을 토큰 일치 시에만 제거하도록 바꾼 1곳뿐. 앱 버전 `ver20261018-2313` 유지.
- GitHub `main...qa-3-8` 비교로 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 확인. 운영 변경·서버 RPC·SQL·실 직원 DB 접근 없음.

## 독립 검사 — 49/49 PASS (기존 공식 143건과 별개)
1. **원본 대비 수정 함수 실제 코드 실행 12/12:** 분리한 원본/수정된 JS를 메모리상의 가짜 `localStorage`/`sessionStorage`와 시간 함수로 실행. OLD 로그아웃 + NEW 인계, 본인 인계 제거, 빈 token, 깨진 JSON, 타 token, legacy shared handoff 본인 제거/타인 보존, 탭·shared 인계 교차 두 종류, 없는 인계, 특수문자 token, 대소문자 다른 token. 12개 최종 기대 동작 통과. 원본 코드의 타인 인계 삭제 문제는 7개 조건에서 관측되었으며, 이 최초 실패는 PASS에 미포함.
2. **tombstone·레거시 이관 관련 실제 함수 12/12:** `migrateLegacyUpdateHandoffLogoutTombstones`, `updateHandoffTokenWasLoggedOut`, `clearUpdateHandoffLogoutTombstone`, `markUpdateHandoffLoggedOut`, `pruneUpdateHandoffLogoutTokenKeys` 추출 실행. legacy 배열/단건 이관, 만료된 기록 거르기, 최신 exact marker 우선, 기존 token 로그인 차단/타인 비차단, 만료된 exact marker 청소, 미래시각 표식 보수적 유지, exact token만 해제, URL 인코딩, malformed aggregate 정리, 만료값 prune 확인.
3. **정적·구문 보호장치 25/25:** 전체 GitHub HTML의 인라인 JS 2개 파싱 정상, literal HTML id 488개 중복 0, APP_VERSION 고정, 조건부 handoff 제거, tombstone per-token 키/TTL/Mutex 점검. 기존 3-8-30~32와 관련된 로그인·공유세션·관리자 해제·초기 PIN·Realtime 채널/재연결·모달 최상단·mutation catch-up 함수 존재/보호 조건 확인. 정적 검사는 런타임 보안 또는 브라우저 화면 테스트가 아님.

## 깊이8 판단 및 잔여 위험
1. 인계 충돌 인식·공식 상태 보호.
2. 33 직전 GitHub blob와 현재 blob의 실제 변경 범위 대조.
3. 기존 결함 재현 및 수정 함수 독립 검증.
4. 탭/legacy handoff의 타 세션 보호 검증.
5. per-token tombstone 이관·만료·해제 회귀.
6. 기존 JS·DOM 무결성 및 이전 보안장치 정적 점검.
7. 운영 main 및 실 직원 DB 보호 확인.
8. 검증 한계와 GitHub 재검증 결과 보관.

**결론:** 3-8-33-001 QA 수정이 점검한 격리 시나리오에서 정상 동작함을 독립 재확인. 본 재검증에서 별도 신규 결함을 확정하지 않음. 따라서 공식 3차 누적 신규 결함 **25종**, 마지막 공식 완료 **3-8-33**, 다음 **3-8-34** 그대로 유지. 과거 143/143은 선행 공식 보고서의 수치이며 이번 세션에서 재실행한 수치는 **49/49**임.

**미검증:** 실제 로그인한 전체 앱 Chromium, 독립 QA 서버 2계정·멀티탭 Web Locks / sessionStorage 이벤트 경합, Android/iOS PWA, 실 Supabase Realtime, 실제 비동기 RPC. 같은 token 재로그인 시점 소유권 및 레거시 공유 기록의 동시 이관은 3-8-34 범위로 유지. 이 문서는 QA 검증 보고만 추가하며 코드·운영 main·실 직원 DB에 수정 없음.
