# 근무모아 2차-8단계 종합검수 — 2-8-191 완료 보고

## 기준
- 시작 기준: `2-8-190` 공식 완료본
- 시작 파일: `index.before-2-8-191.html`
- 시작 SHA-256: `8830cd13077e4b07b9b9a4ee8d85fab8229da2654c03c209cba915c31f3b5988`
- 완료 파일: `index.working-2-8-191.html`
- 공식 완료 SHA-256: `0e6df82d15531585cbe09365a07b9a967c32b6f0ee044b5d75642b693758a455`
- 신규 제품 결함: **6종**
- 누적 제품 결함: **344 → 350종**
- APP_VERSION: `ver20260927-0944` 유지
- UPDATE_HISTORY: 변경 없음
- SQL: 변경 없음

## 신규 결함 및 수정

### 1. 초과근무 계획 저장 후처리에서 정의되지 않은 `stillCurrent()` 호출
`saveOvertimeDay()`은 mutation 결과불확실 후 authoritative 재조회와 정상 저장 후 재조회 경로에서 `stillCurrent()`를 호출했지만 함수 내부에 해당 guard가 정의되어 있지 않았다. 운영 서버 저장 후 이 경로를 타면 `ReferenceError`로 빠져 최신 화면 반영/성공 안내가 끊길 수 있었다.

수정:
- `saveOvertimeDay()`에 shared-session aware `stillCurrent()`를 명시적으로 정의.
- post-mutation UI commit은 `sharedSessionContextCurrent()` 기반 ownership이 남아 있을 때만 수행.
- `finally`의 pending 해제는 기존 local session ownership으로 유지.

### 2. 개인 메모 저장 후처리에서 정의되지 않은 `stillCurrent()` 호출
`saveSelectedDateMemo()`는 메모 저장 후 월 메모 재조회 다음 단계에서 `stillCurrent()`를 호출했지만 함수 내부 정의가 없었다. 정상/불확실 mutation 뒤 D-DAY 재조회 및 상세/목록 갱신 전에 런타임 오류가 발생할 수 있었다.

수정:
- 메모 저장 action guard를 shared-session aware `stillCurrent()`로 정의.
- 재조회·상세 렌더·목록 갱신·성공/경고 UI는 shared ownership 유지 시에만 commit.
- pending 해제 finalizer는 local session 기준 유지.

### 3. 개인 메모 삭제 후처리에서 정의되지 않은 `stillCurrent()` 호출
`deleteSelectedDateMemo()`의 catch 경로가 정의되지 않은 `stillCurrent()`를 사용했다. 서버 stale/통신 오류 등 예외가 발생한 상황에서 원래 오류 안내 대신 `ReferenceError`가 추가로 발생해 사용자가 실제 실패 원인을 확인하지 못할 수 있었다.

수정:
- 메모 삭제에 shared-session aware `stillCurrent()` 정의.
- preflight/재조회/오류 안내/후속 렌더 모두 동일 action ownership으로 통일.
- 삭제 pending 해제는 local session 기준 유지.

### 4. 일반 사용자 mutation의 post-resync UI commit이 local session만 확인해 shared-session handoff 뒤 옛 UI를 반영 가능
장기재직·연차 기준 저장, 초과근무 계획/완료, 메모 저장·삭제·선택삭제, 휴근 저장·삭제/목록삭제, 근태 저장·삭제는 mutation RPC 응답 자체는 186~187의 중앙 fence로 보호되었지만 그 이후 authoritative 재조회가 진행되는 동안 다른 탭 shared 로그인이 바뀌면 바깥 mutation wrapper가 `sessionContextCurrent()`만 보고 계속 살아남을 수 있었다.

영향:
- 재조회가 shared-session 변경으로 취소됐는데도 옛 계정 기준 `renderCalendar`, 상세 렌더, 성공/경고 toast, 폼/목록 UI commit 가능
- storage 이벤트 도착 전 짧은 구간의 cross-session UI 오염

수정:
- action/UI commit guard를 `sharedSessionContextCurrent()`로 승격.
- `runPostMutationResync()` 이후 local-only 검사 15경로를 shared action guard로 통일.
- PC 탭전용 sessionStorage 세션은 기존처럼 다른 탭 shared 로그인과 독립 유지.
- pending 정리 `finally`는 local ownership을 유지하여 shared handoff 중 pending 교착 방지.

### 5. 사내일정·휴근 가능 설정 등 관리자 mutation의 완료 후처리가 shared handoff 뒤 local-only로 실행 가능
사내일정 저장/삭제와 휴일근무 가능 설정 변경은 mutation이 서버에서 완료된 뒤 관리자 목록/감사로그/직원정보를 재조회하는 동안 shared 로그인이 바뀌어도 `sessionStillCurrent()`의 local token/epoch만 확인하는 후처리가 남아 있었다.

수정:
- 사내일정 저장/삭제의 mutation-applied 이후 modal 전환, 목록 렌더, 감사로그 재조회, success/warning UI를 shared action guard로 통일.
- 휴근 가능 설정의 직원 재조회 이후 UI commit도 shared ownership으로 제한.
- pending/button/loading 해제 finalizer는 local 기준 유지.

### 6. 계정상태·인사발령·인사 복구 mutation 완료 후처리가 shared handoff 뒤 옛 관리자 UI를 commit 가능
계정상태 변경, 인사발령 저장/취소, 인사 복구지점 복원은 mutation 전/응답 시점 ownership은 이미 보호되어 있었지만, mutation이 실제 적용된 뒤 `loadEmployees`/`loadAccountStatus`/전체 refresh가 도는 동안 shared 세션 전환이 발생하면 local `sessionStillCurrent()`로 성공창·modal close·관리자 화면 렌더를 계속 수행할 수 있었다.

수정:
- mutation 적용 이후의 UI/authoritative refresh continuation은 기존 shared-aware `stillCurrent()`를 사용.
- local `sessionStillCurrent()`는 action commit 소유권으로 사용하지 않도록 정리.
- 기존 local finalizer ownership은 유지.

## 회귀검사
- 시작본 SHA-256 재검증: PASS
- 실제 완료본 SHA-256 재검증: PASS
- 시작본 undefined `stillCurrent()` 취약 경로: **3개 재현**
- 수정본 undefined `stillCurrent()` 함수: **0개**
- post-mutation resync와 같은 문장에 남은 local-only session check: **15 → 0**
- 191 직접 결함 재현/수정 contract: **6/6 PASS**
- 191 source/structure contract: **39/39 PASS**
- shared-session action/finalizer 상태모델: **12/12 PASS**
  - 정상 shared 세션 → action/UI commit 허용
  - 다른 탭 shared 로그인 변경/로그아웃 → action/UI commit 차단 + reconcile
  - PC 탭전용 sessionStorage 세션 → shared localStorage 변화와 독립
  - actor/token/epoch 불일치 → stale action 차단
  - shared handoff pending 중에도 local finalizer는 pending 해제 가능
- 173~190 핵심 보호 회귀: **24/24 PASS**
- inline JavaScript `node --check`: PASS (3개 script block)
- DOM ID: 459 / 중복 0
- `$()` 참조: 400종 / 누락 0
- 함수 선언: 833 / 중복 0
- 강제 `capture=`: 0
- 제품 diff: **+77 / -77 lines**
- 변경 함수: 19개, 위 mutation ownership/guard 범위에 한정
- APP_VERSION: `ver20260927-0944` 유지
- UPDATE_HISTORY: 변경 없음
- SQL 변경 없음

## 공식 처리
- 마지막 유효 완료: `2-8-191`
- 누적 제품 결함: `350종`
- 다음 블록: `2-8-192`
- 다음 시작 기준본: `index.before-2-8-192.html`
- 다음 시작 SHA-256: `0e6df82d15531585cbe09365a07b9a967c32b6f0ee044b5d75642b693758a455`
