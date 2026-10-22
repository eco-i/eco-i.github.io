# 근무모아 운영 누락 RPC 14종 — 실 스키마·브라우저 계약 조사 / 인사 복원 revision 1차 준비

**2026-10-22 KST | 상태: 운영 14종 미설치 재확인, DDL/직원기록/운영 main 변경 0, 전체 NOT CLEAN.**

## 1. 14종 전부 운영 미설치 확인
2026-10-22 운영 `SongdoFood` `fnzgjidzdazlodmjhmes` **실제 `pg_proc` 읽기 전용 조회 결과 14/14 미설치**. 프런트 운영 `eco-i/eco-i.github.io/main/index.html`에서 실제 호출하는 RPC 14개, 조회·미리보기 5개와 실제 데이터/인사/PIN 변경 9개로 분류.

| 안전한 배포 단위(함께 승인·검증 필수) | 현재 미설치 RPC | 개수 | 위험 |
|---|---|---:|---|
| 인사/계정/복구지점 | `admin_apply_personnel_batch_v3`, `admin_cancel_personnel_batch_v2`, `admin_set_employee_account_status_v3`, `get_personnel_restore_revision_v1`, `admin_restore_personnel_snapshot_v3` | 5 | 근무배치·계정효력/기존 이력의 대량 변경 |
| 현재 직원 PIN 초기화 | `preview_current_personnel_pin_reset_v1`, `admin_reset_current_personnel_pins_v3` | 2 | 전 직원 PIN 0000 변경 및 기존 세션 무효화 |
| 개인·관리자 백업 파일 복원 | `preview_data_restore_v2`, `restore_my_data_v2`, `admin_restore_data_v2` | 3 | 업로드 백업 데이터로 선택 영역 교체 |
| 관리자 데이터 초기화 | `preview_admin_reset_data_v2`, `admin_reset_data_v2` | 2 | 부서 업무 데이터 선택 삭제·기준값 재설정 |
| 안전백업 시점 복구 | `preview_safety_backup_restore_v2`, `admin_restore_safety_backup_v2` | 2 | 과거 백업으로 롤백·감사/동시경합 위험 |

**금지:** 단독 preview만 먼저 운영 배포하면 성공처럼 보이는 미리보기 이후 여전히 쓰기 404가 날 수 있음. 실제 쓰기만 먼저 배포하면 오래된 데이터 덮어쓰기·비인가 작업 가능. **미리보기와 대응하는 원자적 CAS 재검증을 하나의 사용자 기능 단위로 함께 입증**할 때까지 배포하지 않는다.

## 2. 운영 main vs QA branch 계약 충돌 발견
- 운영 `main`의 `admin_cancel_personnel_batch_v2` 호출은 **`{p_token,p_batch_id}` 2개**.
- 검수 `qa-3-8` 동일 이름의 호출은 **`{p_token,p_batch_id,p_expected_revision}` 3개**.
- 현재 운영 `list_personnel_assignments` 출력은 17개 필드이고 **`batch_revision` 없음**. QA 브랜치 관련 취소화면은 이 필드를 필수로 요구하는 설계.
- 운영에서 v2 두 인자로 즉시 설치하면 최종 GET 이후 DB 쓰기 사이 CAS가 누락될 수 있고, QA용 세 인자 RPC만 설치하면 운영 main이 스키마 cache에서 function mismatch 404/PGRST202가 될 수 있음. **정식 revision 추가 + 이전 모든 인사 쓰기 경로 공유 + 운영 프런트 전환** 없이는 금지.
- 비공개 선행문서 `PERSONNEL_CANCEL_REVISION_CONTRACT_GATE_20261022.md`에 동일 위험 명시. 가짜 DB 테스트의 cancellation schema는 실제 운영 테이블과 달라 바로 배포 불가.

## 3. 운영 스키마에서 확인한 기타 위험과 이전 서버 함수
- `personnel_batches`, `personnel_actions`, `personnel_account_events`, `personnel_snapshots`, `employees`가 복구 대상. 기존 `admin_restore_personnel_snapshot`은 인사이력 3개 테이블을 삭제·재적재 후 `employees` 회사입사일/유입구분 일부 변경, snapshot/audit 생성. **단순 정적 비교만으로는 잃어버린 중간 변경/ABA 회귀 위험을 충분히 막지 못함**.
- 기존 `admin_reset_current_personnel_pins`은 조건에 맞는 직원 PIN 해시를 재설정하고 세션을 일부 삭제. `preview_current_personnel_pin_reset_v1`과 새로운 `admin_reset_current_personnel_pins_v3`가 **동일한 target revision과 같은 잠금**을 검사해야 함.
- 기존 `preview_data_restore_v1`은 백업 섹션/변경 건수를 계산해 미리보기를 반환하지만 **현재 데이터 revision이 없음**. UI의 `preview_data_restore_v2`는 32자리 hex revision 필수. 새 restore_v2 계열이 마지막 상태 재검사/안전백업/동시쓰기 방어를 원자적으로 수행해야 하므로 기존 v1을 무조건 포워딩해선 안 됨.
- 실제 운영 `pgcrypto`는 `extensions` 스키마에 존재. UI `dataRpcRevision`/인사 복원 strict parser는 **정확히 32자리 hex**만 받으므로 임의로 SHA256 64자리 반환하면 프런트 오류 발생.

## 4. 이번에 준비한 첫 조회 함수 시범안(절대 운영 설치 금지)
- 비공개 `ahnbest23-hash/workmoa-backend-private/DRAFT_PERSONNEL_RESTORE_REVISION_V1_REVIEW_ONLY_20261022.sql.txt`. 직접 실행시 **`WORKMOA_READONLY_PERSONNEL_REVISION_DRAFT_NOT_FOR_LIVE` 무조건 RAISE**. 원본은 운영에 적용할 수 없도록 guard.
- `get_personnel_restore_revision_v1(p_token uuid) RETURNS text` **읽기 전용 시범 설계**: `_require_admin`으로 현재 관리자 인증 후 인사배치·인사액션·계정상태·직원 입사/유입 메타정보 및 감사·복구지점 high-watermark를 한 SQL snapshot에서 읽고, SHA256 해시 앞 32자만 반환. 실제 인사정보 원문은 응답에 반환하지 않음.
- 주의: 이 시범안은 **인사 쓰기 함수와 동일 잠금·버전 계산·ABA 방어를 입증하지 못하므로 운영 배포 불가**. 기존 인사 함수가 감사나 snapshot 생성을 누락하거나 데이터 복원이 watermark를 롤백하면 구 revision이 되살아날 위험도 있음. 데이터 복원 후 ABA 불가를 위해 별도 단조 증가 generation 등 설계가 필요할 수 있음.
- 비공개 가짜 PostgreSQL17/PostgREST14.18 fixture `qa/personnel_restore_revision_readonly_fixture.sql`, HTTP 격리시험 `qa/personnel_restore_revision_readonly_http_check.py`, runner `qa/run_personnel_restore_revision_readonly_lab.sh`; workflow `.github/workflows/workmoa-private-personnel-restore-revision-readonly-qa.yml`, [시험 Run 39794106739](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39794106739). **최종 성공 결과 확인 전 통과로 기록하지 않는다.**
- 가짜 DB 시험 예정: admin/비admin/read-only/expired 분리, 32자리 hex strict contract, 인사/계정/직원 입사일 변경에 대한 변경 감지, snapshot/audit high-watermark, 정적 상태 ABA 한계 확인, 직접 익명 테이블 접근 차단. 실제 직원 행 0.

## 5. 현재 판정 / 다음 작업
- 기능 복구 진행률 **12/26 운영 RPC 설치 = 46%**, 미설치 14 = 54%; 신규 14종 설치 이번 작업 **0**, 운영 직원 데이터 변경 **0**.
- 14종은 조회 함수부터 무분별하게 설치할 수 없고, 최소한 대응하는 쓰기와 동시수정 보호를 완성해야 함. 가장 위험한 개인/관리자 백업/초기화는 삭제행이 생기므로 완전 격리 DB 회귀검증/복원 직전 새 안전백업 검증 필수.
- 운영 `eco-i/eco-i.github.io/main`는 변경하지 않음. QA 리포트·비공개 초안만 추가. 원칙: 승인 전 운영 DB DDL/권한/직원 기록/사이트 배포 금지.
- 3차 종합검수 마지막 **3-8-53**, 다음 **3-8-54 미시작·보류**, 3차 새 결함 37, 전체 **NOT CLEAN**.
