# 근무모아 3차·깊이8 — 저장 도중 강제 **본인 1차 PIN** 변경 및 오래된 응답 검수

- **일자:** 2026-10-25 KST
- **최종:** **28/28 scoped PASS**, 실패 0; GitHub Actions [Run 40159610770](https://github.com/eco-i/eco-i.github.io/actions/runs/40159610770), HEAD `8c3c1de51774fec0ad0fb3c32656bbec96de9145`, 워크플로 성공, `PIN_GATE_PASS` 28개 및 `PIN_GATE_SCOPE_PASS 28 scoped assertions`.
- **대상:** `qa-3-8`의 원본 `index.html`을 loopback 임시 사이트로 안전 치환하여 실제 Chromium에서 실행. 신원·인증·강제 초기 PIN 상태·HTTP 거부는 모두 **가상/모의 서버 응답**, PostgreSQL은 CI 때만 존재하는 폐기형 시험 DB.
- **스크립트:** `qa-round3/e2e/ci/browser-inflight-initial-pin-gate.py`
- **워크플로:** `.github/workflows/workmoa-qa-inflight-own-pin-gate.yml`
- **범위 경계:** **본인 로그인 1차 PIN 강제 변경** 시험이며, **관리자 공통 2차 PIN의 실제 변경/재발급 시험이 아님.** 원본 Supabase Auth/PostgREST/RLS/서버-side commit-time 권한/PIN 검증의 동등성을 증명하지 않음.

## 확인한 시나리오

**A. 진행 중 계정 변경에 최신 초기 PIN 변경 요구가 도착함**
1. 시험 관리자 A의 원본 UI SAVE 요청을 가짜 서버에서 의도적으로 보류한 상태와 DB 쓰기 0을 확인.
2. 서버가 `INITIAL_PIN_CHANGE_REQUIRED`를 회신하면 `state.initialPinRequired=true`, 업무 앱/관리자 도구 비표시, 강제 PIN 변경 대화상자 활성.
3. 기존 관리자 PIN unlock 표시값과 별개로, 일반 `admin_set_employee_account_status_v3` RPC를 재호출하면 `INITIAL_PIN_CHANGE_REQUIRED`로 **네트워크 전 차단**. 서버가 추가 변경 요청을 받지 않음.
4. 실제 본인 PIN 변경 폼을 열고 가상 PIN 변경을 요청. 모의 서버가 `CURRENT_PIN_INVALID`를 반환한 후 `initial_pin_status_v1=true`를 일관되게 반환하도록 구성해, 오류 안내 표시 및 강제 변경 게이트 유지 확인.
5. 합성 인사 DB revision 0 / event 0.

**B. 과거 관리자 B의 지연 오류와 최신 관리자 A의 새 로그인**
1. B의 SAVE 요청을 서버에서 지연하고, B를 로그아웃한 뒤 **같은 브라우저에서** A가 실제 로그인 버튼+2차 PIN을 사용해 재로그인.
2. 옛 B 요청에 `INITIAL_PIN_CHANGE_REQUIRED`를 늦게 회신.
3. 최신 A 사용자·토큰·관리자 unlock 유지, A에게 강제 PIN 게이트가 잘못 켜지지 않음, 실제 앱 화면 유지.
4. 총 2건의 시험 변경 요청 모두 거절, 가상 PostgreSQL 변경/감사 로그 0, 호스팅 Supabase 호출 0, 브라우저 미처리 JS 오류 0.

## 테스트 과정 중 보정한 두 가지 **fixture 이슈**

- [Run 40159375468](https://github.com/eco-i/eco-i.github.io/actions/runs/40159375468) 최초 실패: 강제 게이트에서 `activeAdminMode()` 함수가 여전히 참이므로 시험에 둔 `!activeAdminMode()`라는 **과도한 내부 구현 가정**을 충족하지 못함. 이 값은 이미 성립한 관리자의 **2차 PIN unlock 상태**를 반영할 수 있으며, 그 사실만으로 업무 RPC 우회/저장 허용을 의미하지 않음. 해당 가정을 제거하고 실제 업무 RPC가 클라이언트에서 차단되는지 확인. 로그에는 **`PIN_GATE_OBSERVATION stored_admin_mode_under_gate=True`**를 명시해 후속 원본 서버 검토 시 남김.
- [Run 40159519625](https://github.com/eco-i/eco-i.github.io/actions/runs/40159519625) 2차 실패: 모의 서버가 `INITIAL_PIN_CHANGE_REQUIRED`를 반환해 놓고, 잘못된 현재 PIN 후의 재확인에서는 `initial_pin_status_v1=false`로 답하는 **상충되는 fixture**. 서버 응답을 일관성 있게 모델링해 강제 요구가 유효한 동안에는 `true`를 반환하도록 변경하고, 독립적인 다음 시나리오 진입 전 시험 상태를 초기화.
- 위 두 실패는 **최종 28/28 통과 전 검수 장치/기대값 수정 이력**이고 제품 신규 결함으로 확정하지 않는다.

## 중요한 미검증 경계

- 본인 비밀번호를 **정상적으로 변경하고** 실제 Auth/세션 상태가 재인증되는 원본 서버 roundtrip, 다른 창의 PIN 갱신, 실제 session revoke, 원본 서버의 관리자 PIN 검사·RLS, 원본 DB commit 직전 stale 권한 재검증은 이번 범위 밖.
- 이전 관리자의 요청이 실제 서버에서 **이미 커밋된 뒤 응답만 유실**되는 불확정 commit 결과도 시험하지 않음.
- 특히 `activeAdminMode()`가 강제 게이트 중 참인 상태는 이 시험에서는 새로운 업무 저장을 우회하지 않았지만, 이 값을 신뢰하는 **다른 클라이언트 기능들까지 모두 보안상 안전함을 증명한 것은 아님**. 전체 RPC allowlist/서버권한 검증 필요.
- 사용 중인 가상 PIN은 폐기형 테스트 더미일 뿐 실제 직원 인증정보가 아님.

## 공식 상태 — 이전 기준 유지

- 운영 RPC **23/26=88.5%** (인수인계 기준, 새 실측 아님). 남은 3종은 지원 답변 전 설치·실행·우회 금지.
- 기존 관리권한 회수·세션만료 **21/21 scoped PASS**, 저장 중 역할회수·세션 핸드오프 **24/24 scoped PASS**와 별개로 이번 **28/28 scoped PASS**.
- 공식 마지막 완료 **3-8-53**, 다음 **3-8-54 미시작**. 3차 신규 결함 37종 유지, 전체 **NOT CLEAN**. 전체 블록 수가 미정이므로 완료 % 계산하지 않음.
- 운영 `main`, 실제 직원 DB/원본 Supabase, RPC 권한/복구 SQL/배포 **변경 없음**.
- 원본 동등 독립 QA Auth+PostgREST+RLS+직원/세션/인사 기본 스키마·프로젝트를 확보하고 허가받기 전 공식 3-8-54 진입 금지.

## 다음 작업

1. 기존 `qa-round3/e2e/QA_BACKEND_GAPS.md`와 비공개 서버 원본 후보 정의를 비교해 Auth/세션/관리자 2차 PIN/PIN reset, 공유 CAS, RLS/함수 ACL 및 구버전 writer 차단을 별도로 검증해야 할 항목으로 정리.
2. 운영 DB 데이터·토큰·스키마를 직접 복제하지 않고, 별도 독립 환경과 비민감 정본 설계를 마련하는 데 필요한 승인 조건 문서화.
3. 이 작업 역시 공식 3-8-54 완료/신규 결함 수치에 합산하지 않는다.
