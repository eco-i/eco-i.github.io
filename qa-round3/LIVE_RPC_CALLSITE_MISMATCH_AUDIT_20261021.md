# 근무모아 — 운영 main 직접 호출 26종 vs 실제 서버 함수: 계약 불일치 위험 판정 (2026-10-21)

> **검수 성격:** 승인받은 운영 Supabase **시스템 카탈로그 읽기 전용 실측** + GitHub `main`/QA 원본 HTML의 직접 호출 정적 대조. **실제 직원 로그인·업무 RPC 실행·DML/DDL·운영 main 변경·실직원 DB 레코드 조회 0.**
> **판정:** 최신 앱의 일부 업무 경로에 서버 함수 이름 불일치가 **직접 존재하는 사실을 확인**. 해당 화면의 실행 실패·사용자 반응·데이터손실은 미실행이므로 별도 실증 필요. **전체 E2E NOT CLEAN, 배포 승인 불가.**

## 1. 직접 대조 결과
- 운영 `main` HEAD: `6c784210e048426f18a486d5602652626d97574d`; 운영 HTML blob: `5553a1d319e3ab7ff4dd6bb8ee7d995657112698`; QA HTML blob: `08867d7117ad9ae5a8247eda8d223687af2b8411`.
- `index.html`, `maintenance-20261018.js`, `site-update-history.js` 리터럴·대체 이름 합계 **80종**.
- 운영 서버의 실제 `public` 함수 **54종 설치 확인, 26종 이름 미설치**. 26종은 현재 운영 `main` HTML에 **직접 `rpc('이름')` 형태로 31번 등장**하고 QA HTML에서도 동일하게 직접 호출됨.
- 해당 호출부의 `if(!configured())` 로컬 저장 분기는 **실운영 서버가 설정된 상태에서의 안전한 서버 fallback이 아님**. 해당 31건은 정적 대조 범위에서 `rpcPreferPersonnel(...)` / `rpcPreferPersonnelChain(...)` 자동 구버전 대체 호출이 아니었음.
- PostgreSQL `pg_proc`에 없는 함수가 PostgREST에서 호출 가능한지 여부와 실제 브라우저의 에러 메시지는 실행 검증하지 않았음. 따라서 **운영 메타데이터 계약 결손이 증빙된 것**이고, 사용자 눈에 보이는 장애 발생 여부는 미확인.
- `CURRENT_STATE.json`의 **3-8-53 / 3-8-54 미시작 / 결함 37종** 유지. 위 불일치는 검증 범위상 **신규 정규 제품 결함 번호를 임의 부여하지 않음**.

## 2. 대상 26종 분류 및 호출 위치
GitHub `main/index.html` 원문 기준 (라인은 해당 blob의 고정된 위치이며 후속 파일 변경 시 이동 가능):

| 영역 | 서버에 없는 직접 호출명 | 원본 행 |
|---|---|---|
| 직원/인사/PIN (7종) | `admin_apply_personnel_batch_v3`, `admin_cancel_personnel_batch_v2`, `admin_set_employee_account_status_v3`, `admin_restore_personnel_snapshot_v3`, `admin_reset_current_personnel_pins_v3`, `preview_current_personnel_pin_reset_v1`, `get_personnel_restore_revision_v1` | 10353, 10371, 10133, 10423, 10472, 10458, 10387 |
| 휴일근무/자격 (5종) | `admin_save_holiday_work_personnel_v2`, `save_my_holiday_work_personnel_v2`, `admin_delete_holiday_work_personnel_v2`, `delete_my_holiday_work_personnel_v2`, `admin_set_holiday_work_enabled_v2` | 8527, 8527, 8566/8726, 8566/8726, 9466 |
| 데이터 복원/초기화 (7종) | `preview_data_restore_v2`, `restore_my_data_v2`, `admin_restore_data_v2`, `admin_reset_data_v2`, `preview_admin_reset_data_v2`, `preview_safety_backup_restore_v2`, `admin_restore_safety_backup_v2` | 10998/11020/11084/11110, 11034, 11120, 11171, 11154, 11224, 11233 |
| 회사일정 (2종) | `save_company_event_v4`, `delete_company_event_v4` | 8370, 8406 |
| 개인 메모 (3종) | `save_my_memo_v2`, `delete_my_memo_v2`, `delete_my_memos_v2` | 7831, 7849, 8099 |
| 연차 (1종) | `save_my_annual_leave_setting_v2` | 7177 |
| 장기재직 (1종) | `save_my_long_service_profile_v2` | 4331 |

**합계: 7+5+7+2+3+1+1 = 26종, 실제 코드 호출 31곳.**

## 3. 구버전 함수가 있다고 즉시 대체하면 안 되는 근거
- 운영 DB에는 `save_my_memo`, `save_my_annual_leave_setting`, `save_company_event_v3`, `admin_apply_personnel_batch`, `admin_reset_data_v1`, `admin_save_holiday_work_personnel_v1` 등 여러 구버전 함수가 존재함을 메타데이터만으로 확인.
- 사례 1: 화면 `save_my_memo_v2` 호출에는 `p_expected` 스냅샷이 있지만 설치된 `save_my_memo` 원형에는 해당 인자 없음.
- 사례 2: 화면 `save_company_event_v4`에는 `p_expected_updated_at`이 있지만 설치된 `save_company_event_v3`에는 없음.
- 사례 3: 화면 `admin_apply_personnel_batch_v3`에는 `p_expected` 인자가 있지만 설치된 `admin_apply_personnel_batch`에는 없음.
- 사례 4: 화면 `admin_reset_data_v2`에는 `p_expected_revision` 인자가 있지만 설치된 `admin_reset_data_v1`에는 없음.
- **동시수정(CAS)/권한 검증 의미가 다를 수 있으므로 자동 `v2/v3→v1` fallback, 무분별한 SQL 생성·설치, 파괴적 운영 시험을 금지**. 더 깊은 함수 권한/본문 동등성 실증 전에 원본·계약을 확보할 것.

## 4. 안전한 해결 순서
1. **사용자에게 현재 현상과 미검증 범위 안내:** 최근 화면 코드가 서버에 없는 이름을 요청하는 사실은 실측. 미검증 상태에서 실데이터 저장·삭제 버튼으로 장애 재현하지 않는다.
2. **별도 비공개 원본 확보:** 실제 서버에 없는 26종의 `v2/v3`는 PG에서 정의를 추출할 수 없음. 설계·구현 정본/이전 migration 확보 또는 함수별 새 서버 계약 설계를 별도 검토해야 함. 운영 DB 내부의 다른 54종 원본은 확인할 수 있어도 이를 26종의 원본으로 꾸미면 안 됨.
3. **독립 QA의 진짜 계약 검증:** 일회용 합성 PostgreSQL + 운영과 분리된 가짜 직원 테스트 환경에 승인된 서버 변경 후보를 설치하여 UI 입력→PostgREST→권한/RLS/인사·CAS 경쟁→실제 SQL DB commit/rollback을 검증. 운영 키, 직원 데이터, 운영 DB 복제 금지.
4. **우선순위:** P0 동시수정/계정권한/휴근/복원·초기화처럼 업무 기록 손상 가능성이 큰 경로 우선; 메모·회사일정/연차·장기재직 동등성 함께 검증. 초점은 검수 블록을 늘리는 게 아니라 **실제 배포 서버와 앱 API 계약 일치**.
5. **명시적인 최종 배포 승인 전에는 어떤 운영 변경도 금지.** 현행 운영 `main`의 제품 코드, SQL, 직원 DB 그대로.

## 5. 비밀정보 제한
- 운영 Supabase API URL/키·Project ref, 운영 함수 body/권한 정책식, 직원/지문/토큰/PIN/비밀번호/행 데이터를 **공개 GitHub에 반출하거나 워크플로 artifact로 업로드하지 않았음**.
- 이 문서는 기존 공개 프런트에 있는 함수 식별자와 **이름 존재/미존재 확인만** 포함; 실제 보안 함수 구현을 재게시하지 않음.

**공식 상태:** `3-8-53` 유지, `3-8-54` 미시작, 신규 제품 결함 공식 **37종**, E2E 전체 NOT CLEAN, `main`/운영 DB/직원 데이터/실제 업무 RPC/운영 배포 변경 0.
