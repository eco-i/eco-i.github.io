# 근무모아 — 과거 보관 SQL 원본 후보 발견·증빙 범위 (2026-10-21)

> QA-only 발견 기록. `main` 운영 배포/직원 DB 접속/DDL 실행 없음. **공개 GitHub에는 원본 SQL 본문, private Library file ID/경로, 인증정보, RLS 조건식, 개인 데이터 절대 게시하지 않는다.**

## 1. 발견 경로 및 안전 조건
- 연결된 GitHub 저장소의 현행 브랜치와 확인한 과거 커밋에서는 완전한 최초 구축용 SQL 원본을 발견하지 못했음.
- 별도의 접근 허용된 **비공개 보관 파일**에서, 2026년 9월 작성된 근무모아 서버 SQL *후보*들을 발견함.
- 비공개 SQL 파일 목록 중 중복·진단용을 제외해 **대표 버전 10건만 읽기 전용**으로 함수 정의 이름을 정적 추출함. 이번 수치가 비공개 전체 보관 파일의 전수 조사 결과라는 의미는 아님.
- 해당 보관본이 실제 운영 DB에 적용되었는지, 2026년 10월 최신 운영 버전과 같은지, 실행 가능한 완전 초기 schema인지는 **검증되지 않음**. 임의로 운영 원본으로 승격하거나 SQL을 실행하지 않음.

## 2. 정적 호출 이름 대응 실측
- `qa-3-8` 소스 `index.html` (Git blob `08867d7117ad9ae5a8247eda8d223687af2b8411`), `maintenance-20261018.js`, `site-update-history.js`의 리터럴 RPC/fallback 호출 이름 **80종**.
- 현행 GitHub `db/migrations/` 16개에서 동일 이름의 `CREATE FUNCTION` 확인 **6종** (기존 공식 감사 80/6/74, Run `39530420675` 유지).
- 비공개 보관본 대표 SQL 10개에서 정적으로 확인된 DISTINCT 함수 정의 이름 **106종** (내부 helper 포함, 버전별 중복 제거).
- 그중 현재 프런트 호출 이름과 일치한 것 **31종**. 이 중 GitHub 기재 6종과 겹치는 1종을 제외하여, **GitHub에 없는 추가 정의 이름 후보 30종**.
- 합집합 **36/80종**에 대해 이름상 후보 존재. **나머지 44/80종은 조사된 자료에서 원본 정의 후보 미확인**.
- **이 숫자는 함수 이름 문자열의 대조 결과이지, 인자/반환값/본문 버전·실제 배포·RLS·CAS 안전성 검사 결과가 아니다.** 보관본의 `_...` helper를 통한 간접 권한 검사도 별도 검사 필요.
- 새 원본 후보는 공개 저장소로 복사/커밋/Actions artifact 업로드하지 않았음.

## 3. 후보가 발견된 영역 (현재 앱 RPC 이름에 해당)
- 인사/로그인: `login_employee_personnel_v1`, `login_employee`, `get_me`, `list_employees_personnel_v2`, `get_personnel_account_status`, `list_personnel_assignments`, `list_personnel_account_events`.
- PIN: `initial_pin_status_v1`, `get_initial_pin_me_v1`, `change_own_pin_v2`.
- 지문사진: `list_my_fingerprint_records`, `get_my_fingerprint_photo`, `save_my_fingerprint_photo`, `delete_my_fingerprint_photo`, `set_my_fingerprint_confirmed`.
- 기타 일부: 회사일정, 메모 D-day, 초과근무, 장기근속, 데이터 내보내기 등에서 함수 이름 후보 있음.
- 해당 보관본에는 일부 근태 저장 **v1** 구현 후보가 있지만, 현재 화면이 호출하는 근태 저장/삭제 **v2**의 원본으로 볼 수 없음.

## 4. 우선 막힌 고위험 RPC 예시
- `save_attendance_personnel_v2`, `save_attendance_with_annual_leave_personnel_v2`, `delete_attendance_personnel_v2`
- `list_attendance_with_annual_leave`, `logout_employee`, `get_account_status`
- `admin_set_employee_account_status_v3`, `admin_apply_personnel_batch_v3`, `list_recent_audit_page`
- 최신 권한·세션·CAS·Realtime 및 관리자 PIN과 연계되는 스키마/RLS/GRANT/trigger/role 상태도 운영과 동등한 원본인지 미확인.

## 5. 다음 단계의 단일 의존성
1. 발견된 비공개 보관본의 **버전/적용 이력/함수 시그니처** 대조. 보관 SQL 전문은 공개 GitHub로 절대 이전하지 않음.
2. 부족한 44종의 현행 SQL 및 실제 RLS·GRANT·스키마 확인은 **운영 Supabase 메타데이터/DDL 접근에 대한 별도 명시적 사용자 승인 전에는 수행하지 않음**.
3. 허가된 경우에도 먼저 최소범위 읽기 계획과 비공개 보관 방식을 확정하고, 실제 직원 데이터·지문·PIN·토큰·비밀번호/해시·운영 DML/DDL 쓰기와 QA 계정/직원 데이터 혼용을 금지.
4. 독립 synthetic QA DB와 진짜 서버 원본을 확보할 때에만 실제 P0 5/P1 3 E2E 재개. 동일 가짜 함수 검수 반복·전체 CLEAN 선언 금지.

**상태:** 정규 마지막 완료 `3-8-53`; `3-8-54` 미시작·BLOCKED, 누적 신규 제품결함 **37종**. `main` 변경 없음·운영 Supabase 접근 없음·실 DB 무변경.
