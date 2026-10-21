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
