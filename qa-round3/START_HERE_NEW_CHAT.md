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

## 2026-10-22 — 장기재직 기준 저장 RPC 1종 PRIVATE 후보 격리 PostgREST 36항목 PASS
- 다음 후보 `save_my_long_service_profile_v2` 선정. 운영 `main/index.html` 4331행의 `p_token,p_hire_date,p_previous_used_minutes,p_previous_used_band,p_exclusions,p_expected`, `boolean true`, 4202행의 `{profile:{hire,previous,band,updatedAt}|null,exclusions:[{id,start,end,reason}]}` 스냅샷 및 4241행의 제외기간 입력 원본을 근거로 비공개 SQL 후보·가상 DB·HTTP 시험 작성.
- [GitHub Actions Run 39710459450](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39710459450), Job `119600294342` **SUCCESS**. 로그 `LONG_V2_SOURCE_GUARD_PASS`(원본 SQL 의도된 불실행), `LONG_V2_DISPOSABLE_PG_COMPILE_PASS`, `LONG_SERVICE_V2_POSTGREST_PG_CAS_RLS_SCOPED_PASS`, 최종 `FINAL_EXECUTE_REVOKED` 포함 **36개 PASS**. 일회용 PostgreSQL17·실제 PostgREST14.18 HTTP, 가상 직원 2명/만료·위조·읽기전용 세션 거부, 입사일·이전 사용분·제외기간 **두 테이블 원자성**, 일부 실패 전부 롤백, 실 DB 연결 2개의 row lock/CAS stale 충돌 거부, 제한된 non-BYPASSRLS 함수 소유자 및 synthetic RLS, 세션 정책 누락 시 차단, anon 직접 테이블 접근 거부, 임시 EXECUTE REVOKE.
- PRIVATE 원문 `DRAFT_LONG_SERVICE_V2.sql.txt`에는 `WORKMOA_DRAFT_ONLY` 트랜잭션 실행금지 예외가 남아 있고 SQL 본문·실 직원 정보·토큰은 공개 저장소로 이동하지 않음. 상세 비공개 보고서 `ahnbest23-hash/workmoa-backend-private/LONG_SERVICE_V2_REVIEW_GATE_20261022.md`.
- **후속 운영 적합성 BLOCKER:** 후보는 기존 제외기간을 DELETE+INSERT로 교체하므로 **기존 제외기간 행 ID가 바뀌고 연결 테이블·감사이력과의 정합성을 손상시킬 위험**이 있음. 실운영 `long_service_settings`/`long_service_exclusions` 원본 구조, 트리거, FK, 보조함수/Auth/RLS·실 앱 저장 버튼 E2E 등 미확인. 운영 설치/최종 승인 불가.
- 개발 후보 scoped PASS 총 **7/26종**(메모 3 + 연차 1 + 사내일정 2 + 장기재직 1). 나머지 **19종** 동일 수준 미검증. 운영 실제 최신 RPC 설치 **0/26종**(이전 승인된 읽기 전용 카탈로그 기준), `main`/실 직원·근태/지문 DB/운영 Supabase SQL·권한·실제 배포 변경 **0**. 공식 **3-8-53 완료 / 3-8-54 NOT STARTED·BLOCKED / 신규 제품결함 37종 / 전체 NOT CLEAN** 유지.

## 2026-10-22 — 장기재직 제외기간 행 ID 보존 계약 게이트: UNRESOLVED/BLOCKED
- 실제 `main/index.html` 4202행 기존 `p_expected.exclusions`에는 `id`가 있지만, 4234–4245행 `lsCollectValidExclusions`은 새 `p_exclusions`로 `{start_date,end_date,reason}` **3개 필드만 전송**하며 ID를 제외. 4331행 실제 호출 확인.
- **반증:** 기존 행 수정인지 기존 행 삭제 + 새 행 추가인지 두 다른 사용자 의도가 완전히 동일한 `p_expected` 및 `p_exclusions`을 만들 수 있어 서버 단독으로는 변한 행의 안정 ID를 확정할 수 없음. 이전 PRIVATE 후보 `DRAFT_LONG_SERVICE_V2.sql.txt`는 전체 DELETE+INSERT로 기존 ID 변경 가능. 따라서 기존 36항목 scoped PASS와 별개로 **운영 적합성 BLOCKED**. 무단 자동매칭/SQL 운영 설치 금지.
- 비공개 계약 검토 `ahnbest23-hash/workmoa-backend-private/LONG_SERVICE_IDENTITY_AMBIGUITY_GATE_20261022.md`. 후속: 클라이언트 인자에 새 입력의 기존 ID를 명시적으로 전달하도록 정식 계약 개정 승인 및 원본 FK/감사 참조 확인이 우선. 계약 변경 없이 할 경우 모호한 변경은 서버에서 거부해야 함. 실제 DB나 운영 main에는 수정/실행 0.

## 2026-10-22 — 본인 휴일근무 저장/삭제 최신 RPC 2종 비공개 실 HTTP 49항목 PASS
- 운영 `main/index.html` 8527/8566/8726행의 `save_my_holiday_work_personnel_v2` (현재 토큰/날짜/시작·종료/expected ID·수정시각; 양수 ID 반환), `delete_my_holiday_work_personnel_v2` (현재 토큰/날짜/expected ID·수정시각; boolean true)을 이용해 **PRIVATE 신규 후보** `DRAFT_HOLIDAY_SELF_V2.sql.txt`, 가상 직원·공휴일·일근 픽스처와 실제 PostgREST HTTP 시험 작성. 원본 `WORKMOA_DRAFT_ONLY` 설치금지 트랜잭션 예외 및 함수 EXECUTE REVOKE 유지.
- [GitHub Actions Run 39711594722](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39711594722), Job `119603953876` **SUCCESS**. 로그 `HOLIDAY_SELF_V2_HARD_STOP_AND_PG_COMPILE_PASS`, `HOLIDAY_SELF_V2_REAL_HTTP_CAS_RLS_AUDIT_SCOPED_PASS`, `PASS_COUNT=49`; PostgreSQL17/PostgREST14.18 **49 항목 PASS**.
- 실제 가상 DB로 자가 저장·수정·삭제, 주말/평일 지정 공휴일 허용, 근무구분·휴근 등록 사용여부·세션/읽기전용/직원 소유자 범위 확인, 오래된 CAS 및 실제 두 DB 연결 행잠금 뒤 충돌 거부, 감사 실패 시 3종 쓰기 전체 롤백, NOLOGIN/NOBYPASSRLS 함수 소유자/RLS 정책 변경 후 거절, anon 테이블 REST 조회 거절, 임시 EXECUTE 회수 검증.
- 상세 보고서 **비공개** `ahnbest23-hash/workmoa-backend-private/HOLIDAY_SELF_V2_REVIEW_GATE_20261022.md`. **실운영 공휴일/대체·임시공휴일 원본, 인사발령 효력일 및 일근 구분, 휴근 가능 정책, 운영 DB 구조/트리거/Auth/RLS/앱 UI 전체 및 P0/P1 E2E는 미검증**. 관리자 휴근 RPC 2종/휴근 허용 토글 별도 차단. 실제 운영 SQL·직원DB/근태·지문·운영 `main`/배포 변경 0.
- 비공개 독립 개발 후보 **9/26종 scoped PASS** (메모3+연차1+사내일정2+장기재직1+본인휴근2). **나머지 17종 같은 수준 미실증**. 이 중 장기재직 ID 계약 미해결이며 운영 설치 승인과 무관. **운영 실제 RPC 설치 0/26종**(기존 읽기전용 실측), 공식 **3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 결함 37종 / 전체 NOT CLEAN** 계속.

## 2026-10-22 — 관리자 휴일근무 등록/수정·삭제 최신 RPC 2종 비공개 실HTTP 66항목 PASS
- 운영 `main/index.html` 8527·8566·8726행 `admin_save_holiday_work_personnel_v2`(actor 토큰/대상 직원/날짜/시작·종료시각/expected 기록 ID·수정시각, 양수 ID 반환)와 `admin_delete_holiday_work_personnel_v2`(actor 토큰/대상 직원/날짜/expected ID·수정시각, boolean true 반환) 호출 계약 확인. 비공개 신규 후보 `ahnbest23-hash/workmoa-backend-private/DRAFT_HOLIDAY_ADMIN_V2.sql.txt`, 가상 관리자·직원·휴일·편성 픽스처·동시성 HTTP 검증 작성. 원문에는 `WORKMOA_DRAFT_ONLY` 트랜잭션 차단 가드와 `REVOKE EXECUTE` 유지. **운영 원본 SQL 아님·실제 DB 설치 금지**.
- [Run 39717949417](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39717949417) **SUCCESS** 60항목. 추가 두 관리자 경합·권한철회 중 요청 6개 검증을 넣은 [Run 39718135299](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39718135299)는 테스트 후반의 고정 감사 건수 예상값 누락으로 **FAIL**. QA 예상건수만 수정한 최종 **[Run 39718267375](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39718267375), Job `119625506040` SUCCESS**, `HOLIDAY_ADMIN_V2_REAL_HTTP_CAS_RLS_AUDIT_SCOPED_PASS`, **66개 검증항목 PASS**, 원본 SQL 설치방지/임시 컴파일 통과.
- PostgreSQL17+실제 PostgREST14.18, 가상 관리자2/직원·인사·휴일 정보. 관리자만 타 직원 휴근 저장·수정·삭제, 조회전용/일근 미해당/등록비활성/만료·위조세션 거부, 이전 수정시각 CAS, 실제 PG 서로 다른 연결의 row lock→오래된 수정 거부, **권한철회 중 요청 잠금 대기→차단**, **관리자 2명이 같은 직원·날짜 신규 INSERT 시 정확히 1건만 승인 및 1건 감사기록**, 휴근비활성화 이후 기존 기록의 관리자 삭제, 감사 INSERT 실패 시 전부 롤백, non-BYPASSRLS 전용 함수 소유자·가상 RLS fail-closed, anon 직접테이블 조회 차단 및 임시 EXECUTE 최종 회수 모두 실증.
- 자세한 자료는 **비공개** `ahnbest23-hash/workmoa-backend-private/HOLIDAY_ADMIN_V2_REVIEW_GATE_20261022.md`. **운영 Supabase 실제 Auth/Gateway/인사발령·대정비 일정·공휴일/휴근정책·운영 DB DDL/감사·원본 함수 소유자/RLS, 실제 앱 버튼 UI와 P0/P1 E2E 등은 모두 미검증**. 이 가상 편성표 결과는 운영 서버 복구 및 3차 종료 승인 근거로 사용 불가.
- 비공개 **격리 QA 개발 후보 누적 11/26종 PASS**, 나머지 **15종** 동등 검증 미실시. 장기재직 기존 제외기간 ID 안정성 **BLOCKED** 유지. 운영 설치 완료 **0/26종**(이전 읽기 전용 카탈로그 기준). `main`·실제 직원 DB/근태·지문·운영 Supabase SQL/배포 변경 **0**. 공식 **3-8-53 완료 / 3-8-54 NOT STARTED·BLOCKED / 신규 제품 결함 37종 / 전체 NOT CLEAN**, 사용자 별도 운영배포 승인 필요.

## 2026-10-22 — PRIVATE 휴일근무 가능 설정 CAS 계약 검토: 설계 권고·구현 BLOCKED
- 공개 운영 `main/index.html` blob `5553a1d319e3ab7ff4dd6bb8ee7d995657112698` 9466행, QA HTML 9678행 실제 `admin_set_holiday_work_enabled_v2` 호출은 `p_token,p_employee_id,p_enabled` **3인자만** 전달. 읽기 `list_holiday_work_eligibility`는 `employee_id,holiday_work_enabled`만 검증·저장. 이전 revision 부재로 관리자의 오래된 화면 요청을 서버에서 판별할 수 없음.
- **Boolean 이전값만 CAS로 추가하는 것도 ABA(꺼짐→켜짐→꺼짐)를 걸러내지 못함.** 대상 직원별 단조증가 `bigint revision`을 읽기와 쓰기에 묶는 필수 `p_expected_revision` 계약 우선 권고. 기존 최신 v2는 운영 미설치(기존 읽기전용 카탈로그 기준)이므로, 향후 정의할 v2에 4번째 필수 인자를 추가하고 3인자 fallback/기본값/오버로드를 금지하는 안을 검토. 읽기 반환형 변경이 어려우면 버전된 읽기 RPC 제안.
- 실제 앱은 2관리자 동시변경·휴근 저장 대 토글의 **동일 직원 범위 직렬화 잠금**, 권한 최신성, 감사 원자성, 충돌 후 재조회 UI가 확인되어야 함. 현재 PRIVATE `employee_day_assignments`는 합성 날짜별 모델이라 실제 운영 설정 테이블로 간주 불가. 운영 원본 저장스키마·현재 읽기/옛 변경 함수·RLS/GRANT·Auth helper 확인 전 **SQL 후보 구현 보류**.
- PostgREST 14에서 stale 충돌에 사용자 정의 SQLSTATE `40001` 사용 시 재시도 문제 위험이 있어 **`PT409` 검토**: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b . 신규 SQL/실제 DB 실험은 이번 단계에서 진행하지 않았으므로 추가 PASS를 주장하지 않음.
- 상세 검토는 비공개 `ahnbest23-hash/workmoa-backend-private/HOLIDAY_ENABLED_CAS_CONTRACT_GATE_20261022.md` (SQL·인증정보 공개 이동 없음). **계약 정적 검토 완료, 실제 구현/격리시험 미완료**, 비공개 격리 개발 후보 **11/26** 그대로. 운영 `main`·실직원 DB/지문·실 Supabase·배포 변경 0. 공식 **3-8-53 완료 / 3-8-54 미시작·BLOCKED / 신규 결함 37종 / 전체 NOT CLEAN** 유지.

## 2026-10-22 — PRIVATE 휴일근무 설정 4인자 CAS 43항목 격리 PASS (운영은 NOT CLEAN)
- **운영 read-only 증빙 범위:** 승인된 읽기 전용 `pg_catalog`/정보스키마·함수 정의만 확인했고 직원·근태·지문·토큰 등 실제 행은 조회하지 않음. 실 설정 테이블 `holiday_work_eligibility`은 employee_id/boolean enabled/updated_at만 있고 **revision 없음**. 기존 `list_holiday_work_eligibility`은 직원/Boolean 2열 반환. 기존 `admin_set_holiday_work_enabled`(3인자)은 CAS·공통 직원 잠금 없이 upsert 및 감사기록 처리. 기존 휴근 저장·eligibility 검사 경로에도 설정변경과 공통인 직렬화 잠금 확인 불가. SQL·RLS 원문·운영 인증정보는 공개 보관 금지.
- **비공개 신규 후보** `DRAFT_HOLIDAY_ENABLED_CAS_V2.sql.txt`: 원본에 `WORKMOA_DRAFT_ONLY` 설치 차단 트랜잭션 유지, 임시 disposable REVIEW COPY만 실제 PostgreSQL 17 / PostgREST 14.18에서 실행. `eligibility_revision bigint`, 새 revision 포함 `list_holiday_work_eligibility_v2`, **필수 4인자** `admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled,p_expected_revision)`로 ABA/두 관리자 경합·stale HTTP 409·감사 롤백을 검증. **운영 SQL 아니며 운영에 설치 금지.**
- [PRIVATE GitHub Actions Run 39723552930](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39723552930) job **119642260865 SUCCESS**, `HOLIDAY_ENABLED_CAS_V2_REAL_HTTP_CAS_RLS_AUDIT_SCOPED_PASS`, **43/43 assertions PASS**. 관리자 권한철회 중 pending HTTP 거부, 실제 두 관리자 동시 요청 단 1건 성공, ABA/revision 409, 감사 실패 rollback, 제한 owner/RLS, anon 직접테이블 접근 거부, 최종 EXECUTE 회수 포함.
- **중요 차단:** 앱 현재 3인자·기존 읽기 2열과 4인자+revision 새 서버 계약 불일치. 기존 구버전 setter가 계속 동작하면 CAS 우회 가능. 독립된 본인/관리자 휴근 4종 후보는 **합성 날짜별 편성행을 잠금**하는 별도 모델이므로 실제 직원별 eligibility 변경과 공통 잠금/트리거 교차경합 아직 실증하지 않음. 실 Supabase Auth/RLS·효력일별 인사·관리자 2차 인증·실앱 버튼 E2E 미검증. 따라서 이번 43 PASS를 통합 PASS/운영적합 PASS로 주장하지 않음.
- 상세 내부 설계·증빙은 비공개 `ahnbest23-hash/workmoa-backend-private/HOLIDAY_ENABLED_CAS_V2_SCOPED_GATE_20261022.md`. PRIVATE 격리검증 개발 후보 누적 **12/26종**, 나머지 **14종** 미검증. 운영 누락 RPC 설치 **0/26종**(기존 read-only 실측), `main`/운영 직원 DB·지문·SQL/권한·배포 변경 **0**. 공식 **3-8-53 마지막 완료 / 3-8-54 NOT STARTED·BLOCKED / 결함 37종 / 전체 NOT CLEAN** 유지.
- 다음 우선순위는 **휴일근무 저장 v2(본인/관리자)와 설정 토글의 동일 직원 직렬화 잠금 계약 설계 및 교차경합 격리검수**. 운영 DB 변경과 `main` 배포는 별도 최종 승인.

## 2026-10-22 — PRIVATE 휴일근무 허용 토글↔저장 교차경합 46/46 PASS (실제 운영·브라우저 E2E는 계속 BLOCKED)
- **실제 가상 SQL 계약 불일치 재현:** 기존 비공개 본인/관리자 휴근 저장 후보는 날짜별 합성 `employee_day_assignments.holiday_work_enabled`만 확인, 신규 토글 후보는 직원별 전역 `holiday_work_eligibility.enabled` 갱신. 일회용 PostgreSQL17/PostgREST14.18에서 토글 **OFF 후에도 기존 본인·관리자 후보 신규 저장 각각 커밋됨**, 12/12 기초 재현 PASS. **이것은 비공개 개발 후보 간 결함**, 실운영 저장이 OFF에서 가능하다는 증거 아님(실운영 이전 서버 함수는 글로벌 값도 조회).
- **PRIVATE 통합 격리 성공:** [Run 39730165904](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39730165904), Job `119663131467` 전체 SUCCESS, `CROSS_HOLIDAY_SHARED_EMPLOYEE_LOCK_HTTP_PG_SCOPED_PASS`, **개선 46/46 PASS**. 기존 SQL 3파일은 SHA pin·원문 실행금지 하드 가드 그대로. 임시 QA 복사본의 저장 기능에 전역 허용값 검사를 추가, 대상 직원 `employees` 행의 `FOR SHARE`(저장) ↔ `FOR UPDATE`(토글) 공유 잠금으로 두 실제 HTTP 요청의 순서를 검증.
- 양쪽 **저장→비활성화** 때 기존 저장행 보존·비활성화 후 삭제, **비활성화→저장** 때 뒤따른 본인/관리자 저장 4xx 거부·저장 0. 감사 INSERT 실패 시 두 저장 전체 롤백, 제한 소유자/RLS와 임시 6개 RPC EXECUTE 회수도 실증. 기존 후보/원본 SQL을 직접 수정하지 않은 disposable 실험.
- 실패 이력 투명 기록: 최초 [Run 39729830811](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39729830811) 임시 권한 재GRANT 누락으로 FAIL, [39729974807](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39729974807)은 다음 커밋에 의해 CANCEL, [39729979435](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39729979435)은 마지막 감사 실패 HTTP 4xx 코드 예상 오류로 FAIL, **최종 39730165904만 전체 PASS**. 어떤 실패도 운영 제품 결함으로 허위 판정하지 않음.
- **통합 검증 경계:** 운영 앱은 여전히 2열 읽기/3인자 토글 계약이고 운영 `v1` 쓰기·기존 트리거/인사발령/Auth/RLS/월확정·P0/P1 브라우저 E2E를 새 공통 잠금 방식으로 검증한 게 아님. 새 실운영 정책·버전 이행 없이 설치·배포 금지. 비공개 상세: `ahnbest23-hash/workmoa-backend-private/HOLIDAY_CROSS_RPC_SHARED_LOCK_GATE_20261022.md`. 원문 SQL·인증정보 공개 저장 0.
- **누적 기능별 격리 PASS 후보 12/26종 그대로**(새 RPC 함수 0종); 나머지 14종 미실증. 운영 누락 최신 RPC 설치 0/26종(기존 읽기전용 실측), `main`·실직원 DB/지문·운영 SQL/권한·배포 변경 0. 공식 **3-8-53 완료 / 3-8-54 NOT STARTED·BLOCKED / 3차 신규 결함 37종 / 전체 NOT CLEAN**.
- 다음 우선순위: **QA 앱 읽기 버전+4인자 CAS UI 수정 계약 및 충돌 안내→재조회 흐름을 공개 `qa-3-8`에서만 설계/검증**, 독립 synthetic 브라우저→PostgREST→DB 통합 후 운영 배포 별도 승인.

## 2026-10-22 — 운영 ver20261018-2313 개인 메모 저장 후 닫기 경고 진단 / QA 보강 (운영 서버 RPC 복구·배포 아직 없음)
- **사용자 실증 보고:** 메모 작성→저장→닫기 시 `저장하지 않은 내용이 있습니다. 닫을까요?` 재발, 과거 초과근무 저장 수정 사례와 유사. 실제 메모 저장 성공 여부 확인되지 않아 경고를 임의로 없애면 안 됨.
- **근본 원인 확정 (read-only 카탈로그):** `main`/QA `version.json = ver20261018-2313`. 앱은 `save_my_memo_v2(p_token,p_date,p_text,p_expected)` 호출, 운영 `pg_proc`에는 `save_my_memo`·`list_my_memos`만 있고 **`save_my_memo_v2` 없음**. 실제 직원·메모·토큰/지문 테이블 행 조회 0, 운영 DB 쓰기/DDL 0. 현재 운영 사이트에서 해당 저장 함수 호출은 성공할 수 없으며 프런트의 미저장 경고는 데이터 보호 동작.
- **운영본 추가 오류:** `main`은 메모 저장 `catch` 메시지를 `finally`의 정상권한 UI 동기화가 지우는 경로 있음. QA에는 이전 깊이8 블록에서 메시지 보존 보강이 이미 반영됨. 구버전 `save_my_memo` 자동 fallback은 최신 `p_expected` CAS 우회이므로 금지.
- **QA 안전 보강:** 공개 검수 브랜치 `qa-3-8/index.html`의 메모 저장 실패 `catch`에 `isMissingRpcEndpointError` 전용 안내(서버 기능 없어 **실제 미저장**·초안 보존) 및 오류 toast 추가, 커밋 [`ffd5bac9`](https://github.com/eco-i/eco-i.github.io/commit/ffd5bac9214bccd7a2e369366548c2124c678ab5). 운영 `main` 불변.
- [QA Node 합성 DOM/RPC Run 39731183694](https://github.com/eco-i/eco-i.github.io/actions/runs/39731183694) **3/3 PASS** (PGRST202→초안/dirty 보호, 일반 실패 보존, 실제 성공+authoritative 재조회 시 baseline 일치). [QA 실제 Chromium 버튼+격리 PG Run 39731183588](https://github.com/eco-i/eco-i.github.io/actions/runs/39731183588) **SUCCESS** (합성 PostgREST 404→실화면 오류·입력 보존·DB 신규행 0·운영 연결 0). 이는 운영 PostgREST/Auth 실데이터 검증 아님.
- [실서버 계약 snapshot Run 39731183593](https://github.com/eco-i/eco-i.github.io/actions/runs/39731183593)는 26개 RPC 미해결/31개 호출 지점에 대해 **의도한 FAIL CLOSED**; 새 UI 테스트 PASS와 구분한다. 세부 보고서 `qa-round3/MEMO_SAVE_CLOSE_WARNING_TRIAGE_20261022.md`.
- **배포 계속 차단:** 운영 메모 v2 함수 실질 복구는 별도 비공개 서버/보안·CAS 검토 및 **명시적 운영 적용 승인** 필요. QA 화면 안내 패치만으로 운영 저장 성공 X. 공식 누적 제품 결함 **37종 유지(기존 RPC 누락과 중복 미가산)**, 블록 **3-8-53 완료/3-8-54 NOT STARTED·BLOCKED/전체 NOT CLEAN**, RPC 격리개발 후보 **12/26종**·운영 설치 0/26종(이전 검증 범위), 직원 DB·지문·운영 `main` 무변경.

## 2026-10-22 — 개인 메모 3종 실제 트리거·세션 핵심계약 합성 추가검수 38/38 (운영 함수 누락은 아직 BLOCKED)
- 운영 Supabase의 **read-only 함수 정의/트리거/FK/RLS 메타데이터만** 대조하고, 실제 직원 메모·세션·지문 데이터 행 조회 및 운영 DDL/RPC/권한 쓰기 0.
- 정본 서버에서 세션 직원 컨텍스트를 설정하는 경로와 이를 검사하는 `personal_memos` 쓰기 트리거가 존재함을 확인. 메모 D-day와 메모 행은 FK `ON DELETE CASCADE` 연결. 예전 개인 메모 쓰기 함수는 여전히 유효한 EXECUTE 권한을 갖고 있으며 CAS를 수행하지 않는 경로임. 신규 v2와 병용하면 CAS 우회 우려가 있어 운영 이행 설계 필수.
- 비공개 새 검수 [Run 39732563709](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39732563709) Job 119670716035 전체 SUCCESS, `MEMO_LIVE_GUC_TRIGGER_AND_FK_SCOPED_PASS` **38/38 PASS**: 기존 SQL 초안 그대로 실행 차단, 임시 독립 PostgreSQL17/PostgREST14.18 복사본에 세션 컨텍스트·쓰기 트리거·D-day FK의 관찰된 핵심계약을 **합성 모델**로 적용해 생성/수정/동시성/CAS/타인 접근 거부/읽기전용 세션/단건·다건 삭제·D-day 연동/원자 롤백/RLS 및 HTTP 임시권한 회수 확인.
- 이는 실제 운영 Auth/PIN·인사 효력일 상세·실제 트리거/권한 전문 또는 운영 메모 저장 성공 검증이 아님. 운영 사이트 `ver20261018-2313`에 필요한 `save_my_memo_v2`·`delete_my_memo_v2`·`delete_my_memos_v2` **여전히 누락**, 임의로 구버전 함수에 폴백하지 않음. 사용자에게는 미저장 경고를 없애지 말고 작성글 보존 안내.
- 비공개 보고서 `ahnbest23-hash/workmoa-backend-private/MEMO_GUARD_INTEGRATION_QA_20261022.md`. 공식 기능별 합성 PASS **12/26종 그대로**, 운영 실제 설치 **0/26종**, 결함 집계 **37종 유지**, **3-8-53 완료 / 3-8-54 NOT STARTED·BLOCKED / 전체 NOT CLEAN**. `main`·운영 직원DB·지문·SQL/GRANT·배포 변경 0.
- 후속은 기존 v1 쓰기 호출권한·구형 웹 캐시의 안전한 전환 계약 및 QA 브라우저→실 QA PostgREST→합성 DB 메모 저장 후 닫기 성공 경로 검증. 운영 설치/배포는 별도 명시 승인 필요.

## 2026-10-22 — 실제 QA 메모 저장·닫기·재열기 PostgREST/PG17 24/24 PASS (배포는 아직 BLOCKED)
- **최종 검수 증빙**: 비공개 [GitHub Actions Run 39740400842](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39740400842), job 119695963253 **SUCCESS**. 원본 `qa-3-8` 웹사이트를 로컬 전용으로 실행하고 실제 Chromium UI의 「저장」·「닫기」 클릭, 가상 로그인/인사만 로컬 브리지로 모방. **실제 메모 RPC** `save_my_memo_v2`·`list_my_memos`는 진짜 PostgREST14.18 HTTP→독립 PostgreSQL17(합성 메모/계정)으로 연동. 총 **24/24 PASS**.
- 주요 양성 경로: 메모 입력→실제 버튼 저장 HTTP200→실 PG INSERT 기록→화면 서버 재조회 일치→dirty·「수정 중」 해제→실제 하단 「닫기」 클릭 시 **미저장 경고 없음**→동일 날짜 다시 열어 기록 확인. CAS 수정 후 재시도해도 PG UPDATE, 경고 없음, 재열기 문자열 일치.
- 음성 경로: 저장된 메모의 수정 중 브리지에서 **합성 PGRST202/404** 발생시켜 실제 DB UPDATE 0 확인, 화면 오류·초안·dirty 유지, 「닫기」에서 **미저장 경고가 정상 등장**하여 취소 시 보존. 복구 후 저장 성공하면 경고 해제. 가상 404는 실제 PostgREST의 오류가 아닌 격리 시뮬레이션.
- 기존 SQL 초안 원문 실행금지 `WORKMOA_DRAFT_ONLY` 검증 유지. 비공개 신규 test 파일: `qa/memo_browser_roundtrip_overlay.sql`, `qa/memo_browser_postgrest_roundtrip.py`, `.github/workflows/workmoa-private-memo-browser-roundtrip-qa.yml`. 상세 보고서 `ahnbest23-hash/workmoa-backend-private/MEMO_BROWSER_REAL_POSTGREST_ROUNDTRIP_GATE_20261022.md`.
- 실패 이력 허위 은폐 금지: [Run 39739449714](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39739449714) 구 QA 도우미 테스트 DB 로그인 설정 불일치 FAIL, [Run 39739850207](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39739850207) 최신 변경으로 CANCELLED, [Run 39739857728](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39739857728) 실제 SQL 저장은 PASS했으나 UI 「닫기」 중복 선택자 때문에 FAIL. 최종 Run 39740400842만 전체 PASS.
- **운영 문제 여전**: `ver20261018-2313` 운영 앱이 호출하는 `save_my_memo_v2` 등 메모 v2 RPC 서버 미설치, 이 격리 PASS로 운영 메모 저장 문제는 해결되지 않음. 구 `save_my_memo` 비CAS 경로 권한 유지, 이행 시 이전 버전 브라우저·캐시/탭 경합 보호 계획 필요. 가상 로그인/Auth/인사/RLS와 실제 운영은 동일하다고 볼 수 없음. 운영 사용자 데이터·지문·메모 실제 행 및 운영 `main`/SQL/GRANT/배포 변경 **0**.
- 공식 상태 절대 승격 금지: 기능별 격리 RPC 후보 **12/26** (기존 3종 묶음 추가 검증이므로 +0), 운영 설치 **0/26**, 누적 신규 제품 결함 **37종**, 마지막 **3-8-53 완료**, 다음 **3-8-54 미시작·BLOCKED**, 전체 **NOT CLEAN**. 후속은 실 운영 Auth/RLS/기존 RPC와의 안전한 버전 이행 심사 및 운영 적용 **별도 사용자 승인**.

## 2026-10-22 — QA 휴일근무 가능 CAS 클라이언트 연결 9/9·Chromium 3종 PASS / 3-8-54 여전히 BLOCKED
- 사용자 본인 실사용에서 **메모 저장 정상 동작 확인**. 2026-10-22 승인으로 운영 Supabase **메모 v2 RPC 3종 복구 완료**, 운영 누락 RPC **26→23종**으로 감소. QA-only 보고서는 `qa-round3/PRODUCTION_MEMO_V2_RELEASE_20261022.md`, 비공개 운영 기록 `MEMO_V2_AUTHORIZED_PRODUCTION_RELEASE_20261022.md`. 이전 0/26 운영 설치 표시는 과거 스냅샷으로 현재 수치 아님.
- 다시 이어간 **3차 깊이8 종합검수의 다음 사전 작업**: 공개 `qa-3-8/index.html`의 휴일근무 가능 설정 조회를 `list_holiday_work_eligibility_v2`로 바꾸고 직원별 `eligibility_revision` 필수 검사·보관, 관리자 쓰기를 `admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled,p_expected_revision)` 필수 4인자로 바꿈. stale `STALE_HOLIDAY_ELIGIBILITY` 충돌 시 자동 덮어쓰기/재시도 금지, 최신 값 재조회 후 재선택 안내; 재조회 실패·버전 누락은 쓰기 잠금. **QA 브랜치만 수정**, 운영 `main`·실제 DB 변경 없음.
- [QA VM 런타임 Run 39744288968](https://github.com/eco-i/eco-i.github.io/actions/runs/39744288968) **9/9 PASS**: 숫자 revision 검증·누락/중복·invalid skip·4인자·충돌 재조회·조회실패 fail-closed·오프라인. [frozen-main 정적 RPC gate Run 39744367713](https://github.com/eco-i/eco-i.github.io/actions/runs/39744367713) **PASS**, QA의 정확한 `p_expected_revision` 추가 1건만 허용. 초기에 두 synthetic 테스트가 old payload 가정/VM todayKey stub 누락으로 FAIL했으나 현재 수정·재실행 PASS.
- **기존 Chromium 3개 회귀 모두 PASS**: 휴일근무/초과근무 404 및 stale [39744390017](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390017), 근태 등록+독립 PostgreSQL [39744390068](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390068), 메모 누락 RPC 404 초안 보존 [39744390034](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390034). 가상 로그인·RPC 기준이며 실제 서버 CAS 토글 버튼 성공 E2E 아님.
- 상세 기록 `qa-round3/HOLIDAY_ELIGIBILITY_CAS_CLIENT_QA_20261022.md`. 신규 파일 `qa-round3/tests/holiday-eligibility-revision-cas.test.cjs`, workflow `.github/workflows/qa-holiday-eligibility-revision-cas.yml`. 가상 Chromium 브리지에 `list_holiday_work_eligibility_v2` 응답 추가; 운영 배포 0.
- 휴일근무 신규 `list_holiday_work_eligibility_v2`, 4인자 `admin_set_holiday_work_enabled_v2` **운영에 아직 미설치**. 이전 PRIVATE 격리 SQL/교차잠금 43/43·46/46 PASS만으로 실서버 적용 금지. 다음 목표는 실제 QA 앱 관리자 버튼→가상 세션→진짜 PostgREST14+PG17 CAS 성공/409/재조회 통합, 직원별 공통 잠금/인사효력일/실 운영 Auth/RLS 차이 검토. 유료 QA 프로젝트 생성·운영 SQL/GRANT/직원DB 쓰기는 별도 승인 없이는 금지.
- 공식 **마지막 완료 3-8-53 / 3-8-54 미시작·BLOCKED / 누적 신규 결함 37종 / 전체 NOT CLEAN**. 이번 scoped 작업을 3-8-54 완료로 승격하지 말 것.

## 2026-10-22 — 휴근 CAS 실제 Chromium→PostgREST14→PG17 20/20 PASS
- 사용자 도움으로 비공개 저장소 `qa/holiday_enabled_browser_postgrest_e2e.py`, `.github/workflows/workmoa-private-holiday-browser-postgrest-qa.yml` 업로드 완료; 앞서 PRIVATE `qa/holiday_enabled_browser_overlay.sql`도 준비되어 있었음.
- 최종 PRIVATE [Actions Run 39750269978](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39750269978), Job 119728797712 **SUCCESS**. 실제 `qa-3-8` HTML 관리자 체크박스를 Chromium으로 클릭해 **진짜 PostgREST14.18 HTTP→일회용 PG17 RLS/SQL** 검사, `HOLIDAY_ENABLED_REAL_BROWSER_REAL_POSTGREST_SCOPED_PASS`, **20/20 PASS**.
- 관리자 A 최초 OFF→HTTP200 revision1/감사1, 가상 관리자 B 별도 HTTP ON→revision2/감사2, A의 오래된 ON→**HTTP409** 및 DB/감사 변경0·화면 최신값 재조회·충돌 알림, A 최신 revision2 OFF→HTTP200 revision3/감사3. expected 0/1/2 순서, 구 3인자 차단, 외부 Supabase 접속0, JS오류0.
- 초기 Run 39749906504는 Docker health-cmd YAML 인용 문제, 39750075175는 Playwright uncheck()의 앱 확인 중 일시적인 체크복귀 오판. **시험 구성 자체만 수정**, 최종 PASS. SQL 원본 WORKMOA_DRAFT_ONLY 실행차단 유지; 실 운영 서버/실 직원·근태·지문/운영 `main` 불변.
- QA 보고서 `qa-round3/HOLIDAY_ELIGIBILITY_CAS_CLIENT_QA_20261022.md`에 후속 20/20 증빙 추가. **실 운영 Auth/RLS/PIN/인사원본·전 기능 E2E 또는 새 서버 RPC 실배포를 의미하지 않음**. 메모 3종 별도 복구 후 운영 누락 **23종**, 누적 결함 **37종**. **공식 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 전체 NOT CLEAN** 그대로. 다음은 P0/P1 잔여 서버 RPC 계약·운영 보안 적합성 및 독립 전체 QA 기반 확인, 사용자 승인 없는 운영 변경 금지.

## 2026-10-22 — 인사발령 취소 CAS 클라이언트 사전검증 19/19 PASS (3-8-54 공식 보류)
- [검증 보고서](PERSONNEL_CANCEL_CAS_CLIENT_QA_20261022.md), [QA Actions Run 39752387949](https://github.com/eco-i/eco-i.github.io/actions/runs/39752387949) **19/19 source-level PASS**. 운영 main의 `admin_cancel_personnel_batch_v2(p_token,p_batch_id)`가 최신 재조회 후 최종 취소까지 변경 버전을 전달하지 않는 P0 계약 공백을 QA 브랜치에서 보강.
- QA 전용: `list_personnel_assignments` 반환의 발령별 `batch_revision`을 optional parse/형식·행 일치 검증, snapshot 포함, 온라인 취소 시 안전한 revision 없으면 **취소 차단**, 있으면 `p_expected_revision` 필수 전달. 서버의 stale 오류는 최신 인사 확인 안내. frozen main 26종/31곳 정적 호출 게이트는 QA 한정 휴근 토글+발령 취소 두 CAS 인자 추가만 허용하며 [Run 39752081840](https://github.com/eco-i/eco-i.github.io/actions/runs/39752081840) PASS.
- 비공개 서버 수용조건: `ahnbest23-hash/workmoa-backend-private/PERSONNEL_CANCEL_REVISION_CONTRACT_GATE_20261022.md`. **실제 서버 revision 제공/취소 SQL CAS·PostgREST 2관리자 충돌 E2E 미실행**; 온라인 QA 취소가 필드 누락으로 차단되는 것은 의도된 안전 상태. 운영 적용 금지.
- **공식 상태 그대로:** 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 결함 37종 / 운영 누락 23종 / 전체 NOT CLEAN. 운영 main·실직원 데이터·운영 SQL/배포 변경 없음.

## 2026-10-22 — PRIVATE 인사발령 취소 두 관리자 실제 HTTP CAS 83/83 PASS (전체 NOT CLEAN)
- [공개 비민감 scoped 보고서](PERSONNEL_CANCEL_REAL_POSTGREST_QA_20261022.md) / [PRIVATE 실제 GitHub Actions Run 39755797680](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39755797680), Job `119747359468` **SUCCESS**, `PASS_COUNT=83`. 일회용 PostgreSQL17.11/PostgREST14.18 + 가상 두 관리자/직원으로 `admin_cancel_personnel_batch_v2` **3인자 expected revision CAS** 동시 취소·편집 대 취소 HTTP **200/409**, stale/ABA, 권한 철회, 감사/snapshot 실패 rollback, RLS/EXECUTE 최소권한 실증.
- PRIVATE SQL 후보 원문은 `WORKMOA_DRAFT_ONLY_PERSONNEL_CANCEL`로 설치방지, 검증 시 임시 REVIEW COPY만 합성 PostgreSQL에 적용. 기존 앱 QA revision 19/19 소스검수와 별개로 **실제 앱의 취소 UI→서버 DB E2E, Supabase Auth/PIN 및 기존 운영 스키마·레거시 writer/복원 경합은 미검증**. 1차 Run 39755702352는 테스트 `PUBLIC` 역할 ACL 확인 방식 오류로 실패했고 수정한 최종 RUN에서 전체 PASS.
- 누적 PRIVATE 개별 RPC synthetic scoped 후보 **13/26종**(이전 12+인사취소1). 사용자 승인 운영 메모3 복구 이후 운영 RPC **미설치 23종** 그대로, 이 중 synthetic scoped 후보 10종/미검증 13종. 운영 신규 설치/수정 0.
- **공식 3-8-53 완료, 3-8-54 미시작·BLOCKED, 신규 37종, 전체 NOT CLEAN** 유지. `main`/실직원 DB·운영 SQL/지문/배포 접근·변경 없음. 비공개 상세 `PERSONNEL_CANCEL_TWO_ADMIN_POSTGREST_CAS_GATE_20261022.md`.

## 2026-10-22 — 긴급 기존기능 복구: 사내일정 v4 **운영 승인 설치 성공**
- 사용자 사진: 2026-10-30 전문강사 청렴교육 등록이 `사내일정 동시수정 보호 SQL이 아직 적용되지 않았거나 서버 스키마 갱신 중`으로 실패. 운영 사이트가 `save_company_event_v4/delete_company_event_v4`를 호출하지만 운영 서버에 두 RPC가 없던 **운영 계약 불일치 확인**. 검수 중 잘되던 기능을 막은 장애로, **3-8-54보다 운영 기능 복구 우선**.
- 기존 비공개 합성 SQL은 실제 `company_events.event_date`와 `audit_logs.action_type` 컬럼에 안 맞아서 사용하지 않음. 운영형 신규 SQL 후보를 원문 실행차단 상태로 작성·실제 PG17/PostgREST14에서 [Run 39761409847](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39761409847) **48/48 scoped PASS**. 운영 실제 적용 사용자 별도 승인 확인.
- **SongdoFood** migration `20261022101444_workmoa_company_events_v4_cas_restore_20261022` 성공. v4 save/delete 총 2종 설치, v3 옛 브라우저 write 권한 철회, v4 실행권한/owner/search_path 검증. 운영 `main` index 수정 0, 실 직원/기존 일정 행 수정 0. 운영 사내일정 **5→5**, 감사 **127→127**, 최신 일정 수정시각 동일. 실제 사용자 관리자 세션 저장은 아직 사용자 확인 전.
- [공개 복구 검증 보고서](PRODUCTION_COMPANY_EVENTS_V4_RESTORE_20261022.md) / 비공개 운영 증적 `COMPANY_EVENTS_V4_AUTHORIZED_PRODUCTION_RESTORE_20261022.md`.
- 원래 누락 26종 중 승인 복구 메모3 + 이번 사내일정2 = **설치5, 현재 미설치21**. 과거 누락 26·31 callsite frozen 스냅샷 수정 금지. 지문·초과근무 v2 함수 존재는 확인했지만 UI실행 장애는 **별도 미해결**. 공식 블록 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 결함 37 / 전체 NOT CLEAN 변동 없음.

## 2026-10-22 — 운영 장애 복구 우선: 초과근무/지문 운영 SQL 원문 격리 재현
- [검증·장애범위 상세](RECOVERY_FINGERPRINT_OVERTIME_OPERATIONAL_SQL_20261022.md).
- **초과근무** 현 운영 SQL 5개 실제 정의를 private snapshot으로 read-only 복사 + 하드스톱, 가상 PostgreSQL17/PostgREST14.18 재생 [Run 39771123060](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771123060) **40/40 PASS**(등록/수정/완료/삭제/동시경합/감사롤백). **지문** 현 운영 SQL 5개 동일 방식 실재생 [Run 39771691566](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771691566) **37/37 PASS**(사진 저장→메타조회→사진 회수·교체·삭제, 최초 업로드 경합/세션/PIN/STALE). *가짜 토큰·가짜 직원·사진 바이트만 사용, 운영 행 조회/수정 0*.
- 운영 site `main` 실제 Android picker/화면·중간 Realtime·세션·인사 freshness 장애는 **미재현/미해결**. 따라서 지문·초과근무 **실서비스 복구 완료 선언 금지**. 다음 작업은 QA browser picker return/loadFingerprintRecords 및 saveOvertimeDay/entry_v2 UI 실동작 vs synthetic live SQL 연결.
- `qa-3-8/index.html`에 **지문 기록 조회 실패 시 안전한 원인 범주 표시** (PGRST202, 응답형식, 세션, timeout, 권한, 일반 오류; 생데이터/토큰 미노출) QA 전용 진단 추가; [QA Run 39772397452](https://github.com/eco-i/eco-i.github.io/actions/runs/39772397452) **9/9 PASS**. 이는 장애 자체 수정/운영 배포가 아님.
- 나머지 운영 누락 RPC 21종, 공식 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 결함 37 / NOT CLEAN. 운영 main·실 직원 기록/DB/DDL/배포 변화 없음. 사용자 불편 해소가 검수 진도보다 우선.

## 2026-10-22 — 기존 장애 우선: 진짜 Chromium 화면 사진 선택·초과근무 수정 → 가상 PostgreSQL 18/18 PASS
- [공개 QA 브라우저 검수보고서](FINGERPRINT_OVERTIME_REAL_BROWSER_DB_QA_20261022.md); GitHub [성공 Run 39774368252](https://github.com/eco-i/eco-i.github.io/actions/runs/39774368252) **18 assertions PASS**, 실제 QA 로그인/지문 업로드 버튼 → Chromium synthetic PNG 파일 chooser → canvas JPEG 압축 → 가상 DB bytea 저장·재조회·지문 `등록됨`. 초과근무 실제 +10분/저장 버튼으로 10분 신규등록 → 20분 수정 저장 후 가상 DB·UI 재조회 성공.
- browser fixture: `qa-round3/e2e/ci/fingerprint-overtime-browser-fixture.sql`, driver `browser-fingerprint-overtime-success.py`, CI `workmoa-qa-fingerprint-overtime-browser.yml`. **합성 로그인/HTTP bridge와 PostgreSQL16 SQL** 이므로 private 운영 SQL 서버 시험 40/40·37/37와 별개의 통과임. 실 서버-실 UI E2E 또는 Android OS picker 성공을 뜻하지 않음.
- 브라우저 첫 Run 실패는 테스트가 빈 지문 섹션 자동 접힘을 펼치지 않은 문제, 두번째는 테스트의 Playwright `mimeType` 키 오류. 사용자 제품결함 아님. 세번째 Run 18/18 성공.
- 휴대폰 native picker 모의 `pagehide/pageshow` roundtrip 추후 격리시험 [Run 39774707035](https://github.com/eco-i/eco-i.github.io/actions/runs/39774707035) 추가 검증 중. 결과 확인 전 PASS 집계 금지.
- **운영 main/실 직원 DB/운영 SQL 변경 0**, 운영 미설치 RPC **21**, 공식 **3-8-53 완료, 3-8-54 미시작·BLOCKED, 제품결함 37, NOT CLEAN** 유지. Android 실제 picker/초과근무 실사용 장애는 아직 해결 검증 안 됨.

## 2026-10-22 — 장애 복구우선: 지문 native-picker 모의/초과근무 목록 수정 UI 통과, 반복안정성 후속
- [브라우저 범위별 증거](FINGERPRINT_OVERTIME_REAL_BROWSER_DB_QA_20261022.md).
- [Run 39774707035](https://github.com/eco-i/eco-i.github.io/actions/runs/39774707035) **20/20 PASS**: 실제 QA HTML·Chromium 파일선택창, BFCache `pagehide/pageshow` 모의, 지문 교체 CAS·단일 upload DB 재조회, 초과근무 날짜상세 10→20 저장. 실제 Android OS picker E2E **아님**.
- 실제 월간 초과근무 목록 `수정` 버튼 경로를 추가로 시험: 처음 [Run 39781365923](https://github.com/eco-i/eco-i.github.io/actions/runs/39781365923)에서 목록에서 20→30 초안까진 가능했으나 Playwright HTTP 응답 listener 15초 Timeout, 원인 미확정(제품 결함 확정 금지). 상태 안전진단 보강 후 [Run 39781727235](https://github.com/eco-i/eco-i.github.io/actions/runs/39781727235) **27/27 PASS**, 실제 버튼으로 20→30 저장→가상 PostgreSQL DB 커밋·재조회 확인.
- CI `.github/workflows/workmoa-qa-fingerprint-overtime-browser.yml`은 synthetic DB를 매번 새로 초기화해 동일 27개 UI 버튼→DB 테스트 3회 반복으로 강화. [Run 39781994803](https://github.com/eco-i/eco-i.github.io/actions/runs/39781994803) 결과 미확인 중에는 81/81 통과 주장 금지.
- 운영 `main`의 `handleFingerprintPhotoInput`, `selectFingerprintPhoto`, `saveOvertimeDay`, `loadOvertimeList` 등 코어 구현이 현재 QA와 같음 직접 대조. 단, QA만 안전 오류진단 표시 있음.
- **운영 main, 실제 직원 DB, Supabase migration/데이터 변경 전혀 없음.** 합성 로그인/HTTP/SQL 흐름의 성공을 실제 운영 지문·초과근무 복구로 주장 금지. 실제 사용자 장애 원인/해결 확인 전. 미설치 RPC 21, 3차 3-8-54 BLOCKED / 신규 결함 37 / NOT CLEAN 유지.

## 2026-10-22 — 기존 기능 재검증의 최신 검증 사실: 반복 UI→가상 PG **96/96 PASS**
- [최종 Run 39783806135](https://github.com/eco-i/eco-i.github.io/actions/runs/39783806135), Job `119841631558`, **SUCCESS**, 브라우저 test `browser-fingerprint-overtime-success.py` 실제 Chromium 3회 반복, **32/32 x 3 = 96/96**, 오류 0. 이전 [Run 39781994803](https://github.com/eco-i/eco-i.github.io/actions/runs/39781994803)는 브라우저 설치 정체/취소로 PASS 미집계. 재검수 workflow의 설치 경계 `timeout` 적용.
- 지문: 합성 PNG photo picker→JPEG 압축→DB 저장·재조회, `pagehide/pageshow` 모의 중 사진 교체/중복 방지 성공. 초과근무: 실제 상세 10→20 및 목록 수정 버튼 20→30, DB 커밋·읽기 성공.
- **신규 stale 보호 시나리오**: 현재 30분을 본 사용자 A가 40분 초안을 작성한 사이 B가 가짜 DB 50분으로 업데이트. A 저장은 서버 최신 재조회 차이 감지 후 **write RPC 미발행**, 기존 B 50분 보존, 사용자 A 40분 초안 보존 및 경고. 세 회차 모두 PASS.
- [공개 상세 보고서](FINGERPRINT_OVERTIME_REAL_BROWSER_DB_QA_20261022.md) 갱신. 주의 **운영 실 SQL 원본 브라우저 연결 X, 가짜 세션·가짜 HTTP/PG SQL, 실제 Android OS picker X**. 따라서 기존 사용자 지문/초과근무 운영 장애 원인 미확정/복구 미검증; 실제 운영기능 CLEAN 불가.
- 사용자 핵심 우선순위: 기존 기능 복구 > 3차 검수 블록. 실운영 누락 21 RPC도 계속 해결 필요. 운영 `main`과 실제 직원 DB 전혀 변경 없음. 공식 3-8-53 완료 / 3-8-54 미시작 BLOCKED / 3차 결함 37 / NOT CLEAN 유지.

## 2026-10-22 — 기존 기능 복구 우선 신규 진전: 휴근5 + 연차·장기재직2, **격리 93/93 PASS / 운영 미설치**
- [QA 공개 요약](RECOVERY_HOLIDAY_LEAVE_LONG_7_RPC_SCOPED_20261022.md), 비공개 `ahnbest23-hash/workmoa-backend-private/RECOVERY_7_RPC_HOLIDAY_LEAVE_LONG_REVIEW_20261022.md`.
- 운영 `SongdoFood` 실 실제 스키마/trigger와 v1 함수를 **read-only** 조회. 운영 `main`이 직접 호출하는 `save_my_holiday_work_personnel_v2`, `admin_save_holiday_work_personnel_v2`, `delete_my_holiday_work_personnel_v2`, `admin_delete_holiday_work_personnel_v2`, `admin_set_holiday_work_enabled_v2`, `save_my_annual_leave_setting_v2`, `save_my_long_service_profile_v2` 7종 **현재 미설치 재확인**. 오래된 v1 일곱 쓰기 함수는 anon/authenticated EXECUTE true, v2 CAS 우회 위험이므로 운영 설치시 구버전 권한도 원자적으로 정리 필요.
- 사용자가 기존 기능 복구를 우선 지시하여 비공개에 **원본 직접 실행 하드스톱** 두 파일 생성: `DRAFT_HOLIDAY_WORK_V2_LIVE_SCHEMA_REVIEW_ONLY_20261022.sql.txt` 5종, `DRAFT_LEAVE_LONG_V2_LIVE_SCHEMA_REVIEW_ONLY_20261022.sql.txt` 2종. 기존 라이브 연차·장기재직 v1 SQL은 `qa/LEAVE_LONG_V1_OPERATIONAL_SQL_NO_DEPLOY.sql.txt` 안전 복사. 운영 함수를 설치하지 않음.
- [휴근 v2 실제 PG17/PostgREST14.18 가상 직원·두 관리자 Run 39786082575](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39786082575) **52/52 PASS**. CAS·stale 409·신규/수정/삭제·관리자 enable·감사·권한·동시경합 포함.
- [연차/장기재직 운영 v1 실 SQL 결합 가상 PG17/PostgREST14.18 Run 39786862120](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39786862120) **41/41 PASS**. 2026 기준, 2027 grant/carry, 장기재직 제외기간/rollback, 타 탭 최신값 보호, readonly/expired 거절 포함.
- 합계 **93/93 scoped PASS**, **실제 운영 E2E는 0, 운영 DB DDL·데이터·운영 main 수정 0**, 복구 RPC는 아직 실제 설치되지 않음. 사용자에게 운영 7종 설치·기존 v1 anonymous 쓰기권한 차단 범위를 별도 명시적으로 승인받고 안전 적용 후 실제 UI 재조회가 되어야만 해당 항목 복구 완료.
- 남은 미설치 **21종 그대로**(이 7종 실제 운영 적용·검증 성공 시 14종으로 감소). 3차 3-8-53 완료, 3-8-54 BLOCKED, 신규 결함 37, NOT CLEAN. 지문·초과근무 모바일 운영장애도 실제 재발 원인 미확정.

## 2026-10-22 — 사용자가 명시 승인한 휴근5·연차/장기2 서버 RPC 복구 운영 적용 **성공**
- [적용 보고서](RECOVERY_HOLIDAY_LEAVE_LONG_7_RPC_SCOPED_20261022.md), private `RECOVERY_7_RPC_HOLIDAY_LEAVE_LONG_REVIEW_20261022.md`. live SongdoFood `fnzgjidzdazlodmjhmes` migration **`20261022134303_workmoa_restore_holiday_leave_long_v2_cas_20261022`** 성공/마이그레이션 목록 확인. 서버에 7개 v2 RPC 신규 설치, 새 7개 `anon/authenticated/service_role EXECUTE` true, 옛 7개 non-CAS 쓰기 함수 `anon/authenticated EXECUTE` false, `service_role` true (기존 definer 내부 사용 가능). 운영 public `main` 코드 수정 없음.
- 사용자 승인 범위는 이 7개 기능뿐, PIN·인사변경·초기화·복원 함수에는 효력 없음.
- **실제 직원 데이터 전후 집계/최종 수정시각 전부 동일:** employees 15, holiday_work_entries 19, holiday_work_eligibility 2, annual_leave_settings 2, long_service_settings 1, long_service_exclusions 0, audit_logs 128. SQL DDL/권한만 변경. synthetic PG17/PostgREST14.18 휴근 **52/52**, 연차/장기재직 **41/41**, 총 **93/93 PASS**. **실제 운영 UI 사용자 쓰기·재조회 E2E는 아직 미검증**이므로 설치 성공과 기능 실사용 확인을 구분할 것.
- 원래 남아 있던 21 RPC에서 7 설치 후 **14종 여전히 운영 미설치**: admin_apply_personnel_batch_v3, admin_cancel_personnel_batch_v2, admin_reset_current_personnel_pins_v3, admin_reset_data_v2, admin_restore_data_v2, admin_restore_personnel_snapshot_v3, admin_restore_safety_backup_v2, admin_set_employee_account_status_v3, get_personnel_restore_revision_v1, preview_admin_reset_data_v2, preview_current_personnel_pin_reset_v1, preview_data_restore_v2, preview_safety_backup_restore_v2, restore_my_data_v2. 위험한 후속 영역이므로 다음 14종 일괄 설치 금지.
- 기존 지문등록·초과근무 수정 운영 장애는 별도로 사용 확인되지 않았음. 사용자 우선순위 **기존 기능 복구**. 3차 공식 **3-8-53 완료 / 3-8-54 미시작·BLOCKED / 37결함 / NOT CLEAN** 유지. 브라우저 오래 열린 탭은 새로고침 필요.

## 2026-10-22 22:53 KST — 실제 운영 로그로 지문/초과근무 읽기·저장 경로 재확인 (READ ONLY)
- [익명화 집계점검 보고서](REAL_OPERATING_LOG_FINGERPRINT_OVERTIME_20261022.md). 운영 SongdoFood 최근 24h `edge_logs`에서 `list_my_fingerprint_records` 220×200, `save_my_fingerprint_photo` 2×200+2×204, `get_my_fingerprint_photo` 5×200, `list_overtime_entries` 222×200, `save_my_overtime_entry_v2` 2×200. 그러나 **계획시간 자체를 수정하는 `save_my_overtime_day_v2` 호출은 이 기간 0건**. 완료 체크 `entry_v2`와 계획시간 변경 `day_v2`를 혼동하면 안 됨.
- 실제 지문 HTTP 성공 기록은 있으나 사용자 본인/Android picker 복귀 성공 인증이 아니다. 실제 초과근무 계획시간 수정 실사용 성공 근거는 여전히 없다. 서버 도달 전 UI 저장 가드에서 막힌 경우 운영 API 로그에 남지 않을 수 있다.
- 조회는 서버 `edge_logs`의 요청경로·HTTP 상태별 수량만 집계; **토큰/직원/사진/실제 초과근무 DB 행 접근 0, 운영 main/SQL/권한/실데이터 변경 0**. 기존 운영 SQL 가상 replay 37+40, 실제 QA Chromium synthetic 96은 서로 독립 제한검수.
- 다음 단계는 사용자에게 **실제 사용할 기존 사진의 열람(비파괴) 정상 여부**, 실제 등록 의도 있는 지문사진 1건 등록 또는 실제 수정 의도 있는 초과근무 시간 계획 변경 시 UI 결과를 확인하도록 요청하는 것. 불필요한 테스트 기록 생성/변경을 강요하지 말 것. 사용자의 기능 오류 시각·안내문구를 받아 위 RPC 경로와 비교하면 원인 범위를 좁힐 수 있음.
- 현 누락 RPC 14종, 3-8-53 마지막 완료 / 3-8-54 BLOCKED / 신규 결함 37 / NOT CLEAN 유지.

## 2026-10-22 — 매우 중요한 기존 장애 4개 이력 상태 정정 (사용자 실제 휴대폰 확인)
- [4개 기존 장애 실사용 확인 바로잡기](HISTORICAL_FOUR_INCIDENT_USER_CONFIRMATIONS_20261022.md).
- 이전 대화의 사용자가 직접 **2026-10-17 Galaxy에서 지문 등록 복구 확인**(`ver20261017-2249`, “되긴해”), **2026-10-18 휴대폰에서 초과근무 조출 1시간 삭제·저장 복구 확인**(`ver20261018-2100`, “응 된다”)했음을 과거 대화 기록에서 재발견. **2026-10-22 개인메모 저장·닫기 성공**, **사내일정 저장 성공**도 실사용 확인됨. 따라서 **기존 보고된 장애 4건은 이력상 4/4 사용자 재시험 확인 완료**였음. 이전 답변의 “50% 복구·나머지 2개 실사용 미검증”은 **이전 대화 실기기 성공 확인을 누락한 잘못된 집계**. 해당 사용 확인을 취소하거나 미검증으로 환원하지 말 것.
- 다만 운영 현재 버전 `ver20261018-2313`에서 네 기능 모두 재시험을 마친 것은 아니므로 **최신버전 전체 무회귀 인증·근무모아 CLEAN 아님**. 재발 의심은 별도 신규 재현/사용자 오류 시각+메시지 확인 후 진단.
- 운영 메타데이터 read-only로 지문 3/초과근무 3의 RPC 설치·인자·브라우저 EXECUTE true 및 main 코드에 picker recovery/CAS 경로가 여전히 존재함 재검증. 전혀 새 운영 DB 행 변경/쓰기/배포 없음.
- 여전히 미설치 RPC **14종**, 주로 인사·PIN·데이터 복원/초기화. **3차 3-8-53 완료/3-8-54 BLOCKED/37 신규 결함/NOT CLEAN**.

## 2026-10-22 — 잔여 RPC 14종 실제 계약조사 및 첫 안전 조회 시범 (운영 변경 없음)
- [14종 원문 호출계약/운영 위험대조 보고서](RECOVERY_REMAINING_14_RPC_CONTRACT_AUDIT_20261022.md). 운영 `pg_proc`에서 14종 전부 설치 0 재확인. 조회·미리보기 **5**, 직원·인사·PIN·데이터 변이 **9**. 운영 DB 및 직원 행 쓰기 0, 운영 main 변경 0.
- 핵심 **호환성 차단 발견**: `admin_cancel_personnel_batch_v2` 운영 main RPC는 `p_token,p_batch_id` **2개**, 검수 `qa-3-8` RPC는 `p_token,p_batch_id,p_expected_revision` **3개**. 운영 `list_personnel_assignments`은 `batch_revision` 미반환. v2를 단독 설치하면 한쪽 화면 오류·동시수정 CAS 우회 위험. 운영 main 수정 승인·실제 shared monotonic revision/locked writer 계약 수립 없이 설치 금지.
- 비공개 첫 안전 설계 후보: `DRAFT_PERSONNEL_RESTORE_REVISION_V1_REVIEW_ONLY_20261022.sql.txt` (`_require_admin`, 단일 읽기 snapshot, 32-hex hash만 응답, 실행시 무조건 에러로 막는 guard), synthetic PG17/PostgREST14.18 gate [Run 39794106739](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39794106739). 성공 여부 미확정/신뢰 불가 시 보고서 갱신; **실운영 설치 절대 안함**.
- 작업 묶음 5개: 인사/계정/인사복원5, PIN미리보기+초기화2, 개인·관리자 백업복원3, 관리자 초기화2, 안전백업 복원2. preview와 destructive mutation은 동일 권한·CAS·잠금 버전으로 *함께* 격리시험. 과거 v1 백업 미리보기는 `current_revision`이 없고 기존 원본 인사복원은 여러 이력테이블 전체 삭제·재적재. 미검증 포워더/일괄 설치 금지.
- 진행상태: 기존 복구 RPC 12/26, 남은 14/26. 별도 3차 마지막 완료 3-8-53 / 3-8-54 미시작·BLOCKED / 신규 결함 37 / NOT CLEAN. 사용자 실사용 기존 4장애 해결 이력과 다른 범위.

## 2026-10-22 추가 — 남은 14종의 인사 취소 실제 SQL/CAS 진척
- [잔여 14종 정리 보고서](RECOVERY_REMAINING_14_RPC_CONTRACT_AUDIT_20261022.md)를 최신화.
- Private 가짜 PostgreSQL17/PostgREST14.18 **인사 복구 기준값 조회 1종 47/47 PASS** [Run 39794106739](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39794106739). 데이터 내용 ABA 한계 확인. 이건 사용자 실운영 함수 설치가 아닌 **read-only prototype 격리**이며 14종은 운영 모두 누락 그대로.
- 실운영 `admin_cancel_personnel_batch(uuid,bigint)` v1 원문을 read-only `pg_proc` 조회→비공개 `qa/PERSONNEL_CANCEL_OPERATIONAL_V1_COPY_NO_DEPLOY.sql.txt` 실행 차단 파일에 별도 복사. 비공개 `DRAFT_PERSONNEL_CANCEL_ACTUAL_V1_WRAPPER_NOT_FOR_LIVE.sql.txt`는 v1 위에 3인자 expected revision 검사를 추가하고 기존 Snapshot/감사/신호 보존(가상 `batch_revision` 칼럼/trigger). [Run 39795582713](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39795582713) 추가 시험, **최종 성공 전 PASS 선언 금지**.
- 운영 `main`은 2인자 취소, QA는 3인자 취소. 실운영 `personnel_batches`엔 revision 필드 없음. live personnel_batches/actions/account_events에 공통 revision/lock/ABA CAS가 정립되지 않아 **그대로 설치 불가**. 실제 권한/직원 데이터/운영 main 무변경.
- 이번에는 3차 검수 블록 재개한 것이 아님. 공식 3-8-53/3-8-54 BLOCKED, 신규결함37, NOT CLEAN. 사용자는 14 RPC 기능별 실제 복구를 우선 요청 중.
