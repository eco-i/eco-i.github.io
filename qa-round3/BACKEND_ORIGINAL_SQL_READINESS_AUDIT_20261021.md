# 근무모아 3차 — 실제 서버 SQL 원본 완결성 점검 (2026-10-21)

> **판정: 저장소의 원본 서버 SQL 근거 부족으로 실제 서비스 수준 전체 E2E BLOCKED.**
> 자동 점검 Job **PASS는 원본 함수의 완비 또는 실제 서비스 안전을 뜻하지 않는다.**
> `qa-3-8` 브랜치만 검사하며 운영 `main`/직원 DB/Supabase 프로젝트에는 **접속·수정하지 않음**.

## 1. GitHub Actions 실제 확인
- Run: https://github.com/eco-i/eco-i.github.io/actions/runs/39530177504
- SHA: `ddb7246fd91f6995686070f273420ee9ad703dad`.
- 출력: `SOURCE_PROVENANCE_AUDIT_PASS called=80 documented=6 missing=74`
- 출력: `FULL_APP_E2E_UNVERIFIED; NO_PROD_DB_ACCESS; SYNTHETIC_FIXTURES_EXCLUDED`.
- Actions 결과 **completed / success**, 실제 실행 로그·업로드된 provenance JSON artifact 확인.
- 원본 자동 인벤토리: `qa-round3/e2e/ci/backend-readiness.mjs`; 실행 설정: `.github/workflows/workmoa-qa-backend-readiness.yml`.
- 설정: Node 22, read-only Git checkout, GitHub Actions 기본 Ubuntu, cloud credential 및 remote backend 불필요. `CURRENT_STATE.json`과 프런트/운영 마이그레이션 파일이 변경되면 새 평가 실행.

## 2. 정적 코드별 서버 함수 정의 격차
| 항목 | 확인 수 |
|---|---:|
| 원본 프런트 소스 | `index.html`, `maintenance-20261018.js`, `site-update-history.js` (3개 파일) |
| 정적 리터럴 `rpc(...)` 및 fallback RPC 이름 | **80종** |
| `db/migrations/*.sql` SQL 파일 | **16개** |
| 운영용 버전 관리 SQL 내 이름 일치 CREATE FUNCTION | **6종** |
| SQL 원본 미포함(호출 이름 기준) | **74종** |

**일치하는 6종:** `admin_save_maintenance_schedule`, `admin_set_holiday_work_month_confirmation`, `get_maintenance_schedule`, `list_site_update_history_v1`, `save_my_overtime_day_v2`, `save_my_overtime_entry_v2`.

**산정 원칙:** 유효한 원본 정의는 `db/migrations/*.sql`에 `CREATE FUNCTION`으로 버전 관리된 이름만 포함. 브라우저가 호출하는 `rpc('name')`, `rpcPreferPersonnel('new','legacy')`, `rpcPreferPersonnelChain(['new','legacy'])`의 literal 이름 집계. 주석/동적 SQL/함수 시그니처·실제 배포 여부까지 분석하는 완전한 SQL 파서는 아니므로 정적 범위 추정이며 일부 누락 가능.

**이전 2026-10-20 문서의 71/3 또는 임시 점검의 76/6과 다른 이유:** 신규 감사는 주 앱뿐 아니라 JS 지원 파일 두 개, 로그인·인사 조회의 대체 함수명까지 포함하고, 16개 운영용 SQL의 `CREATE FUNCTION`을 직접 대조한다. **현재 GitHub 소스 기준 자동화 공식 지표는 80/6/74**로 통일.

**중요:** '저장소에 함수 정의가 없음'은 **운영 Supabase 서버에 함수가 없다는 뜻이 아니다**. DB에 별도로 이미 배포됐을 수 있지만, 실서비스를 읽지 않았으므로 설치/정합성/버전 상태는 알 수 없다.

## 3. 실제 E2E 재개에 꼭 필요한 원본 근거
| 영역 | 원본 SQL/검증 대상 예시 | 저장소 근거 |
|---|---|---|
| 로그인/세션 | `login_employee_personnel_v1`, `login_employee`, 세션 만료·강제 철회 및 `logout_employee` | 원본 없음 |
| 직원/권한 | `list_employees_personnel_v2`, `get_personnel_account_status`, `list_personnel_assignments`, `list_personnel_account_events` | 원본 없음 |
| 근태 목록·등록·수정/삭제 | `list_attendance_with_annual_leave`, `save_attendance_personnel_v2`, `save_attendance_with_annual_leave_personnel_v2`, `delete_attendance_personnel_v2` | 원본 없음 |
| PIN 보호 | `initial_pin_status_v1`, `change_own_pin_v2` | 원본 없음 |
| DB 접근제어 | 기본 테이블 정의, 역할별 `GRANT`, RLS 정책, function ownership, session/admin helper 및 시그니처 | 일관된 최초 구축용 버전 관리 기준선 없음 |
| 동시성 | 실제 제품 `save_attendance_personnel_v2`의 서버 CAS·락 및 권한 검사 | SQL 원본 없으므로 원본 동작 시험 불가 |

**앞선 실제 Chromium 저장버튼→합성 PostgreSQL PASS의 경계:** 가짜 사용자/인사 응답과 `qa-round3/e2e/ci/attendance-form-fixture.sql`의 **테스트용 생성 전용 SQL 함수**를 사용. 이 함수는 **운영 함수의 원본이 아니다**. 따라서 UI 이벤트→합성 DB 쓰기 경로를 확인한 것이지 운영 RLS/CAS 보호 통과가 아니다.

## 4. 고정된 안전 게이트
- 테스트용 합성 SQL은 **운영 원본 증거로 인정하지 않는다**.
- 위 핵심 함수가 버전 관리·검토된 DDL로 확보되고, 실제 운영 직원 DB와 완전히 분리한 가짜 직원/DB를 구성하기 전에는 `3-8-54`를 정규 실서버 전체 E2E 완료 처리하지 않는다.
- 독립 환경에서도 데이터·함수 이름뿐 아니라 **시그니처, GRANT, RLS, 세션/관리자 권한, CAS/동시 트랜잭션, 스키마 migration 순서** 검증 필요.
- 개인 PC 프로그램 설치/유료 QA 서버 사용은 **요구하지 않는다**. 다른 출처의 버전 관리된 서버 최초 구축 SQL이 확보되지 않았다면 자동 Actions만으로 운영 원본 동작을 재현할 수 없다.
- **추가 모의 테스트 PASS를 무한 반복하지 말 것.** 이후 우선 과제는 원본 SQL의 비개인정보 버전 관리 증빙 확보/검토다. 운영 DB 백업 데이터·PIN·지문·실제 계정 또는 서비스 자격증명 요청·추출 금지.
- 원본 DDL을 확보하는 경로가 필요해진다면 **운영 Supabase 접근/추출 또는 유료 기능은 사전에 사용자 별도 승인**을 받고, 스키마 정의에 개인 정보가 없는지 검토한다. 이번 작업은 운영 접근·비용·배포 0.

## 5. 공식 상태
- 마지막 공식 완료 **3-8-53**, 다음 **3-8-54 미시작**.
- 3차 신규 제품 결함 **37종** 그대로; 이번 감사는 **제품 결함 발견이 아니라 증거/환경 공백 검증**.
- 전체 CLEAN 아님, 서버 E2E 미완료, 운영 배포 미승인.
- 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 확인; 운영 DB 및 직원 기록 접근/변경 없음.
