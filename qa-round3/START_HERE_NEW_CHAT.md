# 근무모아 3차·깊이8 — 조건부 코드 검수 종료 인수인계 (2026-10-20)

**현재 결정: 3차 코드 범위 반복 종합검수는 조건부 종료, 실제 E2E 통합검수는 별도 보류. 전체 CLEAN/안전 보증/운영 배포 승인 아님.**

- [최종 코드 검수 조건부 종료 보고서](ROUND3_CODE_REVIEW_CONDITIONAL_CLOSEOUT_20261020.md) — 37종 전체 결함 인덱스, 고위험 HIGH 5종, 실증 필수 P0 5/P1 3, QA 코드/운영 분리.
- **공식 마지막 완료 3-8-53 / 다음 3-8-54 미시작 / 3차 신규 제품 결함 37종** 그대로 유지.
- `3-8-46` 및 `3-8-47`은 1,062/1,062·265/265 **서로 다른 코드 범위 검증 2회 CLEAN**. 마지막 제품 수정은 3-8-45. **E2E 실증이 없으므로 전체 CLEAN 아님**.
- 미검증: 실제 Supabase 동시성·권한/관리자 PIN·근태 CAS·휴일근무 정합·Realtime·2탭/Web Locks·Android/iOS 지문사진·대정비/연가 UI/DB 일치.
- 별도 가짜 직원만 있는 완전 독립 QA schema/RPC와 실제 브라우저 서버가 준비되면 `3-8-54` 실증 진행. **지금 사용자에게 Docker·Git·Node 설치 의무 없음.** 동일 mock 반복 블록은 중단.
- 코드 QA `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, `maintenance-20261018.js` blob `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313`.
- 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 검증; 운영 직원 DB/지문/인증/실근태·SQL/RPC·배포 변경 0. **사용자의 별도 최종 배포 지시 전에는 절대 main 병합/실데이터 조작 금지.**
- 핵심 근거: `qa-round3/EXIT_CRITERIA.md`, `qa-round3/e2e/E2E_RUNBOOK.md`, `qa-round3/REMAINING_RISK_SCOPE_20261020.md`, `qa-round3/QA_3-8-53_REPORT.md`, `qa-round3/CURRENT_STATE.json`.

## 2026-10-21 GitHub Actions 무료 실제 PostgreSQL SQL 통합시험 시작
- [실제 SQL 통합검증 보고서](ACTIONS_POSTGRES_FIRST_PASS_20261021.md) / [성공한 Actions Run](https://github.com/eco-i/eco-i.github.io/actions/runs/39514319716) / commit `366310855aa268318611f321f651f5c3c7e667cd`.
- 실제 PostgreSQL 16.15 컨테이너에서 합성 스키마와 **QA 원본 3-8-6 SQL**을 실행, 휴근-편성 양방향 경합과 두 관리자 revision CAS가 PASS. 이것은 SQL 일부 실증이며 **실제 Supabase Auth/RLS, 전체 사이트, 2탭/모바일 E2E가 아님**.
- 자동화는 `.github/workflows/workmoa-qa-postgres.yml`에서 `qa-3-8` 관련 파일 push만 감지. 기본 무료 Linux 실행환경·외부 Supabase key/endpoint 0.
- **공식 마지막 완료 3-8-53, 다음 3-8-54 미시작, 3차 신규 결함 37종, 조건부 코드종료/전체 NOT CLEAN/운영 배포 보류 모두 유지.**

## 2026-10-21 GitHub Actions 2단계: 원본 근무모아 HTML 실제 Chromium UI PASS
- [보고서](ACTIONS_CHROMIUM_LOGIN_SCOPED_PASS_20261021.md) · [검증된 run 39516333413](https://github.com/eco-i/eco-i.github.io/actions/runs/39516333413).
- **전체 1MB 원본 앱 HTML**을 원격 접근 차단된 Chromium에서 로드. local QA 서버 생성기가 원래 `configured()` 조건 때문에 *오프라인 미리보기로만 전환*되는 검수 환경 결함을 찾아, **생성 임시 QA 문서에만** loopback RPC 연결 판단 패치. 제품 원본 수정 없음.
- Node 생성기 fail-closed 16/16 PASS, Chromium UI 10/10 PASS: 틀린 PIN 차단·합성 로그인 오류, 필수 PIN 변경 게이트, 운영 Supabase/외부 연결 차단.
- **서버는 실제 Supabase가 아니라 fake HTTP RPC**이며 앞 단계의 실제 PostgreSQL SQL 시험과 연결된 전체 E2E가 아님. P0/P1 E2E는 그대로 미검증.
- **공식 완료 3-8-53 / 다음 3-8-54 미시작 / 누적 신규 제품결함 37종 / 전체 NOT CLEAN / 운영 main·실직원 DB·배포 0**.

## 2026-10-21 3단계 — Chromium↔실제 PostgreSQL HTTP 브리지 첫 성공
- [직접 실행 로그](https://github.com/eco-i/eco-i.github.io/actions/runs/39517320631) · [상세 증빙](ACTIONS_CHROMIUM_POSTGRES_BRIDGE_SCOPED_PASS_20261021.md).
- **12/12 scoped PASS**: 앱 로그인 전/초기 PIN 시 앱 자체 RPC 쓰기 거부 + 격리 브라우저 HTTP 전송→합성 gateway→실제 PostgreSQL에서 QA 원본 SQL의 휴일근무 저장·기존 기록 보호·휴일 해제·구 revision 거절을 행 단위 검증.
- **진짜 PostgreSQL 사용**, 그러나 **HTTP gateway 및 로그인 응답/세션 helper는 synthetic**, 성공 쓰기는 앱 입력폼이 아닌 브라우저 test fetch. 정규 Supabase Auth/PostgREST/RLS, 실제 직원계정/근태 작성 UI까지 연결한 full app E2E **아님**.
- 별도 SQL 경합 run 및 기존 실제 Chromium UI run과 역할 다름. 이 사실을 CLEAN이나 실서버 전체검증으로 혼동하지 말 것.
- **공식 마지막 완료 3-8-53 / 다음 3-8-54 미시작 / 결함 37종 / 전체 NOT CLEAN / 운영 main·직원 DB·배포 변경 0**.

## 2026-10-21 4단계 — 원본 로그인·실제 근태 저장 버튼→격리 DB→재조회
- GitHub 성공 run: https://github.com/eco-i/eco-i.github.io/actions/runs/39519223780
- [상세 검수 증빙](ACTIONS_REAL_ATTENDANCE_FORM_SYNTHETIC_SQL_PASS_20261021.md), **11/11 scoped PASS**: 원본 `index.html` Chrome 실제 로그인, 합성 직원/인사 최신 동기화, 안내창 확인 클릭, 근태 등록창/저장 버튼 클릭, QA 전용 근태 RPC 1회, **실제 PostgreSQL 한 건 커밋**, 앱 저장 후 서버 데이터 재조회 확인.
- **중요 제한:** 로그인·인사·근태 저장 SQL/RPC는 이 단계에서 개발한 QA synthetic fixture! 근무모아 운영 `save_attendance_personnel_v2` 서버 원본이 아니며 정규 Supabase Auth/PostgREST/RLS/권한·CAS 전체 실증 **아님**. 날짜는 테스트 코드로 `openForm('2027-05-13')` 호출했으므로 전체 날짜 선택 UI 검증 아님.
- 실 서비스 P0/P1 통합검수 전체는 아직 미검증. **공식 3-8-53 완료 / 3-8-54 미시작 / 결함 37종 / 전체 NOT CLEAN / main·실직원 DB·배포 변경 0** 유지.

## 2026-10-21 원본 서버 함수 증빙 게이트 (추가 mock 검수 중단)
- [검증 보고서](BACKEND_ORIGINAL_SQL_READINESS_AUDIT_20261021.md) · [실행 로그](https://github.com/eco-i/eco-i.github.io/actions/runs/39530177504).
- Actions `backend-readiness.mjs` **정상 PASS**의 의미는 **정적 인벤토리 계산 성공**, 전체 서버 E2E 성공이 아님.
- 원본 앱/지원 JS의 literal/fallback RPC **80종** vs `db/migrations/*.sql` **16개 파일**에서 같은 이름의 원본 `CREATE FUNCTION` **6종**, 원본 정의가 **저장소에 없는 74종**. QA 테스트용 모의함수는 계산에서 제외함.
- 로그인/계정 상태/인사/근태 저장·삭제/PIN 원본 SQL과 RLS·GRANT·세션 권한·CAS 동작은 **원본 서버 DDL 근거 없이 실제 E2E 재현 불가**. 단, 배포된 운영 Supabase에는 다른 함수가 있을 수 있으므로 누락을 단정하지 않음; 운영 서버는 이 작업에서 접근하지 않음.
- 필요한 다음 일은 **민감정보 없는, 버전 관리된 원본 서버 함수 및 스키마/RLS 정의 확보**, 그 다음 운영과 분리된 가짜 직원 QA 프로젝트 재현. GitHub Actions만으로 원본이 없는 74종의 실제 구현을 추측해 PASS 처리하지 말 것.
- **공식 마지막 완료 3-8-53 / 다음 3-8-54 미시작·BLOCKED / 신규 결함 37종 / 전체 NOT CLEAN / 운영 main·직원 DB·배포 변경 0** 유지.

## 2026-10-21 — SQL 원본 확보 보안 게이트 확정 (GitHub 저장소 공개)
- [승인·취급 보안 절차](BACKEND_SOURCE_ACQUISITION_SECURITY_GATE_20261021.md). 저장소가 **Public**임을 API로 확인함. 운영 원본 SQL 함수 본문·RLS·GRANT·계정/PIN/비밀정보를 `qa-3-8` 또는 `main` 등에 직접 업로드하지 않는다.
- 기존 `main` SQL 16파일, `qa-2-8`/2차 종료본/초기 백업 SQL 0파일, 정비 전 백업 SQL 6파일의 현재 트리 점검. 원본 80/6/74 증빙 격차는 해소되지 않았으며 과거 모든 삭제 커밋까지 조사한 결과는 아님.
- 우선 기존 비공개 원본/migrations 출처를 확인하고, 없으면 운영 서버 **메타데이터/DDL 읽기 범위의 명시적 사전 승인**과 비공개 저장·검토 경로가 필요. 추가 가짜 SQL PASS를 운영 원본 검수로 승격하지 않음.
- 공식 완료 **3-8-53 유지**, **3-8-54 미시작**, 누적 **37종**, 전체 **NOT CLEAN**. 운영 `main` 및 직원 DB/배포 수정 없음.

## 2026-10-21 — 과거 비공개 보관 SQL 원본 후보 추적
- [함수명 대조·보안 유지 상세 보고](BACKEND_HISTORICAL_SQL_SOURCE_DISCOVERY_20261021.md): 보관된 2026년 9월 SQL 대표 10파일 읽기 전용 조사(중복 제외). 함수명 정적 대응으로 GitHub 기재 6종 이외에 비공개 SQL 원본 **후보 30종을 추가 확인**하여 **현재 앱 호출 80종 중 이름상 후보 36종**, 나머지 44종은 조사 대상에서 미확인. 함수 버전·인자/반환형·권한·실제 운영 배포/적용 여부는 전부 미검증.
- `BACKEND_ORIGINAL_SQL_READINESS_AUDIT_20261021.md`의 공식 지표 **GitHub 원본 정의 80/6/74**는 그대로 유효하며, 비공개 보관본 30종을 GitHub에 추가했다고 간주하지 않는다. 원본 SQL/RLS 본문, 해시·키·보관 경로·직원 데이터를 공개 GitHub/Actions 로그/Artifact에 올리지 않음.
- 접근 가능한 관련 GitHub 저장소 및 표본 과거 커밋에서 별도 완전 기초 SQL 확인 불가. 원본 최신 서버 동등성 실증을 위해서는 운영 Supabase **읽기 전용 메타데이터/DDL 접근을 명시적으로 별도 승인**받고 안전한 비공개 경로를 준비해야 한다.
- **3-8-53 공식 완료 유지**, `3-8-54` 미시작, 신규 결함 37종, 전체 NOT CLEAN. 운영 `main`·직원 DB·Supabase 접근/변경 0.

## 2026-10-21 — 승인받은 운영 서버 SQL 시스템 카탈로그 읽기 전용 확인
- [실측 결과](PRODUCTION_RPC_METADATA_READONLY_AUDIT_20261021.md). 사용자 승인을 받은 뒤 운영 Supabase **시스템 카탈로그 및 Security Advisors만 읽기 전용 조회**, 직원/근태/지문/Auth 테이블의 실제 행 조회, 로그인, 업무 RPC 실행, SQL/운영 변경 0.
- 기존 **80/6/74는 GitHub 원본 SQL 보관 범위**이며, 새 **운영 현재 함수 객체 실측은 호출 80종 중 54종 설치 / 26종 미설치**. 양자 분모 같지만 질문이 달라 모순이 아님. 실제 근태 저장/삭제 v2, 로그인/PIN, 감사페이지 등 주요 함수 설치 확인. 실제 동작 검증 아님.
- 중요한 배포 계약 위험: 해당 **26종을 운영 `main` HTML도 직접 `rpc(...)` 호출**. 실제 호출 실패/대체경로 및 데이터 손실 여부는 **미검증**; 독립 synthetic 환경 우선 재현 필요. 현재 결함 37종 변경 금지.
- 실제 보안 권한/RLS 어드바이저 검토는 진행했으나 **원본 SQL 본문·RLS 정책식·민감한 운영정보를 공개 GitHub로 저장하지 않음**. 앞으로의 원본 수집은 반드시 허가된 비공개 저장 경로를 선행.
- 마지막 완료 **3-8-53 유지**, **3-8-54 미시작**, E2E 전체 NOT CLEAN. 운영 `main`/직원 DB/배포 수정 0.

## 2026-10-21 — 운영 main에서 직접 호출되는 미설치 RPC 26종(31곳) 확정
- [실제 호출 위치·기능별 영향·구버전 호환성 실측 보고](LIVE_RPC_CALLSITE_MISMATCH_AUDIT_20261021.md) 작성. 사용자 승인 범위의 운영 `pg_proc` 카탈로그 조회와 `main` 및 `qa-3-8` HTML 정적 호출을 대조: **26종은 운영 `public` 서버에 같은 이름의 함수가 없고**, 두 HTML 모두 `rpc('...')`로 **총 31곳에서 직접 호출**한다는 근거 확보. 읽기 전용 조사로 실제 화면 오류/기록 손실을 재현하지는 않음.
- 기존 설치된 `v1`/구이름 함수가 일부 있어도 최신 호출의 `p_expected`, `p_expected_updated_at`, `p_expected_revision` CAS 인자 등이 불일치. **무단 구버전 fallback/원본 아닌 신규 함수 설치 금지**. 원본 정본 확보와 독립 synthetic QA 동시성 검증 필요.
- 데이터·SQL 원본/PIN·세션·직원기록 조회/운영 RPC 실행은 0. 운영 `main` 변경 0. 신규 제품 결함 공식 **37종 유지**(이번은 계약 실측·실제 UI 동작 미검증), `3-8-53` 마지막 완료 / `3-8-54` 미시작 / 전체 NOT CLEAN.

## 2026-10-21 — 실제 Actions 운영 RPC 계약 자동 배포차단 검수
- [실제 자동검수 결과 보고](LIVE_RPC_RELEASE_GATE_FIRST_RUN_20261021.md) / [Actions Run 39540136579](https://github.com/eco-i/eco-i.github.io/actions/runs/39540136579): **QA 코드 checkout + 운영 main 읽기전용 checkout + Node 파서 자기시험 + 스냅샷 실측 대응 감사 + 이름 전용 증빙 artifact 저장 모두 성공, 마지막 릴리스 차단만 의도적으로 FAIL**. 워크플로 빨간 표시는 테스트 도구 고장이 아니라 **확인된 26 미설치 RPC/직접 호출 31곳 때문에 배포 금지하는 정상 작동**.
- 신규 QA 전용 파일: `qa-round3/e2e/ci/live-rpc-contract-snapshot.json`, `qa-round3/e2e/ci/live-rpc-contract-gate.mjs`, `.github/workflows/workmoa-qa-live-rpc-contract.yml`; **원본 SQL·RLS·운영 키·실제 데이터는 저장하지 않음**. CI에서는 운영 Supabase에 접속하지 않으며 하루짜리 사용자가 승인한 catalog 메타데이터 스냅샷을 적용(7일 만료, main SHA 변경 시 fail closed).
- 자동차단은 원본 누락 26종의 수리나 실제 E2E 검증이 아니므로 **전체 NOT CLEAN**, **3-8-53 공식 마지막 완료·3-8-54 미시작·결함 37종 유지**. 구버전 fallback 강제 삽입·운영 RPC 수정/설치는 명시적 최종 승인 없이 절대 금지.

## 2026-10-21 — 실제 메모 UI 누락 RPC 음성경로 자동검수: FAIL/BLOCKED
- [실제 Chromium UI 실험·실패 원인 분리 보고](MISSING_RPC_REAL_MEMO_BUTTON_E2E_BLOCKER_20261021.md). 무료 Actions에 가상 직원용 실제 앱 로그인/날짜 메모 UI + 가짜 PostgreSQL 16 메모 테이블 + PostgREST 형태 `PGRST202` 합성 404 게이트웨이를 구축. 관련 파일: `qa-round3/e2e/ci/browser-missing-rpc-memo.py`, `missing-rpc-memo-fixture.sql`, `.github/workflows/workmoa-qa-missing-rpc-ui.yml`.
- 실제 Chromium 버튼 클릭 이벤트 1개, CDP 메모 저장 click 리스너 1개는 확인했지만 **클릭 직후 memo 저장 RPC가 나가지 않았음**. 동일 화면에서 함수 *직접 호출*로 RPC가 발생한 것은 사용자 버튼 E2E 성공이 아니므로 검수 코드가 직접 호출 진단을 제거하고 **UI_BUTTON_NOT_DISPATCHED FAIL CLOSED**하도록 수정함.
- **실제 운영 서비스 장애의 근본 원인이나 신규 확정 결함으로 단정하지 않음**: 독립 합성 인증/브리지와 앱 초기화/세션보호 조건을 추가 분리 진단해야 함. 기존 서버 함수 미설치 26종/직접 호출 31곳 실측은 그대로 유효. 메모 404 후 UI 오류·초안 유지에 관한 E2E PASS는 아직 주장할 수 없음.
- `main`/직원 DB/실제 Supabase/운영 로그인/RLS·RPC 읽기·쓰기 0. **3-8-53 완료 / 3-8-54 미시작 / 신규 결함 37종 / 전체 NOT CLEAN**.

## 2026-10-21 — 실제 메모 저장 실패 UI 원인 규명 + QA 전용 수정, Chromium PASS
- [최종 실증 및 최소 수정 보고](MEMO_MISSING_RPC_ERROR_DISPLAY_FIX_VERIFIED_20261021.md): 앞서 “버튼 클릭 후 RPC 미발생”이라고 보였던 것은 QA 테스트의 `time.sleep()` 대기가 Playwright `page.route` 이벤트 루프를 막은 하네스 문제. 정상적 `expect_response`/이벤트 루프 대기로 다시 측정하니 실제 UI Save click→`save_my_memo_v2` POST **1회**→합성 404 반환을 확인.
- 앱에 **별도 실제 결함 확인**: `saveSelectedDateMemo()` catch의 저장실패 문구를 같은 함수 finally에서 `syncOpenDetailPermissionsPreservingDraft()`가 비워 버림. `qa-3-8/index.html` 한 구간만 보수적으로 수정 (commit `c09c31507b21c7f61b91f769b03120997a7b57ce`, **QA blob `ea593d343ba8e16757adc0582a395ccfd8e8fc69`**). 데이터 편집/서버 RPC/세션/운영 코드 변경 0.
- [크로미움 수정 최초 PASS Run 39562537890](https://github.com/eco-i/eco-i.github.io/actions/runs/39562537890), [추가 권한 전환 회귀 PASS Run 39562765829](https://github.com/eco-i/eco-i.github.io/actions/runs/39562765829): 사용자 가상 로그인, 실제 Save 버튼, 합성 PGRST202/404, 저장오류 가시성, 입력 초안 유지, DB 불변 0건, 다시 쓰기 가능, readonly 잠금/복귀 정상. **운영 PostgREST/Auth/RLS의 실제 E2E 완료가 아님.**
- 변경 커밋 기준 기존 가상 근태 폼/로그인/SQL 브리지/원본 감사 PASS; [운영 API 이름 불일치 배포 차단](https://github.com/eco-i/eco-i.github.io/actions/runs/39562537918)은 **의도된 RED** 유지(26 서버 함수 미설치, 31 UI 호출 개소).
- 구 [실패 보고](MISSING_RPC_REAL_MEMO_BUTTON_E2E_BLOCKER_20261021.md)에는 **후속 해결 표시**. 현재 해당 실패는 QA 브라우저 음성경로 범위에서 해소. QA 제품결함 **1건 신규 확인·QA에서 수정**하되 공식 상태파일의 누적 결함 **37종·3-8-53 완료·3-8-54 미시작**은 아직 변경하지 않음. 실제 P0/P1 E2E, 독립 QA 원본 서버 복구, 운영 배포 **NOT CLEAN/BLOCKED**.

## 2026-10-21 — 휴일근무·초과근무 저장실패 안내 오류 QA 수정 + 실제 Chromium PASS
- [정밀 원인·수정·검수 보고서](HOLIDAY_OVERTIME_ERROR_VISIBILITY_QA_VERIFIED_20261021.md). 메모에 이어 **휴일근무·초과근무**의 권한 정상 상태에서 저장 실패 안내가 후속 `syncOpenDetailPermissionsPreservingDraft`에 의해 사라질 위험 확인. 휴근은 `finally`에서 즉시 사라질 수 있고, 초과근무는 저장 함수 내 `saveError` 임시복원에도 재동기화 시 지워질 수 있음. **두 영역에 권한 안내만 별도 추적/복구하는 QA-only 최소 수정**.
- QA 제품 수정/문법교정: `659947c29f...` 초안에 잘못된 `if (...) const` 한 줄로 기존 CI 실패 → `cf84a389ea9e04e7c3e7ae7b3fbe3b24331311b1`로 바로잡음. **정상 검수 QA HTML blob `cc8df3e010234d87ef99b35e66d521ab18d96c4d`**. 운영 `main`/실 직원 DB는 변경 0.
- [실제 가상 Chromium 버튼 Save·404/409 실패 UI PASS](https://github.com/eco-i/eco-i.github.io/actions/runs/39564500467) / [readonly 잠금·복귀 확장 PASS](https://github.com/eco-i/eco-i.github.io/actions/runs/39564699553). 휴근 가상 토요일 체크/시간, 초과근무 +10분; 가상 404/PGRST202 및 409/STALE_OVERTIME_DAY, 문구 유지·초안 보존·재시도 가능·실험용 PG 무쓰기 0·외부 Supabase 접근 0. 실제 운영 Auth/RLS/CAS E2E 아님.
- **기존 로그인/근태/메모/PG 브리지 회귀는 문법 수정 후 모두 PASS**, 원본 SQL 감사 PASS. 서버 함수명 **26종 미설치/31개 직접 호출**은 여전히 실증되어 의도된 릴리스 계약 차단 CI RED 유지. 배포 금지/전체 NOT CLEAN. **3-8-53 마지막 공식 완료·3-8-54 미시작·공식 신규 결함 37종 유지**(새 UI 오류 정식 결함대장 등재는 별도 일관된 결정 후).

## 2026-10-21 — 최신 RPC 26종 원본 추적·구버전 계약 정밀 분류
- [1단계 원본 추적·위험 분류 보고](MISSING_RPC_26_SOURCE_RECOVERY_READINESS_20261021.md) / [26종 프런트 입력 계약 자동추출 manifest](e2e/ci/missing-rpc-recovery-contracts.json). 운영 main HTML/호출위치 31개소 대조; GitHub 현행 `db/migrations/*.sql` 16개 blob **26종 정의·명칭 등장 0**. 비공개 2026-09 SQL 보관본 6개 이름 일치 0(해당 6개만 확인, 전체 과거 자료 부재 단정 금지). 원본 SQL/인증정보 공개 반출 0.
- 사용자 승인 범위의 운영 PostgreSQL 시스템 카탈로그 `SELECT`만 조회. 최신 26종은 설치되지 않았고, **22종**에 대응되는 이름의 구버전 서버 RPC 존재. 이 중 **19종은 프런트 요구 인자명/개수가 달라** CAS/revision 인자 등을 누락하며, **3종**은 인자명만 같으나 반환·권한/동시성 동등성은 미검증. **4종**은 유사 구버전 함수도 없음. **자동 fallback/운영 설치 절대 금지**.
- **26종의 실제 최신 SQL 구현은 여전히 확보되지 않았음**. 다음은 신규 함수의 보안 계약/원본 출처를 승인된 비공개 경로에 안전하게 확보하고, 가상 PostgreSQL/PostgREST에서 진짜 함수 정의를 실증하는 것. 생성한 JSON은 *공개된 입력 필드 계약표*이지 SQL 함수 구현 아님. 기존 배포 차단 CI RED 유지.
- QA HTML 최신 기존 blob `cc8df3e010234d87ef99b35e66d521ab18d96c4d` 유지, `main`·실 직원 DB/운영 SQL·배포 무변경, 공식 **3-8-53 / 3-8-54 미시작 / 결함 37종 유지 / NOT CLEAN**.

## 2026-10-21 — 26종 RPC 복구 계약 실제 CI 검증 PASS
- **[GitHub Actions Run 39569094304](https://github.com/eco-i/eco-i.github.io/actions/runs/39569094304) 실제 SUCCESS**. [단계 증빙 보고서](RPC_RECOVERY_STATIC_INTEGRITY_GATE_VERIFIED_20261021.md). QA 정적 회귀 게이트 [rpc-recovery-integrity-gate.mjs](e2e/ci/rpc-recovery-integrity-gate.mjs) 및 [Actions 워크플로](../.github/workflows/workmoa-qa-rpc-recovery-integrity.yml) 추가. main 소스 SHA 고정·QA vs main 직접 RPC 이름 **26종/호출 31곳**과 인자명 확인, CAS 필드 삭제/legacy 함수로 이름 대체하면 fail closed. 실제 UI/SQL/Auth/RLS 동작은 확인하지 않음.
- **중요 구분: 이번 정적 입력 계약 보존용 새 CI는 GREEN**, 기존 **운영 서버에 최신 RPC 이름 26종이 없다는 배포 차단용 CI는 의도대로 RED**. 두 결과를 혼동하거나 GREEN으로 배포 승인하지 말 것. 최신 서버 함수 SQL 본문 0종 확보, 가상 DB에 최신 함수 설치 및 서버 E2E 0. 기존 실측 동일기본명 legacy 함수 22종 중 19종 인자 불일치/3종 인자명만 일치/4종 legacy 없음. 운영과 직원 데이터 건드리지 않음.
- GitHub commit 검색으로 추가 과거 DB 관련 커밋을 확인했지만, **26개 최신 원본 확보 근거 없음**(검색 범위의 한계). 승인된 비공개 SQL 저장·독립 QA 백엔드 원본 확보 전에는 자동 fallback·SQL 생성·운영 배포 금지. 공식 **3-8-53 완료/3-8-54 보류/3차 37종**, 전체 NOT CLEAN.

## 2026-10-21 — 누락 26종 공개 SQL 원본 전수 자동검색: 정확히 0종
- [공개 원본 추적·가짜 양성 정정 보고서](MISSING_RPC_26_FULL_PUBLIC_SOURCE_PROVENANCE_SCAN_20261021.md). GitHub 브랜치 **29개/서로 다른 HEAD 22개**에서 SQL 경로 비교; 현행 마이그레이션 16개 및 과거 기능브랜치 전용 업데이트내역 SQL 2개 모두 누락 26종 정의 후보 없음.
- [자동 원본 검색 Actions Run 39570774153](https://github.com/eco-i/eco-i.github.io/actions/runs/39570774153) 실제 SUCCESS. main·qa-2-8·qa-3-8의 tracked 텍스트 **1,210개**에서 CREATE FUNCTION/CREATE OR REPLACE FUNCTION 정확 최신명 26개 탐색해 **정의 후보 0/26**. [비민감 스캐너](e2e/ci/scan-missing-rpc-definitions.mjs)와 자동 workflow 추가, 7일 artifact에는 SQL 본문 없음.
- 최초 Run 39570556356의 save_my_memo_v2 한 건은 **검색기 자체의 self-test 가짜 CREATE 예제**였으며 실제 원본이 아님. Run 39570696025로 위치 확인 후 자기 예제를 제외해 재검색 → 0건. **가짜 양성을 원본 복구로 집계하지 않음**.
- **현 단계 필수 제약**: 최신 26종 서버 함수 현재 미설치, 원본 SQL 미확보, 구버전 22종 중 19종 CAS 등 인자 불일치. 정적 호출 계약 QA GREEN vs 실 운영 서버 명칭 불일치 배포 차단 RED. 신규 함수 임의 SQL 생성·운영 설치·legacy fallback 하지 않음.
- 다음 안전 진전에는 **운영에 이미 설치된 구버전/공통 서버 함수의 SQL 정의 본문·테이블 스키마/RLS 구조까지 읽기 전용 분석하는 별도 명시적 승인**이 필요. 기존 사용자의 허용은 함수명/인자 카탈로그 메타데이터까지여서 본문/정책식 조회는 아직 승인받지 않았음. PUBLIC 저장소에 함수 보안 본문 반출 금지. 독립 QA PostgreSQL/PostgREST Auth/RLS 실제 서버함수 실증 전에는 3-8-54 시작 불가. 공식 3-8-53 완료·3-8-54 보류·37종·NOT CLEAN; main/직원DB 보호.

## 2026-10-21 — 별도 승인 운영 기존 함수 구현·스키마/RLS/권한 읽기 전용 실측
- 사용자 명시 승인에 따라 **운영 Supabase 이미 설치된 함수 정의 SQL 본문·테이블 구조·역할별 권한 및 RLS 정책을 SELECT 카탈로그만으로 읽기 전용 분석**. [공개 가능 범위만 기록한 보안/구현 준비 보고서](LIVE_BACKEND_FUNCTION_BODY_SECURITY_REVIEW_READONLY_20261021.md). 함수 본문/정확한 정책식/보안 내부 설정은 PUBLIC GitHub에 게시하지 않음.
- 이미 설치된 **기존 업무 함수 26개**, 내부 공통 보조 함수 **19개**의 정의 구조를 확인. 공개 업무 테이블 **27개 모두 RLS 활성화**; 그중 관련 19개 업무 테이블의 컬럼 구조 139개만 조사. **실 직원/근태/지문/PIN/토큰/세션 데이터 행을 조회하지 않음**. 역할별 GRANT/EXECUTE 여부는 공개 가능한 총괄 판단 외 비공개 취급.
- 기존 코드에서 세션·관리자/직원 쓰기가능 상태 판단, 인사 이력·업무상 날짜검증, 백업·복원 형식검사, 업무 테이블 잠금, 감사기록·변경 신호 보조 로직이 존재함을 확인. **정적 확인이며 권한 우회 없음/경합·복원 안전성을 실증한 것은 아님**. 최신 `p_expected`/`p_expected_revision`/`p_expected_id`+`p_expected_updated_at`의 CAS 보장을 구버전 RPC로 대체할 수 없음.
- **서버 미설치 최신 26종의 원본 SQL 구현은 여전히 0개**, 운영 함수 설치·DML/DDL·직원 데이터 변화 없음. 다음은 기존 구현의 계약을 반영한 비공개 신규 설계·독립 QA PostgreSQL/PostgREST 진짜 함수 E2E; 추가 프로젝트/과금/실운영 SQL 적용에는 별도 사용자 승인 필요.
- `main` 보호, 공식 **3-8-53 완료/3-8-54 미시작·보류/3차 37종 유지**, 실 서버 RPC 계약 릴리스 차단 RED, 전체 NOT CLEAN.

## 2026-10-21 — 미설치 RPC 26종 복구 수용설계/격리 QA 진입 게이트 (신규 작업)
- [26종 도메인별 복구 수용조건과 독립 QA 선행조건](RPC_26_RECOVERY_DESIGN_AND_ISOLATED_QA_ENTRY_20261021.md) 작성. **최신 서버 SQL 구현/설치 아님**; 운영 구버전 내부 구현·RLS 원문은 PUBLIC 저장소에 기록하지 않음.
- [함수별 안전 수용시험표](e2e/ci/rpc-recovery-acceptance-matrix.json): **26종 전체**, P0 **14종** / P1 **12종**, 변경 **21종** / 조회·미리보기 **5종**. 프런트에서 expected-state 입력이 없는 **2종**(`admin_cancel_personnel_batch_v2`, `admin_set_holiday_work_enabled_v2`)은 동시수정 안전 설계 **미해결**로 차단 명시.
- [실제 GitHub Actions Run 39576913632 — SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39576913632): 설계 검사 파일 [rpc-recovery-design-gate.mjs](e2e/ci/rpc-recovery-design-gate.mjs), [무료 워크플로](../.github/workflows/workmoa-qa-rpc-recovery-design.yml)로 함수/시험 누락, 위험도 하향, CAS 인자 삭제, 미검증 E2E·복구 완료 표시 등 음성변형 7개를 fail closed 검증. **이는 계약 설계의 정적 PASS로 실제 SQL/Auth/RLS/브라우저 전체 E2E PASS가 아님.** 운영 불일치 26종 배포 차단 CI의 의도된 RED는 계속 유지.
- 다음: 실제 최신 구현 정본이 없다면 비공개 개발 경로에서 신규 SQL 설계·보안검토(임의 fallback 금지); 완전 분리된 가상 PostgreSQL/PostgREST/세션/RLS로 실제 원본 E2E. 비공개 코드 저장 경로·실 구현/과금/운영 설치는 별도 승인 없이 하지 않음.
- **공식 3-8-53 완료 / 3-8-54 미시작·보류 / 결함 37종 / 전체 NOT CLEAN**, `main`·실제 직원 DB·운영 Supabase SQL/RPC/배포 **변경 0**.

## 2026-10-21 — 실제 운영 프런트 RPC 반환값 계약 26종 소스 검증 (추가)
- [실제 앱 응답 검증 함수 테스트 보고](RPC_26_CLIENT_RESPONSE_CONTRACTS_VERIFIED_20261021.md) / [함수별 공개 응답 계약표](e2e/ci/rpc-recovery-client-response-contracts.json). 운영 `main` HTML 원본 기준 직접 호출 **26종/31곳**의 후속 결과검증기 **11종** 확인. 특히 `preview_data_restore_v2`는 **개인 미리보기 2곳 + 관리자 미리보기 2곳**에 사용하므로 역할별 권한 분리 필수.
- [GitHub Actions 실제 PASS Run 39594553591](https://github.com/eco-i/eco-i.github.io/actions/runs/39594553591): Node VM 격리 환경에서 **실제 사이트의 검증 함수**를 추출해 합성 정상·비정상 응답을 시험. 검수 도구: [rpc-client-response-gate.mjs](e2e/ci/rpc-client-response-gate.mjs); [무료 workflow](../.github/workflows/workmoa-qa-rpc-client-response.yml).
- 정상 반환 Boolean `true`/양수 ID/인사 `batch_id,count`/PIN `target_count`/32자리 hex revision/백업·복원 요약 및 scope 등 계약 확인. **이는 프런트 검증함수의 모의 입력 테스트만 PASS**이며 실제 최신 RPC 26종 SQL 원본·Auth/RLS·동시 CAS 실증 **0**. 운영 불일치 배포차단 RED 계속 유지.
- 이번 GitHub 작업은 안전한 공개 QA 자료만 갱신. 실제 SQL 구현/독립 QA 서버 설치/운영 직원 데이터/운영 `main`/배포 변경 **0**. **3-8-53 완료, 3-8-54 미시작·BLOCKED, 37종, 전체 NOT CLEAN** 유지.

## 2026-10-21 — 서버 복구 본격 설계 전 CAS/권한 의사결정 공백 4묶음 정밀 확인
- [실제 클라이언트 근거와 복구 결정사항 상세 보고](RPC_RECOVERY_ACTUAL_CLIENT_CAS_AND_PREVIEW_BLOCKERS_20261021.md) / [비민감 기계판독 의사결정 기록](e2e/ci/rpc-recovery-unresolved-decision-register.json). 기존 조사를 반복하거나 새 synthetic fixture SQL/가짜 PASS를 추가하지 않고, 운영 `main` 원본 호출 흐름을 읽기 전용 대조.
- 인사발령 취소 `admin_cancel_personnel_batch_v2` (10371행): UI는 최신 batch를 다시 읽어 snapshot 비교하지만 RPC에는 `p_token,p_batch_id`만 전달. 서버가 **사용자가 본 원본 수정버전**을 이 요청만으로 알 수 없어, 읽기→쓰기 사이 변경 감지의 클라이언트/서버 계약 결정이 선행.
- 휴근 허용 토글 `admin_set_holiday_work_enabled_v2` (9466행): `p_token,p_employee_id,p_enabled`만 전달, 이전값/revision 부재. 동시 관리자 반대 요청에 대해 CAS 또는 명시적으로 승인된 충돌 처리 의미 결정 필요. 두 함수에 임의 `p_expected` 입력 삽입하거나 현행 26종 정적 게이트를 우회하지 않음.
- 단일 `preview_data_restore_v2`는 개인 2곳/관리자 2곳 공유: UI 반환검증 이외에 서버에서 scope·권한을 독립 강제해야 함. 인사 복구/PIN 초기화/관리자 전체 복원·초기화의 preview→실행 revision 검증도 **트랜잭션 원자 조건**임을 정리.
- 새 보고서는 공개 가능한 보안 수용조건·API 설계 미결정만 포함하고 비공개 함수 SQL 원문/RLS 정책/키/직원 데이터 없음. **실제 26종 SQL 원본 0, 서버 설치 0, 신규 E2E 0**; 출시차단 CI 의도된 RED 유지.
- 다음 실질 단계는 **비공개 구현 소스/독립 QA 환경의 명시적 승인·확보→세션/권한/CAS 구현 계약 확정→실 SQL QA 통합시험**. 이번에는 운영 Supabase에 재접속하지 않음.
- 공식 마지막 **3-8-53**, 다음 **3-8-54 미시작·BLOCKED**, 신규 제품결함 **37종**, 전체 **NOT CLEAN**, `main`·실제 직원 DB·운영 SQL/RPC·배포 변경 없음.

## 2026-10-21 — 운영과 완전 분리된 실제 PostgreSQL 두 관리자 CAS 시험 PASS
- [실제 DB 경합 시험 보고서](REAL_POSTGRES_TWO_SESSION_CAS_LAB_VERIFIED_20261021.md). **최종 GitHub Actions Run [39606034883](https://github.com/eco-i/eco-i.github.io/actions/runs/39606034883) 성공** (최초 Run 39605818320도 성공).
- GitHub Actions ubuntu 일회용 **PostgreSQL 17.11** 서버 서비스 컨테이너에서 synthetic 스키마 `qa_rpc_cas_lab`을 실행. SQL [synthetic-postgres-cas-lab.sql](e2e/experiments/synthetic-postgres-cas-lab.sql), 진짜 두 연결 경합 스크립트 [run-synthetic-cas-lab.sh](e2e/experiments/run-synthetic-cas-lab.sh), [workflow](../.github/workflows/workmoa-qa-postgres-cas-lab.yml).
- **검증:** 변경된 발령 revision으로 취소 거부·미래발령 성공·과거발령 거부; 휴근 설정 expected-state/CAS·중복 변경 부작용 0; **동시 A/B DB 연결 두 종류(휴근 반대설정·인사발령 수정 대 취소)** 행 잠금 후 stale 요청 차단; 트랜잭션 rollback·감사 로그 일관성.
- **중요 제한:** 실험은 실제 PostgreSQL의 합성 함수 2종/가짜 행 검증이며, 앱에서 부르는 **정확한 26종 최신 실서버 RPC SQL 정의 0**, 직원 Auth/RLS/EXECUTE/관리자 PIN/실제 PostgREST 앱 연동 0. 실제 QA E2E 성취가 아니라 충돌 방지 설계 선택의 **격리 DB 기술 실증**만 의미. 기존 운영 HTML 계약 변경 없음.
- 연결된 GitHub에 근무모아 **전용 private** 저장소가 없고, Supabase의 기존 두 프로젝트 중 **별도의 근무모아 QA 프로젝트가 없음**을 메타데이터로 확인. 타 서비스 비공개 저장소/DB를 근무모아 QA로 전용하지 않음. 프로젝트 생성·과금은 조직 지정/비용 확인/별도 승인 전 금지.
- **공식 3-8-53 완료 / 3-8-54 미시작·보류 / 37종 / 26종 실서버 미설치 / 전체 NOT CLEAN / 릴리스 게이트 RED**. `main`/운영 SQL/실제 직원 DB/배포 변경 0.

## 2026-10-21 — 별도 근무모아 QA Supabase 생성 시도: 무료 한도에 의해 거절
- 사용자 승인하에 기존 개인 Supabase 조직에 완전 별도 `Workmoa-QA-Isolated`(서울 리전) 프로젝트 생성을 시도. Supabase 비용 안내 API는 **프로젝트 생성 월 $0** 견적을 제공.
- **실제 생성 API는 실패**: 현재 동일 소유자·관리자의 활성 무료 프로젝트 **2/2개**로 새 무료 프로젝트 생성 불가. 조직 요금제 `free`, 기존 두 프로젝트는 `SongdoFood`와 `mapleland`, 둘 다 `ACTIVE_HEALTHY`. **새 QA 프로젝트 ID/DB 없음**. 자동 비용 청구/Pro 업그레이드 실행 안 함.
- 기존 서비스 프로젝트 **일시정지/삭제/이동/실 데이터 행 조회/SQL 실행 0**. 운영 GitHub `main`·직원 데이터 보호. 타 서비스 DB를 근무모아 QA로 전용하지 않음.
- 새 프로젝트를 위해서는 기존 프로젝트 중 하나 일시중단(해당 서비스 장애 위험) 또는 Pro 유료 전환 등 **별도 사용자 승인**이 필요. 당장은 **무료 GitHub Actions 일회용 PostgreSQL**에서 제한된 가짜 데이터 시험만 가능. 서버 26종 실제 구현 SQL/Auth/RLS/전체 E2E를 통과한 것으로 간주하지 않음.
- 공식 상태 **3-8-53 완료 / 3-8-54 미시작·보류 / 결함 37종 / 전체 NOT CLEAN / 최신 서버 RPC 26종 미설치** 유지.

## 2026-10-21 — 별도 private GitHub 작업공간 생성 UI 차단
- 다음 작업은 누락된 최신 26종 RPC의 **비공개 구현 준비**. GitHub 연결 계정 `ahnbest23-hash`에서 기존 `mapleland` private repo 접근 확인, 그러나 현재 설치된 GitHub 커넥터에 **새 repository 생성 기능이 없음**. 새 저장소를 직접 만들었다고 주장하지 않음.
- 사용자 수행 필요(1회): https://github.com/new?owner=ahnbest23-hash&name=workmoa-backend-private&visibility=private 에서 **Owner ahnbest23-hash / Private / Initialize README / Create repository**. 새 repo가 GitHub App에 자동 노출되지 않으면 GitHub Settings → Applications → Installed GitHub Apps → 해당 앱 Configure → Repository access에서 이 저장소만 추가.
- 새 private repo 접속 확인 후에만 **보안 기본파일·비공개 설계 디렉터리·실 SQL 개발 흐름** 착수. 코드 저장소가 private이어도 직원 데이터, 토큰, 비밀번호, 지문 사진, 운영 RLS/SQL 원문 자동반출 금지.
- 운영 `eco-i/eco-i.github.io`의 `main`, QA 공식상태 `3-8-53`/다음 `3-8-54 BLOCKED`, 공식 제품결함 37종, 전체 NOT CLEAN 유지. 운영 DB/배포 접근·변경 0. 유료 프로젝트 추가 생성 없음.

## 2026-10-21 — 비공개 개발 1차 코드 초안: 개인 메모 RPC 3종 (미설치, 미검증)
- GitHub 연결된 `ahnbest23-hash/workmoa-backend-private`는 **Private**이고 README/SECURITY.md/.gitignore/구현계획 파일이 존재한다는 점을 확인. 다만 앞선 private 저장소 자동 쓰기 작업이 연결 도구 안전 검사에서 차단되었으므로 **코드가 GitHub에 커밋되었다고 주장하지 않음**.
- 공개 `main` HTML 실제 호출 위치를 대조하여 **개인 메모 저장 `save_my_memo_v2` / 개별삭제 `delete_my_memo_v2` / 다건삭제 `delete_my_memos_v2`** 먼저 개발하기로 선정. API 인자 `p_expected`(없으면 null, 있으면 id/date/text/updatedAt)와 Boolean `true` 응답 기준 확인.
- 운영 Supabase는 **읽기 전용 메타데이터** 조회만 수행: 테이블 열/고유 인덱스와 기존 보조 함수명·형식 확인; 직원·세션·PIN·근무 행과 함수 원문/암호정보 **조회하지 않음**. SQL DDL/DML·RPC 실행·실제 데이터 변경 **0**.
- 비공개로 보관할 후보 `DRAFT_MEMO_RPC_3.sql.txt` 및 `MEMO_3_REVIEW_GATE.md`을 작업 파일로 생성. 초안은 `BEGIN; DO RAISE EXCEPTION ...; COMMIT;` 보호구문으로 **실행 시 트랜잭션 롤백**하도록 의도했고, 3 함수가 감사를 거치기 전엔 `EXECUTE` 권한을 부여하지 않음. **파일은 아직 private GitHub 미등록/서버 미설치, 실제 SQL 컴파일·Auth/RLS/CAS 시험 미완료**.
- 승인된 독립 QA 인증/세션/인사 보조 함수를 검토해 SQL 문법과 전체 사용계정 경합을 검증한 후에만 보안 심사→private 정본화 검토. 무료 Supabase QA 프로젝트는 2개 활성 무료 한도로 현재 생성 불가.
- 공식 **3-8-53 완료 / 3-8-54 미시작·보류 / 3차 신규 결함 37종 / 서버 최신 RPC 26종 미설치 / 전체 NOT CLEAN** 유지. `main`·운영 직원 DB·운영 SQL·배포 변경 0.

## 2026-10-21 — Private GitHub 메모 RPC 3종 업로드 확인
- 사용자가 Private GitHub 저장소 `ahnbest23-hash/workmoa-backend-private`에 `DRAFT_MEMO_RPC_3.sql.txt`, `MEMO_3_REVIEW_GATE.md` 두 파일 수동 업로드 완료. 저장소에 파일 존재 확인, SQL 초안은 총 **10,430바이트**, 보안검토 문서는 **1,876바이트**.
- 두 파일 경로 정확히 일치. SQL은 `BEGIN;` 다음 의도적인 `DO ... RAISE EXCEPTION 'WORKMOA_DRAFT_ONLY'` 실행금지 가드 포함, 후보 함수명 `save_my_memo_v2` / `delete_my_memo_v2` / `delete_my_memos_v2` 3종 정확히 포함. 마지막에 **3개 함수 각각 EXECUTE 명시 REVOKE**, 실제 `GRANT EXECUTE` 없음. DB 직원 데이터 파괴성 테이블 DDL 없음(정적 텍스트 검사).
- **중요:** 3종 `SECURITY DEFINER`의 내부 권한 검사, 세션/인사 보조함수, 함수소유자, 권한 상속/RLS, 실제 PostgreSQL 컴파일과 격리 E2E는 미검증이다. 정적 파일 확인은 설치 준비 승인도 완성도 PASS도 아니다. Postgres 함수는 기본 PUBLIC EXECUTE 이슈가 있으므로 출시 전 트랜잭션 단위 명시 REVOKE와 QA 보안시험을 계속 요구함.
- SQL 내용은 Public에 복사하지 않았고 운영 Supabase DDL/DML/RPC 실행·직원 데이터 변경·운영 main 갱신 0. **공식 3-8-53 완료 / 3-8-54 BLOCKED / 제품결함 37종 / 서버 실제 누락 26종 / NOT CLEAN 유지**.

## 2026-10-22 — 메모 RPC 3종 실제 일회용 PostgreSQL 시험 PASS
- 사용자가 PRIVATE 개발 저장소에 `.github/workflows/workmoa-private-memo3-qa.yml`을 직접 등록했고, **[GitHub Actions Run 39690694910](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39690694910) SUCCESS**, job `119535858054` 완료. 실제 컨테이너 PostgreSQL **17.11**에서 원본 SQL 파일의 의도된 실행 차단이 작동함을 먼저 확인, 임시 복사본에서만 가드를 제거한 뒤 SQL 3종을 실제로 컴파일하고 실행. 비공개 SQL 구현 본문·직원 데이터는 이 공개 저장소로 복사하지 않음.
- CI 로그 근거: `DRAFT_HARD_STOP_PASS`, `REAL_POSTGRES_COMPILE_PASS`, `MEMO3_STATIC_FUNCTIONAL_PASS`, `MEMO3_REAL_POSTGRES_CONCURRENCY_PASS`. 저장·수정·개별삭제·선택삭제·다건 atomic·이전 스냅샷 충돌·가짜 두 계정 분리·가짜 읽기전용/만료세션 검사·실 DB 2연결 경합.
- **검수 의미 한정:** 테스트는 가짜 직원·가짜 세션 보조함수 + QA PostgreSQL 소유자 실행이다. **실제 Supabase Auth/RLS/PostgREST/실 운영 보조함수 또는 함수소유자 보안·공개 EXECUTE 실증 아님**, 실제 누락된 26 RPC 가운데 설치 0, 운영 적용 승인 0. 3종 **독립 합성 환경 DB 기능시험 PASS**이지 실서버 복구나 `3-8-54` 완료가 아님.
- 무료 Supabase 개인조직은 활성 2개 제한으로 별도 QA 프로젝트 생성 실패 상태 유지. `eco-i/eco-i.github.io` `main`·운영 Supabase 직원 기록·실제 SQL/배포 변경 0.
- **공식 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 제품결함 37종 / 정확명 RPC 26종 실서버 미설치 / 전체 NOT CLEAN** 유지. 다음 게이트는 QA 전용 인증·권한/RLS·PostgREST 실제 통합 또는 재현 가능한 독립 서버 모형에서 권한공백 재검증; 해당 검증 없이 배포 승인 금지.

## 2026-10-22 — Private 메모 3종 함수 권한검증 사전 설계: UI anon 역할 불일치
- 운영 `main/index.html` 원본 RPC fetch 확인(3346–3348행): 실제 앱 요청은 Supabase public publishable key를 통한 **Postgres `anon` 역할**. 비공개 개발 초안 `DRAFT_MEMO_RPC_3.sql.txt`은 서버 설치가 승인되지 않아 `PUBLIC,anon,authenticated`의 세 함수 EXECUTE를 모두 REVOKE한 상태. **그대로 공개 API 사용 불가(의도된 차단)**. 릴리스 전에는 `anon` 호출을 허용할 때 실제 custom session token/인사권한을 각 RPC 내부에서 증명해야 하고, `SECURITY DEFINER` 소유자와 helper, RLS 우회를 따로 심사해야 함. SQL 공개본 반출 금지.
- Supabase 공식 보안 문서 [Data API 접근통제](https://supabase.com/docs/guides/api/securing-your-api), [anon SECURITY DEFINER 실행 권고](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0028_anon_security_definer_function_executable): `GRANT EXECUTE`는 RLS 및 함수 자체 내부 권한검증과 **별개**. 공개된 함수에 무조건 EXECUTE 부여 금지.
- 일회용 GitHub Actions PostgreSQL 17 서버에서 **anon 최초 EXECUTE 거부→QA 내부 한정 임시 EXECUTE 허용→서로 다른 가상 2직원 토큰별 메모 분리→위조/만료/읽기전용/타인 snapshot 거부→로그아웃 토큰 폐기→재차 REVOKE** 순으로 시험하는 YAML을 사용자용 파일로 준비. 기존 비공개 SQL 원본 SHA-256 고정과 fail-closed 가드 테스트 포함.
- **현재 단계는 YAML·쉘 문법 사전검사만 PASS.** 새 YAML 파일은 아직 private repo 미등록, GitHub Actions **미실행**, Auth/RLS/PostgREST 실증 **0**. 작업환경에 로컬 PostgreSQL 실행 없음. 저장소 본문이나 SQL 보안 설계가 실제 라이브에 설치되었다고 주장하지 않음.
- 공식 **3-8-53 완료 / 3-8-54 BLOCKED / 37종 / 실서버 누락 RPC 26종 / 전체 NOT CLEAN** 유지, 운영 `main`·실 직원 DB·SQL·배포 변경 0.

## 2026-10-22 — Private 메모 역할권한 QA workflow 업로드 형식 오류, 시험 미실행
- 사용자 수동 등록한 Private 경로 `.github/workflows/workmoa-private-memo3-security-qa.yml` 파일을 GitHub에서 확인했으나 **내용이 약 8,216자**로 시작 부분의 `name:`·`on:`·`jobs:`이 누락됨. 테스트 원본은 **15,549바이트**. GitHub Actions Run **39692088942**는 `failure`, **jobs 0**. 즉 YAML 파싱·워크플로 정의 실패이며 **실제 DB 보안시험 미시작**, 제품/권한시험 FAIL로 해석하지 않음.
- 원본 전체 YAML 교체 파일을 준비했고 로컬 YAML 구문과 임베디드 Bash 실행 스크립트의 `bash -n`를 확인. **실제 PostgreSQL 권한시험의 PASS/FAIL은 아직 없음**. 사용자가 private repo `.github/workflows/`에 원본 전체 파일을 다시 업로드 또는 편집 후 GitHub Actions 결과 재확인 필요.
- 검수 본선 `3-8-53` 마지막 완료, `3-8-54` BLOCKED, 신규 제품 결함 37종, 운영 정확명 RPC 26종 미설치, 전체 NOT CLEAN 상태 유지. `main`·운영 DB/SQL 수정 0.

## 2026-10-22 — Private 메모 3종 역할권한 PostgreSQL 시험 PASS
- 사용자가 Private `ahnbest23-hash/workmoa-backend-private`의 `.github/workflows/workmoa-private-memo3-security-qa.yml`을 전체 15,549바이트로 다시 업로드. 기존 8,216자짜리 잘린 파일을 정상 교체함.
- Github Actions **Run 39692505119**, job **119541848574**, **SUCCESS**. 일회용 PostgreSQL 17 컨테이너에서 실제 후보 SQL 3종 컴파일, 실행 차단 확인, 초기 `anon` EXECUTE·원본테이블 SELECT 거부, 제한적 임시 `anon` EXECUTE 허용 시 가짜 앱 토큰으로 두 직원 메모 분리, 위조/만료 토큰·읽기 전용 사용자·타인 snapshot 거부, 로그아웃 토큰 철회/임시 EXECUTE REVOKE 확인. Job 모든 step SUCCESS.
- CI 로그 출력 마커: `PRIVATE_ROLE_QA_DRAFT_COMPILE_PASS`, `PRIVATE_ROLE_QA_INITIAL_ACL_DENY_PASS`, `PRIVATE_ROLE_QA_EXPLICIT_ANON_BOUNDARY_PASS`, `PRIVATE_ROLE_QA_DENIED_REQUESTS_PASS`, `PRIVATE_ROLE_QA_REVOKED_SESSION_AND_GRANTS_PASS`.
- **해석 제한:** 테스트는 합성 employees/app_sessions와 합성 helper 함수, 로컬 PostgreSQL 소유자 권한으로 실행한 가상 접근 시험. 실제 Supabase 인증/RLS/PostgREST·운영 helper·SQL 소유권/권한정책 검증이 **아니므로** 운영 RPC 복구 **0/26** 및 실서버 E2E 미완료 유지. 운영 앱은 `anon` JWT로 RPC를 부르는 구조이므로, 초안에서 권한을 REVOKE하는 것은 출시 전 의도된 기본 차단. 사용자 승인 없이 `anon` 실행권한 부여 금지.
- 이전 오류 Run 39692088942: 불완전한 워크플로 업로드로 Jobs 0개인 **워크플로 파싱 오류**였으며, 정상 전체 재업로드 후 실험 PASS로 해결. 공개 소스 저장소에 Private SQL 본문 복사하지 않음.
- `main` / 운영 Supabase 데이터·SQL·실직원 자료 변경 0. **3-8-53 완료, 3-8-54 BLOCKED, 신규 37결함, 전체 NOT CLEAN** 유지.

## 2026-10-22 — 독립 PostgREST HTTP 메모 RPC 3종 연동 시험 준비
- Private 메모 RPC 후보 3종은 일회용 PostgreSQL 함수/권한 검증까지만 PASS (이전 Runs 39690694910 및 39692505119). 실제 HTTP/PostgREST 요청 경로 검증은 아직 미실행.
- 합성 PostgreSQL 17 + 고정 PostgREST v14.18 이미지로 **실제 HTTP POST /rpc/save_my_memo_v2, delete_my_memo_v2, delete_my_memos_v2** 호출, anonymous SQL 역할 임시 권한, 두 가짜 직원 토큰 분리, 만료/읽기전용/가짜토큰 거부, 이전 상태 CAS, 다건 stale 시 전체 롤백, direct table GET 거부, 토큰 철회 및 최종 EXECUTE REVOKE를 검증할 **새 워크플로** `workmoa-private-memo3-http-qa.yml` 작성.
- 새 YAML/Bash 문법검사 **PASS**, 17,724바이트; **실제 HTTP 시험 아직 수행되지 않음**. 자동 비공개 GitHub 쓰기 제한으로 업로드 및 실제 Actions 실행이 필요. Private SQL 원문 공개 유출 0. QA 로그나 나중의 HTTP PASS도 Supabase API Gateway·Supabase Auth/실제 helper/RLS 통합을 증명하지 않음.
- 운영 main HTML 원본 3346~3348행의 RPC HTTP 헤더는 `apikey: sb_publishable...`와 `Authorization: Bearer sb_publishable...`을 동시에 사용함. 현재 Supabase 공식 문서는 publishable 키가 JWT가 아니며 Authorization Bearer에 넣지 말고 apikey로만 사용하도록 안내한다. **구형 호환 게이트웨이의 실제 동작 확인 전까지 결함으로 확정하거나 운영 앱을 무단 수정하지 말 것.** 실 Supabase Gateway 인증 호환성은 후속 별도 검증.
- **3-8-53 완료, 3-8-54 BLOCKED, 제품결함 37종, 실서버 정확명 RPC 26종 미설치, 전체 NOT CLEAN**. 운영 main·직원 DB·운영 SQL 변경 0.

## 2026-10-22 — Private PostgREST HTTP 시험 실행 실패(준비단계 503), 새 채팅 인계
- 사용자 Private `ahnbest23-hash/workmoa-backend-private`에 `.github/workflows/workmoa-private-memo3-http-qa.yml` **17,724바이트 정상 업로드**.
- Actions **Run 39695127139**, job **119550528350**, **failure**. 임시 PostgreSQL 17 준비와 원본 SQL 가드 확인/임시 DB 복사본 컴파일까지 **SUCCESS**. `PostgREST container HTTP integration and negative authorization tests` step에서 첫 HTTP 요청 `POST /rpc/save_my_memo_v2` **503 PGRST002 — 'Could not query the database for the schema cache. Retrying.'** 발생하며 중단됨. PostgREST 14.18 시작 로그에서 schema cache 연결 재시도. PostgREST 준비대기 조건/DB role 접속권한·schema cache 권한(및 로그) 검토 필요; **메모 함수의 HTTP 비즈니스 로직이 실패했다고 확정하지 않음.**
- Run 링크: https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39695127139 ; GitHub 공개 저장소에 비공개 SQL 내용은 이전처럼 복사하지 않음.
- 전 단계 Private 메모3 PostgreSQL 컴파일·기능 **PASS** Run 39690694910 / 모의 역할 권한 **PASS** Run 39692505119 유지. 이번 HTTP 통합 **NOT VERIFIED**.
- 다음 채팅에서 `.github/workflows/workmoa-private-memo3-http-qa.yml` 검토 → PGRST002 (schema-cache 준비/GRANT/role) 진단 → 전체 YAML 안전 수정본 준비→ 사용자 Private 업로드→재실행 확인. `main` 및 운영 Supabase 데이터·SQL/배포 변경 0. **공식 3-8-53 완료 / 3-8-54 BLOCKED / 신규 결함 37종 / 실서버 RPC 26종 미설치 / NOT CLEAN**.

## 2026-10-22 — PRIVATE 메모 3종 실제 PostgREST HTTP 통합시험 PASS (격리 범위)
- PRIVATE 저장소 `ahnbest23-hash/workmoa-backend-private`의 `.github/workflows/workmoa-private-memo3-http-qa.yml`에서 PostgREST 14.18의 schema cache 준비 전 503 `PGRST002`로 실패했던 Run **39695127139**를 분석. 서버 시작 HTTP 응답만 기다리던 경쟁 상태였으며, 해당 실패 로그상 이후 cache 정상 로딩을 확인함.
- PRIVATE 워크플로 **한 파일만** 수정: `PGRST_ADMIN_SERVER_PORT=3001`, 최초 기동·임시 권한 GRANT 후 재시작 각각 `/ready` 200을 최대 40회 확인(실패 시 즉시 fail closed), 거부 예상 HTTP 요청 7개는 **4xx만 정상적인 거부로 인정**하여 5xx/PGRST002로 거짓 PASS할 위험 차단. PRIVATE 커밋 `9e1cd9837fa55e7cf8fa2c1786d8c3df0cd32cc1`; SQL 초안 원본과 운영 코드 변경 없음.
- [실제 GitHub Actions 재시험 Run 39697435571](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39697435571), job `119558140273`: **SUCCESS** (모든 step 성공). 실행 로그 `PRIVATE_ROLE_QA_DRAFT_COMPILE_PASS`, `HTTP_POSTGREST_SCHEMA_READY`, `MEMO3_REAL_POSTGREST_HTTP_ROLE_TEST_PASS` 확인, 재시험 실행 로그에 PGRST002 없음.
- 성공 범위: **실제 PostgREST HTTP→일회용 PostgreSQL 17.11→개발 중 메모 RPC 후보 3종** 호출, 가상 직원 2명 분리, 위조/만료/읽기전용 토큰 차단, 타인 snapshot 삭제 거부, stale 다건 삭제 원자적 롤백, DB 행 검증, 직접 테이블 GET 거부, 토큰 폐기 및 임시 권한 REVOKE. 이는 독립 합성 세션/인사 helper와 disposable 데이터로 검증한 **제한된 통합시험 PASS**.
- 미검증: 실제 Supabase API Gateway/Auth, 실제 운영 helper 및 RLS/함수 소유자 구조, 전체 브라우저↔원본 앱↔Supabase E2E, 운영 설치 및 미설치 최신 RPC 나머지 23종. **운영 설치·배포 승인 아님**. PRIVATE SQL 원문·비밀정보·실 직원 자료를 공개 저장소로 복사하지 않음.
- **공식 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 신규 제품 결함 37종 / 실서버 동일명 RPC 26종 미설치 / 전체 NOT CLEAN / 운영 main·실직원 DB·운영 SQL·배포 변경 0** 유지.

## 2026-10-22 — PRIVATE 실브라우저 메모 저장 버튼 ↔ PostgREST ↔ 가상 PostgreSQL 제한 E2E PASS
- 비공개 `ahnbest23-hash/workmoa-backend-private`에 `qa/browser_memo_postgrest.py` 추가 (commit `1a0bbd1cc704e7ffae5e8b031224c1a7014b170d`), 기존 `.github/workflows/workmoa-private-memo3-http-qa.yml`의 **PRIVATE QA 시험**만 확장 (commit `26a9ae01d8f1fd09940b121523aa17c5fb62d9fb`). 공개 QA 앱 소스는 `qa-3-8` commit `c02ee881fdadb262b19064659a4243098b32c05b`로 pin된 읽기 전용 checkout; 공개 SQL 유출 없이 원본 HTML을 임시 QA localhost 문서로 변환.
- [GitHub Actions Run 39705241522](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39705241522) / job `119583633860`: 전체 SUCCESS. 먼저 이전 private 원본 SQL 보호가드/진짜 PostgREST HTTP 3종 기존 검증 PASS 후, Chromium 1.56 실제 원본 앱 가상 로그인→메모 상세창→**실제 Save 버튼** 클릭→앱 요청 JSON 변경 없이 loopback HTTP 중계기→**진짜 PostgREST 14.18** `/rpc/save_my_memo_v2`→**진짜 disposable PostgreSQL 17.11의 PRIVATE 후보 SQL 함수** 호출→커밋 행/텍스트 확인→**앱 서버 재조회와 UI 상태 일치** 확인.
- 로그 `PASS PRIVATE_BROWSER_MEMO_POSTGREST` 8개, 마지막 `MEMO3_REAL_BROWSER_BUTTON_TO_POSTGREST_SCOPED_PASS`, 테스트용 anon EXECUTE 임시 GRANT→REVOKE cleanup SUCCESS. 브라우저의 hosted Supabase 접근 차단 PASS. 실제 운영 SQL·직원/지문 데이터·운영 Supabase 접속/배포 없음.
- **검증 범위 중요:** 로그인·계정·인사정보·메모 목록 일부는 QA synthetic fixture 및 브라우저 loopback adapter. 브라우저는 **PostgREST에 직접 요청한 것이 아니라 localhost 합성 중계기를 통해 원본 payload를 전달**했으며, 실 Supabase API Gateway/Auth, 운영 RLS/helper/함수 소유권, 동시 다중 사용자/모바일, 전체 26종 원본 서버 함수 재현·전 E2E는 미검증. SQL 후보 3종을 운영에 설치한 것이 아님.
- 운영 `main`, 직원 DB, Supabase SQL/권한, 실제 배포 변경 0. 공식 **마지막 3-8-53 완료 / 다음 3-8-54 BLOCKED / 신규 제품결함 37종 / 운영 미설치 최신 RPC 26종 / 전체 NOT CLEAN** 그대로 유지. 다음 우선순위는 비공개 후보 SQL의 helper·RLS/소유권 보안 정합성 추가 검증 및 남은 서버 계약의 독립 안전 복구 설계; 실운영 SQL 실행은 별도 명시적 승인 필요.

## 2026-10-22 — PRIVATE 메모 3종 제한된 소유자/RLS/HTTP 보안 게이트 PASS
- 비공개 `ahnbest23-hash/workmoa-backend-private`의 독립 QA 전용 `qa/memo_limited_owner_rls_lab.sql` 및 `qa/memo_limited_owner_http_lab.sh`를 실제 PostgreSQL 17/PostgREST 14.18 Actions에서 실행. 운영 원본 SQL과 운영 DB는 수정하지 않음. 후보 원본 `DRAFT_MEMO_RPC_3.sql.txt`의 실행금지 하드 가드 유지.
- 초기 [Run 39706127492](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39706127492) SUCCESS: 합성 DB 전용 **NOLOGIN/NOBYPASSRLS/NOSUPERUSER** 함수 소유자 지정, function SECURITY DEFINER 및 고정 search_path, 4개 테이블 RLS 활성, 외부 anon/authenticated에 RPC/내부 헬퍼 임의 EXECUTE 없음, 직접 테이블 조회 제한. 명시적 SELECT만 부여된 정책 없는 QA 조회 역할에 0행, anon 원본 테이블/내부 세션 helper 직접 접근 거부 확인.
- 추가 [Run 39706413739](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39706413739), job `119587378648`, 전체 SUCCESS: 전용 **non-BYPASSRLS owner** 상태에서 임시 anon RPC 실행권한만 부여→실제 PostgREST HTTP 메모 저장/DB 커밋 PASS→폐기된 가상 세션 거부→타 가상 직원 메모 삭제 거부→원본 테이블 REST 직접 조회 거부→명시적 EXECUTE REVOKE 확인. 각 `MEMO_RLS_LIMITED_DEFINER_*_PASS` 마커 실제 로그 검증. 기존 가상 로그인/브라우저 저장 재조회·HTTP 3종 전체 단계도 회귀 PASS.
- **실증 경계:** 모든 사용자·세션·인사 함수 및 RLS는 disposable 합성 픽스처. 운영 Supabase API Gateway/Auth/RLS 정책식 및 운영 함수 소유자·보조함수 원본 동등성, 다른 23종 미설치 최신 RPC, 실제 2탭/모바일 및 전체 브라우저 E2E는 **미검증**. 합성 정책의 definer 사용권한 부여는 운영용 보안 설계 승인 아님. QA 3개 RPC 중 실운영 설치 0.
- 비공개 함수 본문, 운영 RLS 내부식, 토큰/직원 데이터는 공개 GitHub에 게시하지 않음. 운영 `main`, 실 직원 DB, 실 Supabase SQL/권한, 운영 배포 **변경 0**. 공식 **3-8-53 완료 / 3-8-54 BLOCKED / 3차 신규 결함 37종 / 운영 미설치 최신 RPC 26종 / 전체 NOT CLEAN** 유지.

## 2026-10-22 — PRIVATE 연차 기준 저장 RPC 1종 신규 QA 후보 검증 (전체 검수 여전히 보류)
- 다음 안전 개발 대상을 `save_my_annual_leave_setting_v2` 1종으로 선정. 공개 운영 `main/index.html` 7177행 호출 계약 `p_token,p_year,p_baseline_remaining_minutes,p_granted_minutes,p_carryover_minutes,p_expected`, Boolean true, 2026 기준 잔여분 / 2027~ 부여·이월분, `{year,baseline,grant,carry,updatedAt}` CAS 스냅샷 대조 후, PRIVATE 에만 `DRAFT_ANNUAL_LEAVE_V2.sql.txt` SQL 후보 초안을 작성. 원본 `WORKMOA_DRAFT_ONLY` 트랜잭션 실행 금지 가드 및 `REVOKE EXECUTE` 유지. 실제 운영 SQL의 재현 정본으로 단정하지 않음.
- [실제 Run 39707687317](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39707687317) **SUCCESS**: 일회용 PostgreSQL 17 + PostgREST 14.18, 원본 실행 차단 → 임시 REVIEW COPY 컴파일, 가짜 2직원 2026/2027 연차 설정 HTTP 생성·수정, 읽기전용/위조/만료 세션 차단, 이전 버전 CAS 거부·DB 불변, 실제 두 PG 연결에서 락을 건 경합 후 stale 요청 거절, 테이블 직접 GET 차단, 최종 anon EXECUTE REVOKE. 로그 `ANNUAL_LEAVE_V2_REAL_POSTGREST_PG_SCOPED_PASS`, 25개 `ANNUAL_V2_PASS` 항목.
- 별도 제한 소유자/RLS 시험 [Run 39708030588](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39708030588)은 가짜 앱 세션/직원 테이블 `FOR SHARE` 행 잠금에 필요한 UPDATE 권한이 테스트 전용 소유자에게 없어 실패. QA 픽스처 권한만 최소 수정하고 최종 [Run 39708158316](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39708158316) **SUCCESS**: 기존 25개 + 제한된 non-BYPASSRLS 전용 함수 소유자 및 가짜 RLS에서 추가 11개 PASS. 실제 HTTP 쓰기, 타직원 snapshot 거부, 만료 세션 차단, 세션 RLS 정책 누락 시 쓰기 거절, 직접 테이블 차단, 임시 EXECUTE 권한 회수. 성공 마커 `ANNUAL_V2_NON_BYPASSRLS_POSTGREST_SECURITY_SCOPED_PASS`.
- 상세 증빙은 **비공개** `ahnbest23-hash/workmoa-backend-private/ANNUAL_LEAVE_V2_REVIEW_GATE_20261022.md`. PRIVATE SQL 코드·권한정책 원문, 직원 기록·세션 값은 공개 저장소에 복사하지 않음.
- **중요 미검증:** 운영 DB 실제 연차 스키마·트리거/감사, 실 Supabase API Gateway/Auth/RLS·함수 소유권·인사 helper, 원본 연차 저장 버튼→서버 E2E와 사후 재조회, 전체 근태/백업 관련 정합. 이는 신규 **1종 격리 개발 후보 PASS**이지 실제 서버 RPC 설치·수리 아님. 현재 격리 시험 후보는 메모 3종 + 연차 1종 = 4종, 나머지 22종은 동일 수준 후보 실증 없음. **운영 함수명 누락 26종은 기존 읽기 전용 실측치 그대로**이며 운영 설치 0건.
- `qa-3-8` 공식 **3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 신규 제품 결함 37종 / 전체 NOT CLEAN** 유지. `main`/운영 Supabase SQL·DB/실직원/지문·실배포 접근·변경 **0**. 동시수정 설계 공백 2종과 P0 5/P1 3 전체 E2E도 계속 BLOCKED.

## 2026-10-22 — 사내일정 최신 RPC 2종 비공개 개발 후보 / 실제 PostgREST HTTP 54항목 PASS
- 메모 3종·연차 1종 이후, 운영 HTML의 사내일정 호출 인자/응답계약 `save_company_event_v4`(main `index.html` 8370행, 양수 ID/기존 ID 확인), `delete_company_event_v4`(8406행, boolean true)을 선별하고 비공개 저장소 `ahnbest23-hash/workmoa-backend-private`에 `DRAFT_COMPANY_EVENTS_V4.sql.txt`, 합성 픽스처/HTTP 시험/워크플로를 작성함. 원문 SQL에는 `WORKMOA_DRAFT_ONLY` 실행금지 트랜잭션 예외와 `REVOKE EXECUTE` 유지. **원본 운영 SQL을 입수·복원하거나 운영 설치한 것이 아닌 신규 QA 개발 후보**.
- **[실제 GitHub Actions Run 39709731514](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39709731514)** / Job `119597933709`: **SUCCESS**, 로그 `EVENTS_V4_ORIGINAL_HARD_STOP_PASS`, `EVENTS_V4_DISPOSABLE_PG_COMPILE_PASS`, `EVENTS_V4_POSTGREST_PG_CAS_RLS_AUDIT_SCOPED_PASS`, **54/54 scoped assertions PASS**, PostgreSQL17/PostgREST14.18 진짜 HTTP /rpc.
- 가상 관리자 2명/일반 직원/읽기전용/만료·위조 토큰으로 등록·수정·삭제 권한, 응답형·ID 일치, 날짜·텍스트 범위 오류 4xx, 오래된 updated_at 거부 및 실제 **두 DB 연결 동시수정 후 CAS 거부**, 감사로그 INSERT와 일정 변경 같은 트랜잭션/감사로그 제약 실패시 전체 롤백, NOLOGIN/NOBYPASSRLS 전용 소유자/RLS·관리자 권한 철회·세션 RLS 정책 제거시 닫힘·원본 테이블 REST 차단, 임시 anon EXECUTE 회수 실증.
- 상세 비공개 보고서: `ahnbest23-hash/workmoa-backend-private/COMPANY_EVENTS_V4_REVIEW_GATE_20261022.md`. **실제 Supabase API Gateway/Auth, 운영 DDL/원본 RLS·helper·감사 구조·브라우저 버튼·2탭/모바일/Realtime 및 전체 E2E는 미검증**. 공개 QA에는 SQL/실직원 데이터/비밀정보 미이동.
- 현재 비공개 격리 QA 통과 개발 후보 **6/26종 = 메모 3 + 연차 1 + 사내일정 2**, 나머지 **20종** 해당 수준 미검증. **실운영 최신 RPC 26종 설치 0개** (과거 읽기 전용 카탈로그 확인 기준). 운영 `main`/Supabase·직원 DB/SQL/지문·배포 변경 **0**. 공식 **3-8-53 완료 / 3-8-54 BLOCKED / 신규 제품결함 37종 / 전체 NOT CLEAN**, 최종 배포는 별도 승인.
