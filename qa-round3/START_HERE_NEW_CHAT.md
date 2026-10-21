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
