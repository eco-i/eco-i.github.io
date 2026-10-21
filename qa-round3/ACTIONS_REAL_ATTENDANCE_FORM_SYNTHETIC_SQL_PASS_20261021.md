# 2026-10-21 GitHub Actions 근무모아 원본 로그인·근태 저장 버튼→합성 PostgreSQL 검수 보고서

> **최종 판정: 실제 Chromium UI→테스트 전용 HTTP RPC→격리 PostgreSQL, 지정 저장 경로 SCOPED PASS 11/11.**
> **운영 Supabase Auth, PostgREST, RLS, 운영 원본 근태 저장 RPC, 실제 직원 인증/데이터에 대한 검수 통과를 뜻하지 않음.**
> 공식 블록 3-8-53 유지·3-8-54 미시작·신규 제품결함 37종·전체 CLEAN 미달·운영 배포 보류.

## 1. 완료 증빙
- 성공 Run: https://github.com/eco-i/eco-i.github.io/actions/runs/39519223780
- Run ID `39519223780`, SHA `42b0cf1b5c3eb1f596234b27d893254d90285fce`
- GitHub Actions **completed / success**, Python/Chromium 실제 출력 `PASS attendance-form` 11개, `FORM_BUTTON_SQL_SCOPE_PASS` 직접 확인.
- 실행 기준 2026-10-21 09:06 KST (GitHub 로그 2026-10-21 00:06 UTC).

### 검증 11개
1. 격리 PostgreSQL 신규 근태 테이블은 처음 0건.
2. 원본 근무모아 HTML 로그인 폼에서 테스트 가짜직원 로그인 → 직원명부/인사배치 합성 서버 조회 확인.
3. 앱이 실조회 응답을 근거로 테스트 직원·쓰기 가능한 최신 인사 문맥 표시.
4. 로그인 후 사용법 안내창을 실제 확인 버튼으로 닫음.
5. 앱의 실제 근태 등록창이 합성 날짜 `2027-05-13`, `연가`, 활성화된 저장 버튼을 표시.
6. 저장 버튼 클릭 전 PostgreSQL 근태 기록 0건.
7. 저장 클릭 직전 테스트 세션 active·계정 상태 최신 확인.
8. 실제 **저장 버튼 클릭** → 앱의 정상 preflight 뒤 `save_attendance_personnel_v2` RPC 1회 발송.
9. HTTP 테스트 게이트웨이가 PostgreSQL **합성 근태 저장 함수**를 실제 실행, 가짜 직원 ID 2/연가/2027-05-13/종일 1건 커밋 및 행 데이터 일치 확인.
10. 앱의 **저장 후 서버 재조회**가 방금 생성한 DB 행을 가져와 `state.attendance`에 반영.
11. Chromium의 운영 `*.supabase.co` 원격 요청 0.

## 2. 환경, 구현, 격리
- 기존 전체 근무모아 `index.html` **내용 자체는 수정하지 않음**, 테스트 생성기 `qa-round3/e2e/prepare-local-qa-site.mjs`가 임시 QA HTML에만 loopback 주소/가짜 publishable key 설정.
- Workflow: `.github/workflows/workmoa-qa-attendance-form.yml`; `qa-3-8`의 QA 관련 코드 push에만 실행; GitHub workflow `contents:read`; 실제 운영 DB 비밀번호·API key·원격 URL 없음.
- 서버: GitHub-hosted Ubuntu 24.04, **127.0.0.1:5432** PostgreSQL 16 Alpine(일회용), 테스트 HTTP 게이트웨이 **127.0.0.1:54321**, 원본 앱 임시 서버 **127.0.0.1:54330**, Chromium 모든 외부 요청 차단.
- 가짜 로그인·인사/배치/휴근 및 월간 근태 조회 응답: `qa-round3/e2e/ci/browser-attendance-form.py`의 엄격한 합성 fixture. 실제 직원·계정·지문은 사용하지 않음.
- SQL: `qa-round3/e2e/ci/synthetic-baseline.sql` + **새 테스트 전용** `qa-round3/e2e/ci/attendance-form-fixture.sql`. 후자의 `public.save_attendance_personnel_v2`는 이 프로젝트의 실제 운영 정의와 비교·검증된 SQL이 아닌 **한 날짜·한 종류·한 직원의 INSERT만 허용하는 QA 대역 함수**다.
- UI 로그인 과정은 실제 폼의 입력·로그인 버튼을 사용. 최초 사용자 안내 확인 및 저장 버튼도 실제 Chromium 클릭. **2027-05-13 선택은 날짜 선택기까지 클릭한 시험이 아니라 테스트 제어 코드로 해당 날짜에 `openForm` 호출**.
- 저장 후 `list_attendance_with_annual_leave` 응답은 실제 합성 PostgreSQL 테이블 SELECT에 기반. UI 상태 `state.attendance`에 실제 커밋 행이 반영된 것을 검증함.

## 3. 최초 시험 실패와 원인·회귀
- 첫 두 차례 run의 Playwright 클릭 실패: 로그인 직후 약 120ms 후 표시되는 **사용법 안내창**을 테스트가 기다리지 않아 저장 버튼을 가린 것. 테스트에서 실제 사용법 확인 버튼 표시를 기다리고 클릭하도록 변경. 제품 결함 아님.
- 다음 시험에서는 테스트 서버의 일부 보조 read RPC 미구현/합성 세션 오작동으로 저장 preflight에 진입하지 못함. 테스트 전용 read fixture 보완 후 해결. 운영 SQL 결함으로 집계하지 않음.
- 이후 시험에서 **근태 저장 및 PostgreSQL 1건 커밋까지 통과**했으나 Playwright가 닫혀서 숨겨진 backdrop을 기본 visible로 기다려 실패. `state="hidden"`을 사용하고 테스트 월을 저장 날짜의 2027년 5월로 맞춰 저장 후 UI 재조회까지 검증.
- 최종 성공 run과 로그로 증거 확인. QA 환경 결함·검증 스크립트 결함을 제품 결함과 혼동하지 않음.

## 4. 한계 및 남은 검증
- **이번에 확인한 것:** 실제 원본 앱 로그인 UI + 근태 등록창 + 실제 저장 버튼 + 변경 전 사전 조회 + 1회 RPC + 독립 PostgreSQL 커밋 + 저장 후 재조회.
- **확인하지 않은 것:** 실제 서비스 Supabase Auth/PostgREST/RLS, 실제 암호/PIN, 계정 disable/readonly의 서버 강제, 운영 원본 `save_attendance_personnel_v2` 권한 검증·동시 수정 CAS, 실제 앱 날짜 선택 UX 전체, 직원 DB 보호 정책, 실기기/Realtime/복구/관리자 교차 계정 시나리오, P0/P1 8개 E2E 완결.
- 따라서 이 결과는 **전체 앱 실서비스 E2E 통과 증빙이 아니다**. 가짜 구현으로 보안 안전성을 대신 증명하거나 전체 CLEAN, 배포 승인을 부여하지 않는다.

## 5. 작업 보호 및 재개 기준
- `main` HEAD: `6c784210e048426f18a486d5602652626d97574d` 불변. QA `index.html` Git blob `08867d7117ad9ae5a8247eda8d223687af2b8411`; QA `maintenance-20261018.js` blob `f8e8e469503d0abf53844aa85188b15b09a95238`, 제품 코드 수정 0.
- 신규 제품결함 0, 3차 누적 37종 유지, 정규 완료 블록 3-8-53, 차기 3-8-54 미시작. 운영 배포·실직원 DB·유료 서버 개설 0.
- **다음 실제 위험 감소 우선순위:** 원본 서버의 별도 합성 스키마/인증/RLS/근태 CAS에 기초한 독립 QA 원본 RPC 확보 전에는 추가 fake fixture PASS를 실제 운영 보안 증빙으로 승격하지 않는다. 정상 E2E 준비 시 8개 P0/P1 항목 수행 후 별도 배포 결정.
