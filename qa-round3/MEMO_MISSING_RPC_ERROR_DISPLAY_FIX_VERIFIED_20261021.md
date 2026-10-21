# 근무모아 — 메모 저장 실패 안내가 지워지는 결함 QA 수정·실제 브라우저 통과 (2026-10-21)

> **판정: QA 브랜치에 한정된 UI 오류 안내 수정 PASS (실제 Chromium + 모의 서버 404 + 일회용 PostgreSQL).**
> **실제 운영 PostgREST/Auth/RLS/CAS 통합시험은 아님.** 운영 `main`/Supabase 업무 테이블/직원 근태·개인 데이터 수정·배포 0.

## 1. 재현 및 실제 원인
- 종전 [메모 UI E2E 보류 보고](MISSING_RPC_REAL_MEMO_BUTTON_E2E_BLOCKER_20261021.md)는 당시 유효한 결과였으나, 실패의 두 원인을 후속 검증으로 분리했다.
- 원인 A — **테스트 하네스 자체 오류**: Playwright synchronous API를 쓰는 Python 테스트가 메모 저장 클릭 후 `time.sleep()` 반복문으로 대기하여, 브라우저에 등록한 `page.route(...)` 요청 처리 이벤트를 지연시켰다. `page.wait_for_function(...)` 및 `page.expect_response(...)`로 수정하니 저장 버튼의 RPC 호출 1회와 합성 404 HTTP 수신이 실제로 확인됐다. 따라서 이전의 **“버튼이 RPC를 호출하지 않는다”는 제품 결함으로 판정하지 않음**.
- 원인 B — **실제 앱의 UI 오류문구 덮어쓰기**: `saveSelectedDateMemo()`가 서버 실패를 잡아 `memoDetailError`에 오류 문구를 쓰더라도, 같은 작업의 `finally`에서 `syncOpenDetailPermissionsPreservingDraft()`가 쓰기권한 정상일 때 `memoDetailError.textContent=''`으로 오류를 지웠다. 변경 전 [재현 Actions 39562263938](https://github.com/eco-i/eco-i.github.io/actions/runs/39562263938)에서 실제 404 응답을 수신한 후 오류문구가 빈 문자열로 남아 검수 FAIL. 원인 A와 구분되어 코드상 덮어쓰기 확인됨.

## 2. 검수 브랜치 코드 최소 수정
- 대상: **`qa-3-8/index.html`만**, 실제 배포 `main/index.html`은 변경하지 않음.
- QA 제품 수정 커밋: `c09c31507b21c7f61b91f769b03120997a7b57ce`; 변경 HTML blob `ea593d343ba8e16757adc0582a395ccfd8e8fc69` (구 `08867d7117ad9ae5a8247eda8d223687af2b8411`).
- UI 접근권한 검사 구간에서 `memoPermissionMessage`를 계산하여:
  1. **권한 제한 발생 시 즉시 현재 상태를 오류 영역에 표시**하고 저장 버튼 잠금 유지.
  2. **권한은 정상이고 이전에 쓴 메시지가 서버 저장/삭제 실패였다면 지우지 않음**.
  3. 이전 권한 제한 메시지와 현재 영역 문구가 같은 경우에만, 권한 복구 시 그 *권한 상태 메시지만* 지움.
  4. 입력한 메모 원문, 서버 RPC 호출명/인자/검사조건, 관리자 권한/RLS/DB를 변경하지 않음.
- `APP_VERSION`은 QA 후보 실험으로 아직 변경하지 않음. **운영 배포나 릴리스 승인 아님**. 나중에 승인받은 정식 릴리스 패키징 시 버전 변경/업데이트 내역/회귀검사를 함께 해야 함.

## 3. 실제 GitHub Actions 증빙
- [최초 수정 시험 — Run 39562537890](https://github.com/eco-i/eco-i.github.io/actions/runs/39562537890) **SUCCESS**:
  - 원본 앱 그대로 Chromium에서 가상 직원 로그인/메모 textarea 입력/저장 버튼 실제 클릭.
  - 가짜 loopback API에서 실운영에서 이름이 확인되지 않은 `save_my_memo_v2`에 대해 **PostgREST 형식의 모의 `PGRST202`/404** 반환.
  - 버튼에서 실제 RPC 요청 정확히 1회, HTTP 404 응답 확인.
  - 오류 문구 visible PASS, 메모 초안/편집창 보존 PASS, 저장 버튼 재활성 PASS, 일회용 PostgreSQL에 **잘못 저장된 행 0**, 프런트에도 거짓 저장상태 0.
- [확장 회귀 — Run 39562765829](https://github.com/eco-i/eco-i.github.io/actions/runs/39562765829) **SUCCESS**:
  - 정상이용 권한의 단순 화면 갱신 후에도 실제 서버 실패 안내가 유지됨 PASS.
  - **가상 계정 readonly 전환** 시 보호 안내가 우선 나타나고 저장 버튼 잠김/초안 보존 PASS.
  - readonly 복구 후 기존 권한 안내만 사라지고 가상 작성 중 초안/저장 버튼 정상 복원 PASS.
  - 실제 운영 Supabase 도메인 네트워크 요청 **0**.
- 제품 수정 커밋에서 함께 실행된 다른 기존 가상 시험도 성공:
  - [가짜 로그인 Chromium](https://github.com/eco-i/eco-i.github.io/actions/runs/39562538040) SUCCESS.
  - [실제 근태 폼 + 합성 SQL](https://github.com/eco-i/eco-i.github.io/actions/runs/39562538035) SUCCESS.
  - [Chromium→합성 PostgreSQL 브리지](https://github.com/eco-i/eco-i.github.io/actions/runs/39562538015) SUCCESS.
  - [GitHub SQL provenance 감사](https://github.com/eco-i/eco-i.github.io/actions/runs/39562537903) SUCCESS.
  - [실제 서버 함수명 26종 불일치에 대한 배포 차단](https://github.com/eco-i/eco-i.github.io/actions/runs/39562537918)은 **의도대로 FAILURE, RELEASE BLOCKED**. 이 빨간 결과를 오류로 오해하거나 강제로 우회하지 않음.

## 4. 남은 핵심 제약
- **실제 운영 서버에는 최신 26종 RPC 이름이 여전히 확인되지 않았고**, 메모 `save_my_memo_v2`도 포함돼 있다. 이번 수정은 오류를 *사용자에게 보이게 하고 초안을 보호*할 뿐, 서버 원본 누락을 복구하지 않는다.
- 완전한 실제 Supabase Auth/RLS/PostgREST/CAS·2계정 경합/관리자 PIN/휴근/지문 등 P0 5 + P1 3 E2E는 미수행/보류. 가상 404를 운영 서버의 실제 오류 응답처럼 주장하지 않음.
- 관련 `holidayWorkError`/`overtimeDetailError` 같은 UI 상태 텍스트 초기화도 향후 정밀 검토 후 **별도 증빙으로만** 취급한다.
- 새 QA 수정이 확보한 것은 **새로 실증한 UI 오류문구 덮어쓰기 결함 1건의 QA 전용 수정 및 범위한정 PASS**다. 공식 QA 블록 `3-8-54`는 아직 시작/완료 선언하지 않고, 누적 공식 신규 결함 `37`은 기존 상태파일 값을 임의 변경하지 않음; 정식 결함대장 반영은 승인된 공식 검수 블록에서 일관성 있게 처리.
- **최종 상태:** 운영 `main` 무변경, 실제 DB 및 원본 SQL 무변경, QA 전용 HTML 1건 수정, 실제 P0/P1 E2E NOT CLEAN, 배포 승인 없음.
