# ★★★근무모아 2차-8단계 종합검수 — 새 채팅 인수인계★★★

## 가장 먼저 할 일
이 문서를 읽은 뒤 아래 GitHub 파일을 기준으로 그대로 이어서 진행한다.

1. `qa-handoff/index.before-2-8-192.html`
2. `qa-handoff/QA_2-8-191_REPORT.md`

Project Library에도 동일 기준이 있다.
- `/★★★근태 사이트★★★/index.working-2-8-191.html`
- `/★★★근태 사이트★★★/QA_2-8-191_REPORT.md`
- `/★★★근태 사이트★★★/index.before-2-8-192.html`

## 공식 현재 상태
- 마지막 유효 완료 블록: **2-8-191**
- 다음 블록: **2-8-192**
- 누적 제품 결함: **350종**
- 공식 완료/다음 시작 SHA-256: **0e6df82d15531585cbe09365a07b9a967c32b6f0ee044b5d75642b693758a455**
- APP_VERSION: **ver20260927-0944**
- SQL: **변경 없음**
- QA 차수/깊이: **2차 / 깊이 8단계**
- GitHub 브랜치: **qa-2-8**

## 절대 유지할 운영 규칙
- 사용자가 블록 번호를 착각해도 **마지막 유효 완료 다음 번호**로만 진행한다. 번호를 건너뛰지 않는다.
- 사용자가 빨리 끝내고 싶어 보여도 **깊이 8단계와 검수 범위를 줄이지 않는다.**
- 종료 판단은 속도가 아니라 **검수 범위 충분한 소진 + 회귀 안정성**으로 한다.
- 명확한 기술적 결함은 별도 승인 없이 즉시 수정하고 관련 회귀검사까지 수행한다.
- UX/정책 선택이 필요한 사항은 사용자 판단을 받는다.
- 종합검수 종료 전 **새 APP_VERSION을 임의로 만들지 않는다.**
- SQL은 실제 필요가 생기기 전까지 건드리지 않는다.
- 공식 완료 때 완료본/보고서/다음 시작 기준본을 보존한다.
- 답변 상단에 가능하면 `[답변까지: 약 ○초 | 답변 시각: 오후 ○:○○]` 형식의 시각 표시를 유지한다.
- 사용자의 `ㄱㄱ`, `ㄱㄱㄱ`는 즉시 다음 작업 진행 의미다.

## 현재 핵심 보호 구조
최근 QA는 다른 탭 로그인 전환, sessionStorage 탭전용 로그인, delayed storage event, async RPC/read/UI commit의 ownership 레이스를 집중적으로 보강했다.

핵심 개념:
- `sharedPersistentSessionMismatch()`
- `reconcileSharedSessionIfNeeded()`
- `sessionContextCurrent(...)`
- `sharedSessionTokenCurrent(...)`
- `sharedSessionContextCurrent(...)`
- `rpcSideEffectSessionCurrent(...)`
- mutation response ownership fence
- sensitive read response ownership fence
- transport-error ownership fence
- Realtime catch-up/freshness generation
- pending 해제 finalizer는 의도적으로 local ownership을 유지하는 경로가 있음

중요 원칙:
- action / UI commit / authoritative read 결과 반영은 shared-session ownership을 확인한다.
- 반대로 shared-session 전환 중에도 기존 작업의 pending을 풀어 reload/reconcile이 교착되지 않도록, 일부 `finally` finalizer는 local session ownership을 유지한다.
- PC의 tab-specific `sessionStorage` 로그인은 다른 탭의 shared `localStorage` 로그인과 독립적으로 유지한다.

## 최근 블록 요약
### 2-8-173 ~ 175
- 새 월 이동/가시 서버화면 generation/freshness 및 data-action 후 authoritative refresh 보호.
- 새로 열린 서버 화면과 인사 영향 재검증 추가.

### 2-8-176 ~ 178
- mutation 결과 불확실 + post-read 실패 이중불확실성 보강.
- mutation 성공 후 authoritative reread 실패 시 catch-up 보강.

### 2-8-179 ~ 181
- timeout/network/transient mutation 결과 불확실 catch-up.
- freshness generation fence 및 token+epoch owner.
- shared localStorage 직접 비교로 Realtime timer/full refresh/mutation uncertainty 보호.

### 2-8-182 ~ 185
- 로그인/세션복구/초기 PIN bootstrap의 shared-session ownership 보강.
- RPC side-effect, readonly 역순 race 보강.
- direct SESSION_EXPIRED logout 우회 제거.
- 직원/인사/계정상태 disabled authoritative read의 shared-session ownership 보강.

### 2-8-186
- mutation 성공응답 도착 시점의 token + session epoch + shared 저장소 ownership fence.
- 누적 결함 329종.

### 2-8-187
- mutation HTTP 오류응답, sensitive read 응답, transport error에도 응답시점 ownership fence.
- 누적 결함 332종.

### 2-8-188
- 감사로그 pagination, 용량관리 연쇄조회, 직원 PIN 상태 독립 관리자 read ownership 보강.
- 누적 결함 335종.

### 2-8-189
- 남은 session-bound direct read와 mutation preflight read ownership 전수 정리.
- local-only direct read **20개 → 0개**.
- 누적 결함 340종.

### 2-8-190
- 내부 loader가 shared 전환으로 취소돼도 바깥 wrapper가 옛 캐시/UI를 다시 commit할 수 있던 문제 보강.
- 휴근/초과/메모 상세 retry, 사내일정 관리창, 직원관리 composite, 지문 사진 비동기 UI 흐름.
- 누적 결함 344종.

### 2-8-191
신규 결함 **6종**, 누적 **350종**.
1. 초과근무 저장의 undefined `stillCurrent()` 런타임 경로.
2. 메모 저장의 undefined `stillCurrent()` 런타임 경로.
3. 메모 삭제의 undefined `stillCurrent()` 런타임 경로.
4~6. 일반 사용자/관리자 mutation의 서버 처리 후 재조회·toast·modal close·렌더 등 post-mutation UI commit이 local-only ownership을 사용하던 계열을 shared-session ownership으로 통일.
- undefined guard 3경로 → 0
- post-mutation 재조회 후 local-only 검사 15곳 → 0
- 직접 결함 검증 6/6 PASS
- source/structure contract 39/39 PASS
- shared-session 상태모델 12/12 PASS
- 173~190 핵심 보호 회귀 24/24 PASS

## 2-8-192에서 우선 볼 방향
깊이 8단계를 유지하고 특정 주제에만 과몰입하지 말 것.

우선순위 후보:
1. 191에서 보강한 post-mutation success/error UI commit 뒤에 남은 modal close/focus restore/toast/pagination cursor/cache finalizer 레이스.
2. `SHARED_SESSION_CHANGED` sentinel을 caller catch가 일반 업무오류로 다시 표시하는 우회가 남아 있는지 전수.
3. mutation 후 복수 단계 resync에서 1단계는 shared-aware지만 후속 wrapper/render가 local-only인 잔여 경로.
4. delayed storage event 중 오래 살아있는 timer/debounce/observer/callback이 이전 계정 UI를 commit하는지.
5. 다운로드/export/backup/restore처럼 브라우저 side-effect가 동반되는 async 작업의 response/side-effect ownership.
6. shared-session 영역을 충분히 소진하면 다른 축으로 넓혀 race, modal target generation, rollback, pagination, cache, hidden/visible lifecycle, offline/transient 오류 회귀를 계속 본다.

## GitHub 인수인계 상태
2026-10-06에 GitHub connector의 실제 생성/읽기/삭제 쓰기 테스트가 모두 성공했다.
이 인수인계 폴더의 `index.before-2-8-192.html`과 `QA_2-8-191_REPORT.md`는 Project Library 원본과 **문자열 exact-match**까지 검증했다.

## 새 채팅에서 사용자가 할 말
사용자는 파일을 다시 업로드할 필요가 없다.
새 채팅에서 아래처럼 말하면 된다.

> 근태 사이트 이어서. GitHub `qa-2-8`의 `qa-handoff/START_HERE_NEW_CHAT.md`부터 읽고 2-8-192 시작해.

