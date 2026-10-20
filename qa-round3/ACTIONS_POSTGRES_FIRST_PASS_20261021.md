# GitHub Actions 무료 자동검수 — 첫 실제 PostgreSQL 통합시험 증빙

> **2026-10-21 08:20 KST** / `qa-3-8` 전용. 이 문서는 **신규 완료 검수 블록이나 전체 CLEAN 판정이 아님**. 공식 마지막 완료 3-8-53 유지, 다음 3-8-54 미시작. 운영 `main`과 실 직원 DB 보호.

## 1. GitHub에서 실측한 실행 기록
- 실행 링크: https://github.com/eco-i/eco-i.github.io/actions/runs/39514319716
- Run ID: `39514319716`; commit `366310855aa268318611f321f651f5c3c7e667cd`.
- 2026-10-20T23:20:09Z 시작, 2026-10-20T23:20:42Z 완료. **GitHub Actions job SUCCESS**, step별 실제 완료 상태 직접 확인. **가짜 Docker/가짜 DB 모의가 아니라 PostgreSQL 16.15 컨테이너가 실행됨.**
- 범위: **운영 연결 0**, Ubuntu-24.04 기본 GitHub-hosted runner + PostgreSQL 16 Alpine, port **127.0.0.1:5432**. `SUPABASE_URL`/cloud secrets 주입 없음. `GITHUB_TOKEN` repository permission `contents:read`, checkout `persist-credentials:false`.
- 합성 데이터: 미리 정의한 가짜 관리자(1)·직원(2), 임의 고정 가상 UUID, **2027-05-13 가상 휴일**. 전체 운영 직원·지문·근태 row/backup/인증정보 재사용하지 않음.
- 검증 SQL: **기존 QA 교정 원본** `qa-round3/fixes/QA_3-8-6_holiday_work_serialization.sql` (변경 없이 적용). 부족한 기본 DB 구조/인증 헬퍼는 `qa-round3/e2e/ci/synthetic-baseline.sql`의 **합성 최소 fixture**로 충족. 이것은 원래 Supabase 인증/RLS를 복원하거나 검증한 것이 아니다.

## 2. 실제 PASS 근거 (workflow stdout)
1. `PASS synthetic invalid identity fails closed` — 임의 관리자 UUID를 직원 세션처럼 쓰는 요청 거절(합성 헬퍼).
2. `PASS live PostgreSQL accepted/stored synthetic holiday work` — 가상 휴일근무 기록 저장 및 분 계산(합성 net 계산 함수, 본 앱 분계산의 증명 아님).
3. `PASS holiday-work before schedule change: ... HOLIDAY_WORK_HISTORY_CONFLICT` — 근태 기록 트랜잭션이 먼저 잠근 경우 다음 정비편성 변경 거부; 기록·revision 불변 확인.
4. `PASS schedule change before holiday-work: ... NOT_HOLIDAY` — 편성 변경 트랜잭션이 먼저 잠근 경우 구휴일 근무기록 쓰기 거부; 최종 DB 행/개정 검증.
5. `PASS two-admin schedule revision CAS: ... STALE_MAINTENANCE_SCHEDULE` — 동일 예상 revision의 관리자 두 요청 경쟁에서 하나만 성공, 중복 갱신 방어 확인.
6. 로그 종료문구: `SQL_SCOPE_PASS ONLY: full authenticated browser/Supabase E2E remains UNVERIFIED`.

## 3. 검사 범위·공통 제약
- **실증된 항목:** QA SQL 저장 함수의 **실제 PostgreSQL 트랜잭션** 및 행잠금·충돌 응답. 이전 가짜 Docker CLI 검증보다 실제 서버 실행 증거가 추가됨.
- **실증되지 않은 항목:** 실제 Supabase Auth/REST/PostgREST/RLS/Realtime, 근무모아 전체 앱 로그인, 브라우저 2탭/Web Locks, 실제 모바일 카메라/지문 저장, 관리자 PIN, 근태 CAS, 복잡한 연가·대정비 UI/DB 상호작용.
- `synthetic-baseline.sql`의 `_require_admin`, `_session_employee`, `_is_holiday_work_day`, `_holiday_work_net_minutes` 등은 **CI-only 최소 헬퍼**다. 서버 DB 엔진/QA SQL 경합은 시험했으나 **실서비스 SQL 전체 구성과 권한/데이터 정합성을 증명하지 않음**.
- 앱의 문자 그대로 나오는 RPC 71개 중 GitHub 저장소 증분 SQL 16개에서 이름이 일치하는 CREATE 정의 3개만 있음. 안전한 풀앱 검수용 완전 독립 합성 기초 스키마를 추가 설계해야 P0/P1 E2E 진입 가능.
- **최종 3차 판정 변경 없음:** 코드 종합검수 조건부 종료, 전체 E2E 미완료/NOT CLEAN, 운영 배포 보류. 이번 Actions 시험으로 기존 결함 37종을 자동 해결/운영 반영한 것으로 간주하지 않음.

## 4. 파일 및 안전 범위
- 새 workflow: `.github/workflows/workmoa-qa-postgres.yml`, `push` 이벤트 중 **qa-3-8 + 관련 파일 변경** 시에만 자동 실행. 비관련 문서 변경은 재실행하지 않음.
- 새 synthetic SQL: `qa-round3/e2e/ci/synthetic-baseline.sql`.
- 새 concurrency test: `qa-round3/e2e/ci/pg-integration.py`.
- 실제 run link는 public GitHub Actions 실행. 로그에 가상 테스트 식별자와 합성 비밀번호만 포함. 실 비밀번호·키·DB 접근은 없음.
- 공식 `main` HEAD: `6c784210e048426f18a486d5602652626d97574d`로 재검사하여 불변 확인. 제품 index/maintenance 수정 0. 실직원 SQL/RPC/레코드 수정 0. 유료 서비스 개설 0.

## 5. 다음 합리적 작업
1. 이 CI 결과를 'SQL 범위 통과'로만 보관.
2. 독립된 합성 QA DB 기초 계약/RLS/서버 RPC를 설계·검증한 다음, Actions에서 *실제 근무모아 HTML을 운영 endpoint 없이* 구동할 수 있을 때 로그인/권한/근태 E2E 확대.
3. 여전히 실제 Android/iOS 카메라 picker 시험은 실기기 절차로 분리.
4. 비용 발생·운영 반영·실 직원 DB 접근·최종 배포는 모두 별도 사용자 승인 전 실행 금지.
