# 3-8-54 사전 준비도 판정 — 2026-10-22 (QA-only, 블록 미시작)

> **판정: NOT READY / BLOCKED. 3-8-54 미시작·미완료. 전체 종합검수 NOT CLEAN. 이 문서는 기존 3-8-53 완료를 변경하거나 운영 배포·DB 조작을 승인하지 않는다.**

## 1. 직접 확인한 근거

- 공개 QA HEAD: `885cfceb795c7a16cf74ee0006f4e5ab18fde686` (`qa-3-8`, 2026-10-22 기준 조회).
- 공개 운영 `main` HEAD: `6c784210e048426f18a486d5602652626d97574d` (변경 없음).
- 비공개 QA HEAD: `0926487437a987ddca3b5f14a25d9e2ae9cc1578` (확인 당시).
- `qa-round3/CURRENT_STATE.json`: 마지막 완료 **3-8-53**, 다음 **3-8-54**, 공식 신규 제품 결함 **37**. `updated_kst`는 2026-10-20; 최신 RPC 숫자까지 자동 반영하는 파일이 아니므로 과거 스냅샷과 혼동 금지.
- 2026-10-21 `e2e/ci/live-rpc-contract-snapshot.json`: **과거 시점** 26종 미설치. 2026-10-22 사용자 승인 운영 메모 CAS v2 **3종 설치** 및 이후 서버 카탈로그 재확인: **남은 23종** (`PRODUCTION_MEMO_V2_RELEASE_20261022.md` / 비공개 승인 보고서). 본 사전점검에서는 **운영 DB를 새로 조회하지 않았음**.
- 휴근 CAS 사용자 클릭 Chromium → 실제 PostgREST14.18 → disposable PG17 범위 20/20 PASS: [PRIVATE Actions #39750269978](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39750269978), job 119728797712 SUCCESS. 이는 합성 로그인·격리 SQL 일부의 **scoped PASS**이며 전체 앱 E2E PASS가 아님.

## 2. 아직 설치되지 않은 최신 운영 RPC 23종 (과거 26종 스냅샷 - 복구된 메모 3종)

| 그룹 | 종수 | 정확한 함수명 |
|---|---:|---|
| 인사·계정·PIN·인사복원 | 7 | `admin_apply_personnel_batch_v3`, `admin_cancel_personnel_batch_v2`, `admin_set_employee_account_status_v3`, `get_personnel_restore_revision_v1`, `admin_restore_personnel_snapshot_v3`, `preview_current_personnel_pin_reset_v1`, `admin_reset_current_personnel_pins_v3` |
| 휴일근무 가능 설정·본인/관리자 휴근 | 5 | `admin_set_holiday_work_enabled_v2`, `save_my_holiday_work_personnel_v2`, `delete_my_holiday_work_personnel_v2`, `admin_save_holiday_work_personnel_v2`, `admin_delete_holiday_work_personnel_v2` |
| 백업·복원·초기화/미리보기 | 7 | `admin_reset_data_v2`, `admin_restore_data_v2`, `admin_restore_safety_backup_v2`, `preview_admin_reset_data_v2`, `preview_data_restore_v2`, `preview_safety_backup_restore_v2`, `restore_my_data_v2` |
| 사내일정 | 2 | `save_company_event_v4`, `delete_company_event_v4` |
| 연차 설정 | 1 | `save_my_annual_leave_setting_v2` |
| 장기재직 기준 | 1 | `save_my_long_service_profile_v2` |
| **합계** | **23** | 메모 `save_my_memo_v2`, `delete_my_memo_v2`, `delete_my_memos_v2`는 설치되어 제외 |

- 남은 23종 중 **9종**(연차1/사내일정2/장기재직1/본인휴근2/관리자휴근2/휴근 토글1)은 이전 12/26종 PRIVATE 합성 PostgREST/Pg 범위 통과 후보에서 메모3을 제외한 숫자. **14종**은 동등 수준의 기능별 격리 검증 이력이 없음. 9종도 실제 운영 스키마·Auth/RLS/PIN·전체 브라우저 기능 적합성 및 운영 설치 승인 완료가 아니며, 실제 설치는 **0/23종**.
- `live-rpc-contract-snapshot.json`의 **26종/31곳**은 이력 증거로 보존. 현재 23종으로 표시되는 별도 증거 없이 오래된 CI 스냅샷을 바꿔 릴리스 GREEN을 만들지 않는다. 운영 함수 동등성 게이트는 여전히 RED/차단.

## 3. 3-8-54 완료 차단 조건

1. **완성된 독립 합성 QA backend 없음.** 무료 GitHub Actions PG17/PostgREST와 특정 함수 조합의 검증은 가능하지만 앱 전체가 사용하는 기초 스키마·세션/Auth/PIN/권한/RLS·RPC 전부를 동일 QA 환경에서 재현/검증하지 못함. 근무모아 운영 프로젝트나 기존 타서비스 프로젝트 DB를 QA로 전용·복제하지 않는다.
2. **핵심 계약 위험 미해결.** `admin_cancel_personnel_batch_v2`는 프런트에서 원래 본 batch revision을 서버로 전달하지 않음. `preview_data_restore_v2` 개인/관리자 범위의 서버측 검증 및 preview→실행 중 원자적 권한/revision 검증 필요. `save_my_long_service_profile_v2` 제외기간 기존 ID 보존/연계 테이블 영향은 후보 SQL과 UI 전송계약이 어긋나서 차단. 휴근 토글은 QA에서 버전된 읽기·4인자 CAS를 검증했으나 운영 `main`은 여전히 구형 2열 읽기/3인자 쓰기이므로 승인된 일괄 버전 전환이 필요. 기존 쓰기 경로가 새 CAS를 우회하지 않도록 해야 함.
3. **`EXIT_CRITERIA.md` / `E2E_RUNBOOK.md`의 P0 5종, P1 3종 전체 수용 테스트 미완료.** P0: Chrome 동일출처 2탭/Web Locks·로그인 전환, 휴근↔공휴일/정비 SQL 동시성, 두 관리자 정비 revision 경합, 근태 CAS·계정 권한 변경, 관리자 PIN/백업 복원 지연 경합. P1: Android/iOS 카메라/BFCache, Realtime 재연결/권한 전환, 연차·교대·대정비·인사 일정 UI/DB 일치.
4. **HIGH 5종 실제 E2E 재검증 미완료.** `3-8-5-001`, `3-8-10-001`, `3-8-11-001`, `3-8-30-001`, `3-8-32-001`. 기존 3-8-46/47의 mock/source 기반 2회 CLEAN이나 토글 20/20만으로 종합 CLEAN 승격 불가.
5. 공개 `qa-3-8` 수정사항은 운영 `main`과 의도적으로 분리됨. 실제 운영 직원 DB의 행·인증/지문사진을 사용한 시험 및 별도 승인 없는 운영 SQL/함수/프런트 배포 금지.

## 4. 권고한 다음 *실질 작업* (불필요한 QA 블록 증식 금지)

- 3-8-54 번호는 열지 않고 위 14종의 우선순위·기능 의존관계, 특히 관리자 인사 취소의 versioned CAS 및 복원/미리보기 권한 경계를 먼저 설계·검증.
- 9종 기존 합성 검증 결과는 재활용하되 실제 전체 앱의 사용자 흐름/P0·P1과 원본 운영 모델의 차이를 우선 해결. 별도 실행환경의 가짜 직원·가짜 사진만 사용, 합성 로그인과 진짜 Supabase Auth를 혼동하지 않는다.
- QA 전체 실행환경·비공개 구현·민감 권한 경계가 충족되면 **그때만** 3-8-54를 시작해 E2E 증빙 기록. P0/P1 수용 미달 시 3-8-54 미완료, 전체 NOT CLEAN 유지.
- 운영 SQL 설치·`main` 병합·DB 변경/과금은 **사용자의 별도 명시적 승인** 필요. 이 보고서를 작성하는 동안 운영 환경 접근/변경 없음.

**공식 유지:** 3-8-53 완료 / 3-8-54 미시작·보류 / 신규 결함 37 / 운영 최신 RPC 누락 23 / 전체 NOT CLEAN.
