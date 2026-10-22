# 근무모아 기존 장애 우선 복구 7종 — 승인 전 기술검토 (2026-10-22)

**복구 상태: 격리시험 93/93 PASS · 운영 서버 미설치 7종 · 사용자 실제 운영 재확인 전 · NOT CLEAN**

## 운영 현황
- 운영 `main/index.html`에서 직접 호출하는 휴근 v2 5종, 연차 기준 저장 v2 1종, 장기재직 기준 저장 v2 1종이 `SongdoFood` 운영 Supabase의 `public` RPC 목록에서 누락된 것을 **읽기 전용 카탈로그로 재확인**.
- 현재 기존 v1 서버 함수 7종은 설치되어 있으며 브라우저 `anon`/`authenticated` 실행 권한이 남아 있다. 신규 v2만 설치하고 v1 경로를 그대로 노출하면 여러 탭/구버전에서 v2의 동시수정 보호를 우회할 수 있으므로 **승인된 운영 설치시 같이 해결해야 한다**.
- 실제 스키마·trigger/기존 인증/감사 규칙을 `pg_proc`, `pg_trigger`, `information_schema` 로만 확인. 직원/근태/지문/연차/인사/감사 실제 내용 행의 열람·수정은 없었음.

## 준비된 후보 (비공개 서버 개발 저장소)
- `DRAFT_HOLIDAY_WORK_V2_LIVE_SCHEMA_REVIEW_ONLY_20261022.sql.txt`: 휴근 등록·수정·삭제(본인/관리자) 4종 + 관리자 사용 가능 설정 1종. 임의 저장 덮어쓰기 방지(expected id/timestamp), 사용자별 트랜잭션 직렬화, 실제 기존 휴근 차감/일근/공휴일 검사·감사·Realtime helper 유지.
- `DRAFT_LEAVE_LONG_V2_LIVE_SCHEMA_REVIEW_ONLY_20261022.sql.txt`: 연차 설정 저장 및 장기재직/제외기간 저장 2종. 화면의 `p_expected` snapshot 비교 후 최신 서버 값과 불일치하면 충돌 반환; 오래된 기준값과 제외기간 덮어쓰기 방지.
- 기존 운영 `save_my_annual_leave_setting`, `save_my_long_service_profile`의 SQL 원문은 별도 실행차단 파일로 복사하여 격리 시험에서 사용.
- **원문 SQL은 실행시 무조건 중단되는 안전 장치를 포함**하므로 운영에 설치되지 않는다.

## 결과가 나온 격리시험
| 범위 | GitHub Actions | 결과 |
|---|---|---|
| 휴근 5종 | [39786082575](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39786082575) | **52/52 PASS** |
| 연차·장기재직 2종 | [39786862120](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39786862120) | **41/41 PASS** |
| 합계 | 실제 가상 PG17·PostgREST14.18, 가짜 직원·두 관리자·가짜 제외기간 | **93/93 PASS** |

검사 범위: 정상 등록/수정/삭제/갱신, 권한 오류, readonly/만료세션, 화면의 지난 updated_at으로 수정 시도한 충돌 차단, 두 관리자의 동시 수정, 감사 보존, 익명 직접 테이블 접근 차단. 모든 결과는 **격리 환경**이며 실제 운영 사이트 사용자의 저장 성공을 입증하지 않음.

## 운영 적용 전 필요한 일
1. 사용자 **운영 서버 7종 적용 승인**을 별도로 확인한다. 이번 작업의 기존 운영 `main` 변경·실제 직원 DB 변경·운영 함수 설치는 모두 **0**.
2. 승인 뒤 실제 서버에서 컬럼·제약·함수/기존 권한을 사전 재확인하고, SQL 7개 생성과 구버전 쓰기 RPC의 익명 브라우저 실행 차단을 원자적으로 적용해 CAS 우회를 방지한다. 공개 테이블 직접 권한 부여는 금지. 실제 직원 행을 바꾸지 않는다.
3. 설치 여부 및 사전·사후 기록 보존을 읽기 전용으로 확인, 사용자 실제 화면에서 저장·수정·삭제 후 재조회 결과 확인. **실사용 확인 전 CLEAN 금지**.
4. 현재 전체 미설치 RPC 21종에서 이 7종이 실제 운영에 설치·검증되면 비로소 잔여 **14종**으로 감소한다. 인사·복원·초기화 고위험 14종은 이번 범위 밖.

**공식 3차:** 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 새 결함 37종 / 전체 NOT CLEAN.

## 사용자 운영 적용 승인에 따른 실제 서버 복구 완료 — 2026-10-22

**승인 범위:** SongdoFood project `fnzgjidzdazlodmjhmes` 운영 SQL 함수 7종 신규 등록 + 구버전 비동시수정보호 쓰기 7종 브라우저 실행 권한 차단. **운영 `eco-i/eco-i.github.io/main` 변경 없음.** 사용자 명시 승인으로 실행.

- **Supabase 성공 마이그레이션:** `20261022134303_workmoa_restore_holiday_leave_long_v2_cas_20261022`, 서버 `list_migrations` 에서 확인.
- 안전한 migration: SHA 고정된 private SQL 초안 2개에서 설치금지 marker 제거·스키마/구버전 함수/신버전 미설치 사전검사 뒤 single migration DDL, 생성 후 새 함수 7종 anon/authenticated/service_role `EXECUTE` 명시 허용. 기존 v1 쓰기 함수 7종 `PUBLIC, anon, authenticated` 실행권한 취소. 기존 v1 함수는 삭제하지 않으며 backend `service_role` EXECUTE 유지. `NOTIFY pgrst,'reload schema'`.
- `pg_proc` 사후 읽기 전용 확인: **새 7/7** postgres 소유·SECURITY DEFINER·올바른 프런트 인자·익명/인증 사용자 실행권한. **기존 7/7** 브라우저 실행권한 false, service_role true. 기존 함수 내부 PostgreSQL definer 호출 유지.
- **실데이터 불변 검증 (사전/사후 동일)**: 직원 15, 휴근 19 (max `2026-10-05 23:39:40.720181+00`), 휴근 사용 가능 설정 2 (max `2026-09-11 13:47:15.109679+00`), 연차 기준 2 (max `2026-09-12 15:51:54.220803+00`), 장기재직 기준 1 (max `2026-09-24 10:43:14.67104+00`), 제외기간 0, 감사로그 128 (최종 생성 `2026-10-22 11:15:18.486302+00`). 실제 직원 개별 행은 열람·수정하지 않았고 집계/마지막 수정 시각만 대조. 변동 0.
- 외부 접속·실사용 검증: **가짜 직원 PostgreSQL17/PostgREST14.18 93/93 PASS는 유지**, 그러나 운영 사이트에서 직원 사용자의 RPC 쓰기 성공/재조회 E2E는 **아직 미실시**. 해당 기능을 완전 CLEAN으로 선언 금지.
- 운영 누락 RPC **21→14종** 직접 `pg_proc` 재확인. 잔여 목록: `admin_apply_personnel_batch_v3`, `admin_cancel_personnel_batch_v2`, `admin_reset_current_personnel_pins_v3`, `admin_reset_data_v2`, `admin_restore_data_v2`, `admin_restore_personnel_snapshot_v3`, `admin_restore_safety_backup_v2`, `admin_set_employee_account_status_v3`, `get_personnel_restore_revision_v1`, `preview_admin_reset_data_v2`, `preview_current_personnel_pin_reset_v1`, `preview_data_restore_v2`, `preview_safety_backup_restore_v2`, `restore_my_data_v2`. 위험한 PIN·인사·복원·초기화 함수는 **이번 승인 범위 밖, 전혀 설치하지 않음**.
- Supabase Security advisors 사후 점검: 기존 RLS-no-policy 안내 등, 공개 세션기반 SECURITY DEFINER 관련 WARN 존재. 이 앱의 custom session architecture와 관련, 신규 범위 외 대규모 보안구조 변경 없음. 참조: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- 운영 브라우저의 구버전 탭은 v1 direct 호출에 대해 접근 거절될 수 있으므로 최신화/새로고침 안내. 운영 `main` 브라우저 코드는 이미 v2로 작성됨.
- 3차 공식 3-8-53 완료, 3-8-54 미시작·BLOCKED, 신규 제품 결함 37종, **NOT CLEAN**, 배포 승인/실사용 전체 E2E **아님**.
