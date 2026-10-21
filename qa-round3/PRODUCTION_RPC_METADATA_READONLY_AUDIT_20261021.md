# 근무모아 — 사용자 승인 운영 Supabase 서버 계약 읽기 전용 실측 (2026-10-21)

> **실측 상태: 서버 SQL 메타데이터 확인 완료 / 운영 함수 동작 및 E2E 미검증 / 운영 DB 쓰기 0**
> 승인 범위: 함수명·인자·존재 여부, 스키마·RLS·권한 등 시스템 카탈로그만 **읽기 전용** 확인. 직원/근태/지문/인증정보 행 조회·로그인·RPC 업무호출·DDL/DML·배포·과금 0.
> 이 저장소는 **PUBLIC**이다. 이 보고서에는 **실제 서버 함수 본문, 보안 정책식, 세션/PIN/비밀번호, SQL 소스 코드, 권한별 취약 경로, 데이터값/비공개 경로를 넣지 않는다.**

## 1. 출처와 카운트 해석
- 운영 `main` HEAD는 검사 기준 `6c784210e048426f18a486d5602652626d97574d`. 운영 HTML blob `5553a1d319e3ab7ff4dd6bb8ee7d995657112698`. QA HTML blob `08867d7117ad9ae5a8247eda8d223687af2b8411`.
- 기존 [원본 저장소 감사](BACKEND_ORIGINAL_SQL_READINESS_AUDIT_20261021.md)에서 확인한 **80 호출명 / GitHub SQL 정의 6 / GitHub 원본 미수록 74**는 계속 맞다. 이것은 *GitHub 코드 보관*의 수치.
- 이번에 사용자가 승인한 **실제 운영 서버 시스템 카탈로그** 읽기 전용 실측 결과: 프런트에 나타나는 80개 이름 중 **54종 설치 확인, 26종 미설치**. 해당 54종 모두 단일 시그니처(54개)로 확인. 이 결과는 *특정 시점의 라이브 DB 현재 객체 목록*이며 GitHub 80/6/74와 서로 다른 지표.
- 이전에 찾아낸 2026-09 비공개 보관 SQL 후보의 30개 이름은 현재 서버에 설치된 원본과 *버전/함수 정의 일치가 아직 확증되지 않음*. 실제 서버 정의 자체는 catalog에서 일부 메타데이터/서버측 fingerprint로만 비교; 원문 공개 반출/저장 0.
- 최근 운영 스키마 마이그레이션 목록을 10건 확인. 이것만으로 최초 스키마·전체 서버 코드 출처를 증명하지 못한다.

## 2. 반드시 확인해야 할 배포 함수 계약 격차
- **실제 운영 `main`과 QA `qa-3-8` HTML 모두**, 서버 카탈로그에 동일 이름이 없는 **26개 함수명을 직접 `rpc('...')` 호출하는 코드 경로를 포함**한다.
- 조사된 대표 이름(이미 공개 프런트 소스에 포함된 RPC 식별자): `admin_apply_personnel_batch_v3`, `admin_set_employee_account_status_v3`, `admin_save_holiday_work_personnel_v2`, `save_my_memo_v2`, `save_my_annual_leave_setting_v2`, `save_my_long_service_profile_v2`, `preview_data_restore_v2`, `restore_my_data_v2`, `save_company_event_v4`, `get_personnel_restore_revision_v1`.
- **리스크:** 이 호출이 실제 인증된 앱 경로에서 수행될 경우 서버가 해당 RPC를 해결하지 못할 수 있다. 일부 기능은 클라이언트에서 구버전 재시도·오류 처리·기능 제한이 있을 수 있으므로 **실제 UI 고장/데이터 손실 여부는 아직 단정 불가**.
- 중요한 현재 서버 설치 확인 예: `login_employee_personnel_v1`, `login_employee`, `get_account_status`, `logout_employee`, `save_attendance_personnel_v2`, `save_attendance_with_annual_leave_personnel_v2`, `delete_attendance_personnel_v2`, `list_attendance_with_annual_leave`, `change_own_pin_v2`, `list_recent_audit_page`, `admin_save_maintenance_schedule`.
- SQL 객체 존재 및 시그니처 확인은 **해당 함수의 인증·권한·RLS/CAS·데이터 정합성 실행검증이 아니다**.

## 3. 접근제어 메타데이터의 비공개 검토 사항
- 실제 운영 서버의 업무 테이블, RLS 활성화, 함수의 보안 실행 권한/명시적 search_path, PostgreSQL 권한, 정책 개수 및 Supabase Security Advisors를 **읽기 전용** 조사.
- 권한과 RLS가 존재한다는 이유로 보안 안전을 보증하지 않는다. 권한 높은 서버 RPC의 실제 세션/PIN/소유권/쓰기 검증은 별도 격리 QA에서 검증해야 한다.
- Supabase 어드바이저에는 정보성 항목과 보안 경고가 존재한다. 정확한 취약성 여부·위험도 판단에는 함수 본문/의도된 API 공개범위 대조가 필요하다.
- **실제 정책식·보안 관련 내부 설정은 공개 리포지터리에 게시하지 않음.** 확인 결과는 별도 비공개 취급.
- 참고: [Supabase RLS 공식 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. 현재 결론 / 앞으로의 순서
1. **이미 확인한 위험 우선:** 실제 `main` 앱의 RPC 직접 호출 계약 vs 운영 스키마 26종 불일치. 승인된 **독립 synthetic QA 환경**에서 함수 원본/오류 경로 재현 후 동작 결함 여부 분류.
2. 함수 54종이 설치되어 있는 것과 **민감한 실제 정의·GRANT/RLS/테이블 스키마의 버전 관리 가능 원본 확보**는 별도 과제. 원문을 공개 GitHub/Actions에 반입하지 말고 **승인된 비공개 저장 경로** 마련 후 보안 검토.
3. 사전 승인 없는 QA 프로젝트 생성/과금, 직원 실계정/데이터·업무 RPC 실행, SQL 스키마/데이터 변경은 **하지 않는다**.
4. 실제 근태·PIN·권한·동시성/Realtime 등의 P0·P1 E2E 완료 조건은 여전히 미충족.

## 5. 공식 상태 고정
- 마지막 공식 완료 **3-8-53**, `3-8-54` **미시작/보류**, 3차 신규 제품 결함 **37종**. 이번 항목은 **운영 배포 계약상 메타데이터 불일치 실측**으로서, 실제 제품 동작 실패를 미검증 상태에서 확정 결함으로 중복 집계하지 않는다.
- **운영 `main`/직원 DB/배포/실제 SQL·데이터 변경 0**. GitHub에는 비민감 검수 보고서 및 인수인계만 반영.
