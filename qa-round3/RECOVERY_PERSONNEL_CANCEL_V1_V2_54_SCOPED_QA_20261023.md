# 근무모아 — 인사발령 취소 운영 v1 SQL 결합 격리검수(2026-10-23)

**공식 상태: 12/26 RPC 운영 복구 확인, 14종 잔여 / 3-8-53 완료, 3-8-54 보류 / 신규 결함 37종 / NOT CLEAN**

- 비공개 GitHub Actions [Run 39888051203](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39888051203) **SUCCESS, 합성 PostgreSQL17+PostgREST14.18 54/54**. 원본 실운영 인사발령 취소 v1 SQL을 실행방지 초안에서 격리 복사하여 v2 wrapper와 함께 시험함.
- 기존 두 관리자 동시취소, 1성공/1충돌, 기존 안전 복구지점·감사·알림·권한 거부·롤백 검수 38개를 보존하고, 발령 대상 수정 시 revision 누락 경계·추가 synthetic 보호 트리거·ABA·복구지점 생성 실패 원자 롤백 16개를 추가.
- **중요:** 기본 부모행만 revision 증가시키는 초안은 대상 직원 정보 변경을 놓쳐 오래된 취소를 허용하는 경계가 가상 DB에서 확인됨. 54 PASS는 위험 재현과 *synthetic 트리거를 별도로 적용한 제한적 보호 시험*의 합계이지, 운영 적합 승인 증거가 아님.
- 운영 `personnel_batches` revision 컬럼/트리거·인사조회 revision 노출, 운영 2인자 ↔ QA 3인자 앱 계약, 다른 인사/복구·계정 상태 변경 전체의 공통 revision·잠금·복원 ABA 문제는 **미해결**.
- 시험 최초 확대 Run `39887913604`는 QA 테스트 SQL 문자열 오류로 FAIL, 가상 시험 코드만 수정한 최종 Run은 PASS. 자세한 테스트 로그·SQL·안전성 근거는 비공개 서버 보고서 `PERSONNEL_CANCEL_OPERATIONAL_V1_54_QA_GATE_20261023.md`.
- 운영 `main` 및 실제 직원 DB/실운영 Supabase 변경 **0**. 다음은 교차쓰기·잠금순서·복원 세대값 설계 및 추가 격리시험. 운영 설치는 별도 사용자 승인 전 금지.
