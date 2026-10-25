# 근무모아 인사관리 공유 revision CAS 검수본 동기화 — 2026-10-25 KST

> **대상은 QA 브랜치 `qa-3-8`뿐이다.** 3차 공식 블록 `3-8-54`는 미시작, 전체 종합검수 `NOT CLEAN`, 운영 배포 보류.

## 범위 및 근거

- 운영 `main` 기준 commit: `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb` (`ver20261024-1529`).
- 이전 QA HEAD: `5c00be5afe38691750e9c475448e594c9115a541`; 검사한 `index.html` blob `c81e811e44a39b2087a782a2318d4685c6dc967c`.
- 제품 코드 동기화 QA 커밋: [`47fc11f`](https://github.com/eco-i/eco-i.github.io/commit/47fc11f65988e1882ddce73baa2481f00d304d3f).
- 정적 검수 시나리오 갱신 QA 커밋: [`f35b8fe`](https://github.com/eco-i/eco-i.github.io/commit/f35b8fe1fc58f37a483b43bad62a6c7b460178b9). 처음 추가한 test 변경(`6c27688`)에 있었던 오래된/과도한 정규식 단언은 바로 정정했으며, **최종 f35b8fe 성공 결과만 통과 증거**로 사용.

### 실제 변경 내용

1. `admin_set_employee_account_status_v3`: 기존 `p_expected` 보존, 관리자 화면 열기 시점의 공유 `p_expected_revision` 확보 및 저장 전에 유효성 확인; 오래된 서버 버전 충돌 안내.
2. `admin_apply_personnel_batch_v3`: 기존 개별 snapshot `p_expected` 보존 + 열린 편집기의 공유 `p_expected_revision` 전달, CAS 충돌 처리.
3. `admin_cancel_personnel_batch_v2`: 이전 QA에서 추가한 **배치 자체 `batch_revision` 유효성 검사와 최신 배치 재조회**를 그대로 보존; 공유 revision 획득 + `p_expected_batch:expected`, `p_expected_revision:vRev`를 함께 전달. 이전 배치/복구 revision 거절 안내 유지.
4. 공유 revision 읽기 헬퍼 `get_personnel_restore_revision_v1`의 읽기 실패/잘못된 응답 시 **저장 중단** 및 재열기 안내 조건을 QA에 맞춤.
5. QA 고유의 초안 보존·사진 처리·구현 보완은 유지. **운영 버전 값을 QA에서 운영 배포한 것으로 위장해 바꾸지 않음.**

## 실제 GitHub Actions 검수 결과

| 범위 | 실행 증거 | 결과 |
|---|---|---|
| 인사발령 취소, revision 범위/형식, ABA·snapshot 보존, 공유 CAS 요청, 오류 닫힘 — QA source-scoped | [Run 40155795728](https://github.com/eco-i/eco-i.github.io/actions/runs/40155795728) (`f35b8fe`) | **22/22 PASS, 0 FAIL** |
| 사진/초과근무·읽기 잠금·응답 순서 역전 — 격리 Chromium + 폐기형 PG | [Run 40155654981](https://github.com/eco-i/eco-i.github.io/actions/runs/40155654981) (`47fc11f`, 동일 제품 HTML; 후속 커밋은 정적 테스트 스크립트만 변경) | **35/35 PASS, 0 FAIL**: full 15, readiness 10, overlap 10 |
| 단일 Chromium 가상 로그인·가상 PostgreSQL 근태 저장/재조회·메모 오류·휴일근무·초과근무 안내 | 제품 코드 커밋 `47fc11f`의 GitHub Actions | 각 범위 **SUCCESS** |
| RPC historical static integrity gate | [Run 40155653640](https://github.com/eco-i/eco-i.github.io/actions/runs/40155653640) | **RED**: 과거 `main` commit 잠금과 최신 운영 버전 불일치, 임의 PASS 처리 금지 |
| RPC live snapshot release block | [Run 40155653755](https://github.com/eco-i/eco-i.github.io/actions/runs/40155653755) | **RED**: 10월 21일 누락 26종 시점의 스냅샷. 이후 운영 23종 복구가 기록되었지만 이 워크플로에서 최신 Supabase 재실측 **안 함** |

### 범위 제한

- 22개는 **정적/분리 소스 단위** 시험이며 실제 2관리자 동시 클릭, PostgREST/Auth/RLS/원본 배치 SQL 전체 E2E 아님.
- 35개는 **격리 합성 Chromium + PostgreSQL** 시험이며 실제 Android/iOS picker, 실사원 로그인, Supabase Realtime, 원본 RPC 전체 E2E 아님.
- 이 변경은 **서버 함수 설치나 권한 변경 아님**. 백업·복원·초기화 3 RPC (`admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2`)는 지원 조사 대응과 무관하게 설치·실행하지 않았다.
- 운영 `main` HEAD `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb` 직접 재확인, 원본 직원 DB 변경 및 운영 배포 **0**.
- 인수인계 기준 복구 **23/26 (88.5%)**, 공식 3차 마지막 **3-8-53**, **3-8-54 미시작**, 결함대장 **37종**, **전체 NOT CLEAN** 유지.

## 다음 단계

- 독립 가상직원 QA 서버/원본 계약에 상응하는 2관리자 revision·권한·실브라우저 통합 환경이 제공 가능한지 확인하고 P0 검수 시나리오의 실행 가능성과 차단 사유를 구분.
- 지원 답변 전 남은 운영 관리자 RPC 3종의 설치/권한 변경/마이그레이션 반복 금지.
- 3-8-54는 진입 조건 충족 이후 공식 개시. 새 브랜치·새 기록에서 과거 26종 snapshot을 현재 설치 현황으로 오인하지 말 것.
