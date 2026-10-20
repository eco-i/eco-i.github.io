# 3-8-37-001 — 구버전 탭의 오래된 logout aggregate 재등장으로 로컬 동일 토큰 재로그인 차단

## 판정
- **MEDIUM, QA-only 수정.** 기존 3-8-36의 suppression 제거 실패 또는 3-8-35의 aggregate 일부 이관 실패와는 원인이 다름.
- 로컬 미리보기 계정의 토큰 형식 `local:<id>`는 명시적 로그아웃 후 새 로그인해도 **동일 token이 재사용**된다. 서버가 세션마다 발급하는 원격 토큰과 다름.
- 구버전 탭에서 과거 logout aggregate `staffAttendance_updateSessionLogout_v1`를 미리 읽었거나 보유하다 **새 로컬 로그인이 성공한 다음 뒤늦게 동일한 옛 timestamp로 localStorage에 기록**하면, 현행 `storedSessionTombstoned` 및 `updateHandoffTokenWasLoggedOut`가 과거 로그아웃을 최신 세션의 로그아웃으로 오인. 이전 logout의 token별 키는 정상 정리됐어도 이전 기록 재등장 시 로그인/업데이트 인계가 차단됨.
- 실제 36 완료 HTML blob `86ff27b08a66f7e1853f3888a74a7d8ba0109471`에서 **실제 로그인·로그아웃 판정 함수 실행으로 재현:** local:7 신규 로그인 성공(true), 신규 logout 표식 없음(false) → 뒤늦은 과거 aggregate 재삽입 → 새 로그인 `storedSessionTombstoned(local:7)=true`, `updateHandoffTokenWasLoggedOut(local:7)=true`. 가짜 공유 저장소 기반 재현이고 실제 구버전 브라우저 탭 시뮬레이션은 아님.

## 수정 범위
- QA `index.html`에서 **로컬 미리보기 토큰(`local:`)에만** 짧은 신규 로그인 시각 표식 `staffAttendance_updateLocalLoginEpoch_v1:<encoded token>` 생성. 성공한 fresh login에서 저장소에 실제로 기록되는지 확인하고, 실패하면 로그인도 실패로 처리.
- 새 로그인 시각보다 **엄격히 오래된** 레거시 aggregate 항목에 한해서 무시. `legacyUpdateHandoffLogoutEntries`와 초기 상수 선언 전 호출되는 `storedSessionTombstoned` 양쪽 동일 기준. 초기 부트스트랩 경로에서는 키 접두사를 리터럴로 접근.
- timestamp가 동일하거나 뒤인 **진짜 새 로그아웃**은 여전히 차단. 새로운 per-token 명시적 logout marker와 shared logout suppression은 독립적으로 항상 유효.
- 시계가 5초를 넘게 과거로 보정돼 신규 로그인 시각 검증이 불확실하면 옛 marker 무시 규칙을 **비활성화하여 fail-closed**. `updateTimestampIsFresh` 및 bootstrap의 `freshLocalAt<=now+5000` 보호.
- 일반 서버 발급 세션 토큰은 새 epoch를 요구하지 않고 기존 logout 동작을 유지. 다른 로컬 사용자 로그아웃도 토큰별로 계속 차단.
- **최종 QA index blob** `084696ce5ef54748bcb0043a14504cbae10ebe26`, 제품코드 커밋 `c4ad51bb9f9e9d193cbb3e9a61d6814b9b5f4a6d`. 앱 버전 `ver20261018-2313` 불변.

## 검증
- 최종 QA 소스 기준 **291/291 유효 격리·정적 PASS:**
  - login epoch 실제 JS/메모리 storage, 원격/로컬 토큰, 3 로그인 저장모드, 과거/새 로그아웃, 동일 millisecond 경계, 저장 실패, 타 token, 5초+ 시계 보정 및 25×3 시간 교차 + 다른 16 경계 **190**.
  - `restoreUpdateSessionHandoff` 실제 함수에서 local 과거 재등장/새로운 logout, 정확한 epoch, 임시/영구 admin 및 복원 조건 **40**.
  - `startRealtime` 실제 함수의 subscription/INSERT/구세션 늦은 콜백 경계 **20**.
  - 최종 전체 HTML 인라인 JS 파싱, HTML id 488개 중복 0, APP_VERSION/운영 SHA/기존 로그인·Web Locks·PIN·Realtime·모달 보호 함수 존재 정적 **41**.
- 원본 오류 재현은 PASS 집계에 넣지 않음. 초기 후보의 166+48+22 검사는 별도 탐색/회귀 과정이며 최종 291에 **중복 합산하지 않음**.
- **미검증:** 구버전 JS가 실제 복수 브라우저 탭에서 동일 저장소에 뒤늦게 쓰는 물리 Web Locks/storage 이벤트 순서, storage 전체 장애·rollback 자체 실패, 물리 Android/iOS/PWA, 실제 Supabase 독립 2계정과 서버 Realtime/DB 통합시험. 시계 급변 시 fail-closed에 따른 잠깐의 로컬 로그인 지연 가능.
- 운영 `main` 및 실제 직원 DB/지문·근태기록·Supabase RPC/SQL/배포 접근·수정 **0**.

기록 (KST): 2026-10-20T16:20:22.661+09:00
