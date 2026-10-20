# 근무모아 3차·깊이8 — 3-8-35 공식 검수 보고서

## 판정
- **3-8-35 범위 한정 완료. 신규 결함 1종(MEDIUM: 3-8-35-001) 발견·QA 수정·회귀검사 통과. CLEAN 아님.** 3차 누적 신규 결함 **27종**(2차 과거 540종 별도).
- **154/154 유효 격리·정적 PASS** = 신규 로그인/tombstone mock 77 + 자동업데이트 복원 mock 16 + Realtime SUBSCRIBED/catch-up 경합 mock 20 + 전체 소스/JS/DOM·기존 기능 정적 41.
- 공식 시작: 3-8-34 완료/3차 26종/QA HTML `c754f9ff2be9e82768b550eb7ea3852f9b82d687`. GitHub 상태·인계·34 보고서 및 이슈 직접 조회.
- QA 수정본 HTML blob **`4fd569795a1eafbdaf0918c4e0f2c4f0dfca3cbe`**, 제품코드 커밋 `9eca7cef89362cc81fc052a82a1134c399340231`. 버전 `ver20261018-2313` 고정, 운영 `main` `6c784210e048426f18a486d5602652626d97574d` 변경 없음. 직원 DB/Supabase API/SQL·배포 0.

## 깊이8 수행
1. **공식 체크포인트:** 이전 34 완료 및 신규 결함 26종 확인. QA index 원본 Git blob으로 분석. 운영 branch 배포·실 직원 데이터 금지 유지.
2. **레거시 aggregate와 재로그인 상호작용:** 부분 migration 실패로 `A,B` legacy 기록이 남을 때 `clearUpdateHandoffLogoutTombstone(A)`은 개별 A key만 지워 A가 여전히 차단됨. 기존 실제 `storeLoginSession` 소스 pc temporary, pc persistent, mobile 모두 신규 로그인 성공(true)이면서 저장 세션은 A tombstoned로 남는 불일치 **원본 재현**.
3. **최소 QA 패치 및 오류 차단:** aggregate에서 A만 제외한 나머지 유효 기록을 유지하여 다시 쓰고, 쓰기·토큰 표시 제거에 실패한 경우 fresh login을 실패로 돌림. 기존 shared session/tab token은 가능한 기존 상태로 rollback. login 흐름의 저장소 오류 안내를 유지. `clearLogoutTombstone=false` restore 경로 무변경.
4. **실제 소스 격리 77/77:** 3 저장방식 × 정상·과거 표식·혼합 B 저장 실패·aggregate 쓰기 차단·개별 키 삭제 실패·로그인 유지/관리자 상태·복원 경로·만료·다른 세션 롤백 12 조합 등, 추가 36개 token/저장방식 가변 경계. 이전 결함을 재현한 실패는 PASS 수 제외.
5. **자동업데이트 복원 소스 16/16:** 실제 `restoreUpdateSessionHandoff()`를 가짜 token/tab/shared storage에 주입. 정확한 로그아웃 A 및 B, partial quota, 미래·만료 timestamp, 버전/유효기간, 관리자 handoff 격리, legacy shared handoff로 token 재생성 방지.
6. **Realtime subscribe/catchup 소스 20/20:** 실제 `startRealtime` 함수에서 비로그인/강제 PIN/미설정/오프라인/공유 mismatch, 정상 SUBSCRIBED 직후 authoritative catchup, INSERT refresh, 이전 채널의 늦은 완료/오류/이벤트, 새 채널 topic ID/상태 전파를 모의 검증. 실제 Supabase subscribe 전송이나 실사용 직원 세션 검사는 아님.
7. **구문/기존 기능 회귀 41/41:** 커밋 후 QA HTML의 inline JS 2개 파싱·literal id 488개 중복 0, APP_VERSION, main SHA, 이전 30~34 보호장치·관리자 unlock·대기중 저장·수정/삭제·날짜 선택기·감사로그·Realtime callback 등 주요 함수/가드 존재 검사. 정적 검사는 해당 화면들의 end-to-end 기능 인증이 아님.
8. **GitHub 기록/안전:** 이슈 `qa-round3/issues/3-8-35-001_SAME_TOKEN_RELOGIN_LEGACY_TOMBSTONE.md`, 본 보고서 및 state/인계 기록 QA branch에만 저장. `main`, 실제 직원 DB, Supabase 원격 함수/SQL, 배포 0. 35 전체를 무결함 CLEAN으로 평가하지 않음.

## 미검증 및 다음 범위
- 실제 멀티탭 Web Locks/same-token 로컬 preview 로그아웃 및 재로그인, 구버전 탭이 legacy aggregate를 다시 기록할 때의 실시간 경합. shared legacy aggregate의 read-modify-write는 구버전 탭이 존재하면 원자적 보장을 할 수 없음.
- 웹 스토리지 자체가 읽기 실패/기록 불가인 상태, rollback 자체가 실패하는 극단적 저장소 환경, Android/iOS 실기기·PWA. 분리된 QA 사용자와 실 서버가 없는 상태이므로 실직원 로그인·Realtime 2계정 통합시험은 수행하지 않음.
- **다음 블록 3-8-36:** 구버전 레거시 writer 재기록과 same-token fresh-login·logout marker 우선순위, rollback 실패 시 로컬 유효성, 자동업데이트 handoff/새 Realtime generation 경계에 대한 QA-only 회귀 확대. 운영본과 직원 DB 지속 보호.

검수 시각: 2026-10-20 (KST)
