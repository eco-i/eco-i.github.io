# 운영 장애 의심 전수 대조 — 2026-10-22 KST

**검사 목적:** 네 차례 기존 기능 장애 재발에 대한 사용자 우려 확인. 운영 기능 정상으로 추정하지 않음.

## 직접 검증한 범위 (읽기 전용)
- 운영 GitHub `eco-i/eco-i.github.io/main/index.html` blob SHA `5553a1d319e3ab7ff4dd6bb8ee7d995657112698`, `main` HEAD 변경 없음.
- 운영 Supabase `SongdoFood` PostgreSQL **pg_proc 함수 이름·identity argument·anon/authenticated EXECUTE** 메타데이터만 조회; 직원/지문/초과근무/개인메모/일정 데이터 행은 미열람·미수정.
- 소스 `rpc('literal_name',{...})` 형식의 **직접 호출 104곳 / 고유 함수 이름 71종** 확인. 동적 `rpc(variable,...)` 호출·서버 내부에서 다른 함수를 부르는 의존성은 이 수치에서 제외. 운영 서버 `public` 함수 목록 고유 이름 188종.
- **현재 운영 서버에 없는 직접 호출 RPC 21종 / 참조 호출 위치 26곳.** 2026-10-22 사용자 승인 후 설치된 개인메모 v2 3종 + 사내일정 v4 2종 제외한 잔여 수치. 21종은 2차·3차 당시 테스트 가상 PASS 여부와 관계없이 실서비스에서는 해당 호출을 실행하면 실패할 계약 공백.

## 21종 누락 분류

**휴근 5종**
- `admin_save_holiday_work_personnel_v2`
- `save_my_holiday_work_personnel_v2`
- `admin_delete_holiday_work_personnel_v2`
- `delete_my_holiday_work_personnel_v2`
- `admin_set_holiday_work_enabled_v2`

**연차·장기재직 기준 2종**
- `save_my_annual_leave_setting_v2`
- `save_my_long_service_profile_v2`

**인사발령·계정상태·관리자 PIN·인사복원 7종**
- `admin_set_employee_account_status_v3`
- `admin_apply_personnel_batch_v3`
- `admin_cancel_personnel_batch_v2`
- `get_personnel_restore_revision_v1`
- `admin_restore_personnel_snapshot_v3`
- `preview_current_personnel_pin_reset_v1`
- `admin_reset_current_personnel_pins_v3`

**데이터 복원·초기화·복구지점 미리보기 7종**
- `preview_data_restore_v2`
- `restore_my_data_v2`
- `admin_restore_data_v2`
- `preview_admin_reset_data_v2`
- `admin_reset_data_v2`
- `preview_safety_backup_restore_v2`
- `admin_restore_safety_backup_v2`

## 설치되어 있지만 장애 미해결
- `save_my_fingerprint_photo`, `get_my_fingerprint_photo`, `delete_my_fingerprint_photo`는 실제 서버에 존재하며 공개 `anon`/`authenticated` EXECUTE 활성·직접 인자 일치. 그러나 카메라/파일 업로드 정지 또는 응답/동기화/RLS/파일 크기/토큰 실패 가능성은 **별도**. 실동작 PASS 아님.
- `save_my_overtime_day_v2`, `save_my_overtime_entry_v2`도 서버에 존재하고 인자·EXECUTE 메타데이터 일치. 실제 수정 실패는 **별도** 원인 필요.
- `save_attendance_personnel_v2`, `save_attendance_with_annual_leave_personnel_v2`는 static 단순 파서에서 `p_expected`만 추출되지만 실제 HTML은 `{...legacyPayload,p_expected:...}`로 전개하며 서버 필수 인자가 `legacyPayload` 내 존재. **이 두 곳을 확정 인자 불일치라고 표시하면 오탐.**
- 실서버 함수 존재/권한/인자만으로 DB mutation·파일 업로드 성공·로그인/PIN/RLS/복원 정합성 확인 불가.

## 우선순위·배포 금지 조건
1. 관리자/일반 직원의 빈번한 휴근, 연차 기준, 장기재직 저장·삭제 우선 분리 검증. 인사·PIN/복원/초기화는 데이터 파괴 위험이 있어 **일괄 21종 설치 금지**.
2. 지문등록·초과근무 수정 기존 사용자 장애는 **함수 누락과 별개로 재현/실사용 진단**. 직원 DB를 임의로 쓰는 자동화 금지.
3. 모든 수정을 배포 전에 **실제 브라우저→운영과 동등한 PostgREST+SQL** 계약 검증, 설치 여부·실행권한·인자·스키마·다중 관리자 CAS/rollback 점검; 운영 후 사용자 실동작 확인 없이는 기능 CLEAN 선언 금지.
4. 사전·사후 오염방지를 위해 **현 운영 main 및 실제 직원 데이터 변경 금지**, 이번 작업 GitHub `qa-3-8` 보고서만 작성. 다음 3-8-54는 미시작·BLOCKED / 신규 제품 결함 37 / 전체 NOT CLEAN.

※ 21종은 **현재 설치되지 않은 진짜 함수 이름의 개수**이지 사용자에게 21건의 실제 장애가 모두 발생했다는 의미가 아니다.
