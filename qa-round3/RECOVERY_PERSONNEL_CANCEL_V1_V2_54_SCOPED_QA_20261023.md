# 근무모아 — 인사발령 취소 운영 v1 SQL 결합 격리검수(2026-10-23)

**공식 상태: 12/26 RPC 운영 복구 확인, 14종 잔여 / 3-8-53 완료, 3-8-54 보류 / 신규 결함 37종 / NOT CLEAN**

- 비공개 GitHub Actions [Run 39888051203](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39888051203) **SUCCESS, 합성 PostgreSQL17+PostgREST14.18 54/54**. 원본 실운영 인사발령 취소 v1 SQL을 실행방지 초안에서 격리 복사하여 v2 wrapper와 함께 시험함.
- 기존 두 관리자 동시취소, 1성공/1충돌, 기존 안전 복구지점·감사·알림·권한 거부·롤백 검수 38개를 보존하고, 발령 대상 수정 시 revision 누락 경계·추가 synthetic 보호 트리거·ABA·복구지점 생성 실패 원자 롤백 16개를 추가.
- **중요:** 기본 부모행만 revision 증가시키는 초안은 대상 직원 정보 변경을 놓쳐 오래된 취소를 허용하는 경계가 가상 DB에서 확인됨. 54 PASS는 위험 재현과 *synthetic 트리거를 별도로 적용한 제한적 보호 시험*의 합계이지, 운영 적합 승인 증거가 아님.
- 운영 `personnel_batches` revision 컬럼/트리거·인사조회 revision 노출, 운영 2인자 ↔ QA 3인자 앱 계약, 다른 인사/복구·계정 상태 변경 전체의 공통 revision·잠금·복원 ABA 문제는 **미해결**.
- 시험 최초 확대 Run `39887913604`는 QA 테스트 SQL 문자열 오류로 FAIL, 가상 시험 코드만 수정한 최종 Run은 PASS. 자세한 테스트 로그·SQL·안전성 근거는 비공개 서버 보고서 `PERSONNEL_CANCEL_OPERATIONAL_V1_54_QA_GATE_20261023.md`.
- 운영 `main` 및 실제 직원 DB/실운영 Supabase 변경 **0**. 다음은 교차쓰기·잠금순서·복원 세대값 설계 및 추가 격리시험. 운영 설치는 별도 사용자 승인 전 금지.


## 추가 2026-10-23 — 글로벌 generation 교차경합 격리 PASS (여전히 배포 차단)

- 비공개 [GitHub Actions Run 39889256803](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39889256803) **workflow/job SUCCESS**. 기존 취소 v1 원본 SQL 재생 기반 54/54 + 계정변경·직원 인사액션 변경·합성 복원·관리자 동시취소를 공유 generation으로 직렬화한 가짜 PostgreSQL17/PostgREST14.18 **46/46**, 총 **100/100 한정 시험 항목 PASS**.
- global gate 단일 row `FOR UPDATE`를 먼저 취득, 오래된 expected generation 409, 계정변경 뒤 오래된 취소 차단, 변경 후 원상복구/복원 ABA 차단, snapshot+audit 실패 원자 롤백, 2관리자 동시취소 1명만 200, 옛 v1/v2 HTTP EXECUTE 가상 차단.
- 권한철회/세션 만료를 기다리는 동안 변화한 경우 잠금 획득 후 재검증해 거부하는 6개 신규 항목 PASS. 다만 모든 실운영 인증·관리자 세션·권한변경 함수와 동일한 잠금/행 보호가 구현된 것은 아님.
- **주의:** 실제 운영 SQL을 재생한 함수는 인사발령 취소 v1만. 계정상태·직원 인사 수정·복원은 **합성 대역 함수**. 54개 중 일부는 취약했던 부모 revision 단독 방식의 위험이 올바르게 재현된 항목이므로 전체 PASS가 실제 안전 인증을 뜻하지 않음.
- 운영 실스키마 read-only: `admin_apply_personnel_batch`의 신규 직원 ID `MAX(id)+1`, `admin_set_employee_account_status`의 독립 계정 이벤트 추가, `admin_restore_personnel_snapshot`의 delete-reinsert 복구 구조 확인. 모두 common generation·전역 잠금 전환 필요. 운영 main 취소는 2인자, QA는 3인자, 이번 가상 gate 취소는 4인자여서 여전히 클라이언트 계약 불일치.
- 비공개 상세 인수인계 `PERSONNEL_GLOBAL_GENERATION_CROSS_RPC_SYNTHETIC_GATE_20261023.md`. 다음은 실제 서버 등록/계정변경/복원 SQL을 공통 잠금/2차 인증/RLS·세대번호 계약으로 격리 구현 및 종단 통합검수, 운영 전 별도 승인.
- **운영 RPC 12/26 완료, 14종 남음. 3-8-53 완료 / 3-8-54 미시작 보류 / 37종 / NOT CLEAN** 불변. 실제 Supabase DB/직원기록/운영 `main` 변경 **0**.


## 추가 2026-10-23 — 실제 운영 인사관리 v1 원문 재생, 한정 160/160 검수 PASS

- [Private Actions Run 39890396771](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39890396771) **workflow/job SUCCESS**, 기존 54(취소 원문)+46(가상 공통 generation)+추가 **60/60**(실제 운영 `admin_apply_personnel_batch`, `admin_set_employee_account_status`, `admin_restore_personnel_snapshot` 및 관련 helper 원문 재생) = **160/160 scoped assertion PASS**.
- 실운영 원문 7종은 운영 Supabase 함수 정의를 **읽기 전용**으로 확보한 뒤 비공개 저장소 `qa/REAL_OPERATING_*_V1_COPY_NO_DEPLOY.sql.txt`에 직접 실행 차단 가드를 붙여 저장. 임시 QA PostgreSQL17에서만 SHA pin 대조·가드 제거·원문 리플레이 및 PostgREST14.18 HTTP 시험. 운영 DB의 실제 직원행은 읽거나 변경하지 않았음.
- 실제 신규/기존 인사발령 저장·수정, 실제 계정상태 이벤트, 실제 복구지점 생성·보존/복구, 가상 관리자의 2인 동시 신규직원 등록 시 글로벌 잠금 후 1 성공/1 충돌, PIN 불일치 및 감사 오류 롤백, 글로벌 generation ABA 차단 실증.
- **범위 주의:** 실제 운영 SQL 원문은 실행했지만 테이블/세션/권한·RLS/직원 편성 및 전역 generation 래퍼는 가상 구현. 운영에 `generation` 기능이 설치됐거나 14종 누락 RPC 중 어느 것이든 새로 복구됐다는 뜻 아님. 기존 54개 중 일부는 취약성 *재현* 성공. 운영의 별도 old RPC·데이터 복원·초기화 경로, 브라우저 계약, 잠금 교착/관리자 인증·2차 PIN 실규칙은 미해결.
- 실패 이력: Run 39890181728의 fake identity 중복 선언과 Run 39890283697의 임시 SQL 세미콜론 누락은 QA 작업 오류. 수정 후 Run 39890396771만 전체 SUCCESS. 실제 직원기록·운영 UI·서버 SQL/권한·배포 변경 **0**.
- PRIVATE 상세: `PERSONNEL_REAL_OPERATING_THREE_WRITER_GENERATION_160_QA_20261023.md`. 다음은 실운영 인증·잠금순서·旧 RPC 접근차단 및 운영 main/QA의 RPC 매개변수 계약 정합성을 완성한 뒤 브라우저→격리 서버 통합검수. **운영 반영은 별도 사용자 승인 후 진행.**
- 공식 상태 변경 없음: **RPC 운영 12/26(약 46%) / 잔여 14**, 3차 **3-8-53 완료 / 3-8-54 미시작·보류 / 누적 결함 37 / NOT CLEAN**.
