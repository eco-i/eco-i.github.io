# 근무모아 3차·깊이8 코드 종합검수 **조건부 종료 보고서**
작성 기준: **2026-10-20 KST** · GitHub `eco-i/eco-i.github.io` · 검수 `qa-3-8` / 운영 `main`

> **최종 결정:** 3차 **코드 수준의 반복 종합검수만 조건부 종료**한다. **실제 서버/실기기 E2E 통과 아님, 전체 3차 무결함(CLEAN) 판정 아님, 운영 배포 승인 아님.** 독립 검수 서버를 확보하기 전에는 `3-8-54`를 시작하거나 완료 처리하지 않는다. 이번 문서는 기록·분류 작업이며 추가 제품 시험 결과를 생성하지 않았다.

## A. 공식 집계 및 증거
| 항목 | 값 | 근거·주의 |
|---|---|---|
| 공식 마지막 완료 블록 | **3-8-53** | `CURRENT_STATE.json` · `QA_3-8-53_REPORT.md` |
| 추후 실증 예약 블록 | **3-8-54** (미시작) | Docker/Supabase 및 독립 합성 backend 확보 이후만 |
| 3차 신규 제품 결함 | **37종** | HIGH **5**, MEDIUM **22**, LOW **10**, CRITICAL **0**(기록상) |
| 2차 과거 결함 | **540종** | 별도 과거 집계; 3차 신규 집계에 재산입하지 않음 |
| 마지막 제품 코드 변경 | **3-8-45** | 46,47,48~53에서는 제품 코드 변경 기록 없음 |
| 코드 범위 무결함 재검수 | **3-8-46: 1,062/1,062; 3-8-47: 265/265** | 서로 다른 실함수+stub/mock/정적 검사 2회만 CLEAN; 실브라우저/DB 통합 시험 대체 안 됨 |
| QA index.html Git blob | `08867d7117ad9ae5a8247eda8d223687af2b8411` | GitHub `qa-3-8` 실물 blob 재확인 |
| QA maintenance JS Git blob | `f8e8e469503d0abf53844aa85188b15b09a95238` | GitHub `qa-3-8` 실물 blob 재확인 |
| 앱 버전 | `ver20261018-2313` | 46/47/53 보고 기준, 코드 수정 없음 |
| 운영 `main` HEAD | `6c784210e048426f18a486d5602652626d97574d` | GitHub branch HEAD 직접 재확인, 기준 일치 |
| QA ↔ 운영 변경 | QA가 main 대비 **219 commit ahead / 0 behind**, GitHub compare에 114 변경파일 표시 | QA-only 제품 수정·보고서·지원 도구 포함. **운영에 반영된 변화 아님** |
| 클라우드/운영 데이터 | 신규 유료 프로젝트·운영 DB/실 직원 정보 접근·SQL 실행·배포 **이번 마무리 작업 0건** | Github QA 문서만 변경 |

## B. 코드 범위에서 확인한 것과 확인하지 않은 것
### 확인된 코드·모의검사 증거
- `3-8-46`: 근태 변경 RPC의 세션/권한 방어, 연가 시간/근무조/대정비 계산, 지문 변경 힌트, Realtime 보류 신호, JS 구문 및 DOM ID 중복 여부 등 **1,062/1,062 scoped 검사 PASS**.
- `3-8-47`: 근태 삭제와 오래된 권한 응답, 사용자 PIN 변경, 사진 picker 취소/지연, disabled/readonly 계정, RPC 응답의 세션 소유권, 사진 압축 중 상태 변경 등 **265/265 scoped 검사 PASS**.
- `3-8-48~53`: E2E 준비·연결주소 차단·로컬 서버 보호 도구의 합성 검증만 진행. `3-8-53`의 Docker 검사 **가짜 CLI 12/12 PASS**는 실제 Windows Docker 구동 또는 전체 근무모아 로그인 성공 근거가 **아님**.
- 이 보고서는 **추가 JS/SQL/Chrome/모바일 실행 없이 기존 GitHub 보고서·등록된 결함·브랜치 코드 blob·운영 HEAD를 상호 대조한 상태 정리**다.

### 중대한 한계
- 마지막 고위험 수정 후 **실제 앱 전체 통합 회귀 / 라이브 동시성 / 실기기 검사**는 실시하지 않았다.
- 결함 목록의 **37종 모두** QA 수정 파일 또는 보완 위치가 등록되어 있고 `production_applied: false`로 기록되어 있으나, 이것은 각 수정이 **실서버에서 해결된 사실을 뜻하지 않는다**.
- 특히 SQL 동시성, 관리자 권한·로그인 경합, 정비 revision 처리의 **HIGH 5종은 실증 완료 선언 불가**.
- 74개 `pending_manual_tests` 메모는 블록 진행에 따라 누적된 검사/환경 제한 설명이며, **신규 결함 74종 또는 향후 74블록 의무**를 뜻하지 않는다.

## C. 고위험 결함 5종 — 별도 실증 없이는 종료 불가한 위험
| 결함 | 위험 | QA 기록상 상태 | 실제 E2E |
|---|---|---|---|
| `3-8-5-001` | 공휴일 편성 변경과 기존 휴일근무 이력 충돌·무결성 | QA SQL guard 및 serialization 보완 기록 | **미검증**, 실제 두 세션 트랜잭션 필요 |
| `3-8-10-001` | 이전 로그인의 정비 저장 완료가 새 로그인 저장 잠금 해제 | QA JS 수정·모의 세션 검증 기록 | **미검증**, 실제 두 관리자 로그인 필요 |
| `3-8-11-001` | 중첩된 정비 read/write의 느린 응답이 revision을 역행 | QA JS 수정·모의 비동기 검증 기록 | **미검증**, 실제 서버 경쟁 필요 |
| `3-8-30-001` | 오래된 restoreSession 응답이 타인의 앱/초기 PIN 문으로 진입 | QA index 수정 위치 기록 | **미검증**, 실제 권한/복원 경합 필요 |
| `3-8-32-001` | 늦은 비관리자 정리가 새 관리자 unlock을 지우고 이전 계정으로 회귀 | QA index 수정 위치 기록 | **미검증**, 두 탭·Web Locks 실제 필요 |

**주의:** QA 브랜치에서 결함에 대응하는 코드가 존재해도 아직 운영 main으로 적용하지 않았다. 사전 운영 반영·시험을 암묵 승인하지 않는다.

## D. 남은 E2E 검사 — 8개 독립 영역
| 우선 | 시나리오 | 검증 목표 | 상태 |
|---|---|---|---|
| P0 | 실제 Chrome 동일 출처 2탭·Web Locks / 로그인·로그아웃·토큰 전환 | 옛 세션/민감 UI가 타 계정에 노출되지 않음 | BLOCKED |
| P0 | 휴일근무 ↔ 공휴일/정비 변경 동시 SQL 트랜잭션 | 불법 이력 생성·부분 커밋·정합성 역행 0 | BLOCKED |
| P0 | 두 관리자 정비 revision 충돌 + 늦은 GET/POST | 입력 손실·중복 저장·revision 역행 0 | BLOCKED |
| P0 | 근태 수정·삭제 CAS vs readonly/disabled·인사/권한 변경 | 미인가 쓰기 0, 변경 충돌 안전 표시 | BLOCKED |
| P0 | 관리자 PIN·초기 PIN·백업/복원 RPC 지연/세션 전환 | 옛 관리자 권한 되살아남/오래된 성공 표시 0 | BLOCKED |
| P1 | Android/iOS 실제 지문사진 picker / 앱 복귀·BFCache | 취소·복귀 때 오저장·옛 사진 노출 0 | BLOCKED |
| P1 | Supabase Realtime 구독·INSERT·오프라인 후 재연결 | 읽기 최신성·미저장 편집 보호 | BLOCKED |
| P1 | 연가·교대·대정비·휴일근무·인사발령 UI/DB 일치 | 실제 표시/차감/가용 인원 정합 | BLOCKED |

**공통 선행조건:** 실제 운영 프로젝트와 완전히 분리된 **합성 기초 schema, RLS/RPC, 가짜 계정, 가짜 사진**을 가진 QA-only Supabase, QA 서버로만 접속하는 테스트 웹, 실제 브라우저/필요 실기기. GitHub 증분 SQL 16개에 앱의 literal RPC 71종 중 이름 일치 정의는 3종만 있어 **빈 로컬 Supabase를 설치하는 것만으로 E2E 실행 불가**. 운영 DB 복사, 클라우드 연결, 실 직원 정보 재사용 금지.

## E. 운영 배포 전 결정 기준
1. **조건부 종료 범위:** 기존 정적/함수 격리 검수의 반복 블록은 여기서 멈춘다. 검수 공식 완료 번호는 53에서 고정하고, 54는 격리 실서버가 실제 준비될 경우에만 개시한다.
2. **제품 결함:** 현 기록상 신규 HIGH 5, MEDIUM 22, LOW 10은 QA 수정 위치가 있으나 **실 E2E 해결 검증을 거치지 않았다**. '전체 해결 완료'로 표시하지 않는다.
3. **실증 원칙:** 가능해지면 위 P0 5건 우선, P1 3건을 종단 간 검사. 무단 실데이터 변경 금지. 시험 불가인 위험의 수용/배포 선택은 사용자가 위험을 파악한 뒤 별도로 승인해야 한다.
4. **브랜치/DB 보호:** 운영 `main` 병합·제품 배포·실 직원 DB schema 변경은 **전부 보류**. 별도 최종 배포 지시가 없으면 실행하지 않는다.
5. **실배포 체크:** QA 최종 코드/SQL 패치 분리 확인, 독립 테스트 증빙, 변경내역·배포 버전 동기화, 백업·복구 계획, 직원 권한·비밀번호·지문·근태 데이터 영향 확인이 필요.
6. **비용/사용자 조작:** 사용자 Windows PC에 Docker 설치는 현재 의무가 아니다. 독립 QA 환경 제공 전 mock-only 검수 무한 반복하지 않는다.

## F. 37종 결함 인덱스
아래는 `CURRENT_STATE.json`에 **등록된 이슈·수정 위치의 추적표**이며, 각 행의 '미반영'은 **운영 미배포**, 실기기 E2E를 통과했다는 뜻이 아니다. 자세한 수정 근거는 해당 블록별 보고서/issue, QA diff에서 확인한다.

| # | 결함 ID | 등급 | 기록된 이슈 제목 | QA 기록상 수정 위치 | 운영 |
|---:|---|---|---|---|---|
| 1 | `3-8-2-001` | LOW | 2036 personal memo storage accepted by server | `qa-round3/fixes/QA_3-8-2_memo_year_guard.sql` | 미반영 |
| 2 | `3-8-5-001` | HIGH | Changing a holiday with existing holiday-work entries creates history consistency conflict | `qa-round3/fixes/QA_3-8-5_holiday_work_history_guard.sql` | 미반영 |
| 3 | `3-8-5-002` | MEDIUM | Maintenance save errors immediately overwritten by final render | `maintenance-20261018.js` | 미반영 |
| 4 | `3-8-8-001` | MEDIUM | Maintenance save in flight silently discards subsequent editor mutations while showing success | `maintenance-20261018.js` | 미반영 |
| 5 | `3-8-9-001` | MEDIUM | Maintenance configuration reload in flight overwrites edits made after reload began | `maintenance-20261018.js` | 미반영 |
| 6 | `3-8-10-001` | HIGH | Previous login's late maintenance save finally unlocks a new login's pending save | `maintenance-20261018.js` | 미반영 |
| 7 | `3-8-11-001` | HIGH | Overlapping maintenance reads/write responses roll the client-side schedule revision back to older state | `maintenance-20261018.js` | 미반영 |
| 8 | `3-8-12-001` | MEDIUM | A manual maintenance reload superseded by successful background refresh incorrectly reports a server error and does not adopt latest editor snapshot | `maintenance-20261018.js` | 미반영 |
| 9 | `3-8-15-001` | MEDIUM | Closing and reopening audit log during an in-flight fetch reuses the old request and shows stale results without a fresh read | `index.html` | 미반영 |
| 10 | `3-8-16-001` | LOW | Audit refresh button remains enabled while another audit request is pending; click silently ignored | `index.html` | 미반영 |
| 11 | `3-8-17-001` | MEDIUM | Audit offset pagination drifts under insertions/deletions and silently skips or rejects audit rows | `index.html` | 미반영 |
| 12 | `3-8-21-001` | LOW | Keyboard focus drops to BODY when period attendance date picker rerenders after choosing start date | `index.html` | 미반영 |
| 13 | `3-8-23-001` | LOW | Stale focus timer of earlier dialog steals keyboard focus from newly opened top nested modal | `index.html` | 미반영 |
| 14 | `3-8-24-001` | LOW | Reopening an already open backdrop above another leaves keyboard focus in aria-hidden underlying dialog | `index.html` | 미반영 |
| 15 | `3-8-24-002` | LOW | Closing a parent dialog before its open child leaves the child return-focus target inside hidden parent | `index.html` | 미반영 |
| 16 | `3-8-25-001` | LOW | Deferred modal open/close callback overrides a valid manually focused field in current active dialog | `index.html` | 미반영 |
| 17 | `3-8-26-001` | LOW | Focus target validity misses aria-hidden or inert ancestor of otherwise visible element | `index.html` | 미반영 |
| 18 | `3-8-27-001` | MEDIUM | Holiday work save/delete mutation RPC may be invoked after personnel freshness invalidated during awaited preflight | `index.html` | 미반영 |
| 19 | `3-8-30-001` | HIGH | Stale restoreSession unlock response can enter old employee app or forced PIN gate after new session takes ownership | `index.html` | 미반영 |
| 20 | `3-8-31-001` | MEDIUM | Delayed administrator unlock restore can clear a newer tab's secondary authorization marker before stale restore caller discards result | `index.html` | 미반영 |
| 21 | `3-8-31-002` | LOW | Delayed initial/self PIN focus callbacks can steal focus from higher modal or manually focused input | `index.html` | 미반영 |
| 22 | `3-8-32-001` | HIGH | Delayed non-admin login cleanup clears a newer admin unlock and can re-enter old local identity | `index.html` | 미반영 |
| 23 | `3-8-32-002` | MEDIUM | Deferred administrator privilege revocation can erase a newer user's tab admin marker | `index.html` | 미반영 |
| 24 | `3-8-32-003` | LOW | Old delayed admin cleanup retry can clear freshly reauthorized same-token local session | `index.html` | 미반영 |
| 25 | `3-8-33-001` | MEDIUM | Old session logout cleanup unconditionally removes new login tab update handoff | `index.html` | 미반영 |
| 26 | `3-8-34-001` | MEDIUM | Legacy logout aggregate migration write failure loses the only active logout tombstone | `index.html` | 미반영 |
| 27 | `3-8-35-001` | MEDIUM | Same-token fresh login is reported successful while retained legacy logout aggregate still blocks its token | `index.html` | 미반영 |
| 28 | `3-8-36-001` | MEDIUM | Fresh same-token login is reported successful while shared logout suppression remains authoritative | `index.html` | 미반영 |
| 29 | `3-8-37-001` | MEDIUM | Replayed old-version legacy logout aggregate revokes a successful new local-preview login reusing the same token | `index.html` | 미반영 |
| 30 | `3-8-38-001` | MEDIUM | Failed local fresh-login epoch storage write clears previous logout proof before rejecting same-token login | `index.html` | 미반영 |
| 31 | `3-8-39-001` | MEDIUM | Bounded 64-key pruning evicts still-fresh exact-token logout proof, permitting stranded tab token to be considered for restoration | `index.html` | 미반영 |
| 32 | `3-8-40-001` | MEDIUM | Local fresh-login epoch set succeeds but verification read exception rejects login without reverting marker, suppressing old legacy logout | `index.html` | 미반영 |
| 33 | `3-8-41-001` | MEDIUM | Compound local epoch verification failure and rollback failure leaves failed same-token login eligible for old-session restoration | `index.html` | 미반영 |
| 34 | `3-8-42-001` | MEDIUM | Pending local-login guard getItem error is interpreted as absent marker, permitting tombstoned local-preview token bootstrap/handoff | `index.html` | 미반영 |
| 35 | `3-8-43-001` | MEDIUM | PC tab-only login does not immediately revoke UI upon same-token shared logout suppression storage event | `index.html` | 미반영 |
| 36 | `3-8-44-001` | MEDIUM | Pending same-token local login guard storage event is ignored in active sibling tabs, leaving revoked sensitive UI visible until later context check | `index.html` | 미반영 |
| 37 | `3-8-45-001` | MEDIUM | Queued stale same-token logout suppression storage event falsely revokes a new login after the marker is cleared | `index.html` | 미반영 |

## G. 변경 보호 및 후속 인수인계
- 이 문서는 GitHub `qa-round3/ROUND3_CODE_REVIEW_CONDITIONAL_CLOSEOUT_20261020.md`에 저장.
- 이 마무리 단계에서 제품 `index.html`, `maintenance-20261018.js`, SQL, 운영 `main`, 운영 직원 데이터 모두 **변경하지 않음**.
- `CURRENT_STATE.json`의 마지막 완료 `3-8-53`, 신규 결함 `37`, 다음 번호 `3-8-54`는 **번호 기록상 유지**; 전체 QA는 E2E 미충족이며 코드 검수만 조건부 종료.
- **재개 시점:** 사용자가 실제 격리 테스트 환경 구축을 별도로 선택하거나 E2E가 실행 가능해지면, 이 보고서와 `E2E_RUNBOOK.md`를 기반으로 **새 통합검수 단계**를 진행. 당시 필요한 QA 서버·브라우저 조건을 먼저 검증한다.
