# 근무모아 3차 깊이8 — 3-8-54 진입 준비 점검 (2026-10-25 KST)

> **공식 블록 3-8-54는 아직 시작하지 않았다.** 이 문서는 2026-10-25 고객센터의 추가 증거 요청을 충족한 뒤 수행한 **QA 전용 읽기 중심 사전점검**이다. 전체 3차 판정은 **NOT CLEAN**, 운영 배포는 **보류**.

## 1. 확인된 브랜치와 최신 실제 검수

| 구분 | GitHub 직접 확인 결과 |
|---|---|
| 운영 브랜치 | `main` HEAD `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb` |
| 검수 브랜치(점검 시작 기준) | `qa-3-8` HEAD `60bd3751642075895c3d3126822eb517a1a9f6c0` |
| 과거 RPC 계약 스냅샷이 고정한 운영 HEAD | `6c784210e048426f18a486d5602652626d97574d` (현재와 다름) |
| 운영 main의 추가 커밋 | `9052b00` 1건, 인사관리 5-RPC shared CAS 및 버전 갱신, `index.html` 변경 |
| QA 35회 반복 검수 | [Actions Run 40151311002](https://github.com/eco-i/eco-i.github.io/actions/runs/40151311002): **35/35 PASS**, 합성 브라우저/격리 PG 범위 한정 |
| 공식 3차 상태 | 마지막 **3-8-53**, 다음 **3-8-54 미시작**, 신규 결함 **37종**, **NOT CLEAN** |

이 표는 신규 실서비스 E2E 결과가 아니다. 브라우저 합성 시험의 서버 구현은 원본 전체 서버와 동등하다고 주장하지 않는다.

## 2. 자동계약 게이트 2개가 RED인 직접 원인

### A. [RPC recovery static integrity Run 40103630683](https://github.com/eco-i/eco-i.github.io/actions/runs/40103630683)

- 파서 self-test PASS 후 `FAIL_CLOSED_RPC_RECOVERY_CONTRACT: production main commit drift`로 중단됨.
- `missing-rpc-recovery-contracts.json`의 잠금 기준은 과거 운영 커밋 및 **과거 서버 이름 누락 26종/호출 31곳**이다.
- 10월 24일 운영 인사 RPC 5종의 CAS 인자 확장으로 실제 운영 프런트엔드와 기존 스냅샷의 일부 입력 계약도 다르다.
- **게이트 실패를 QA 제품 기능 회귀 실패로 단정하지 않는다.** 기존 잠금을 임의 갱신하거나 완화해 PASS 처리하지 않는다.

### B. [Live RPC catalog snapshot release gate Run 40103630711](https://github.com/eco-i/eco-i.github.io/actions/runs/40103630711)

- 파서 self-test PASS 후 `PRODUCTION_MAIN_CHANGED: existing snapshot must not be used as current evidence.`로 중단됨.
- 스냅샷 `live-rpc-contract-snapshot.json`은 2026-10-21의 서버 이름 누락 **26종** 기록이다. 이는 이후의 23종 복구를 반영한 *최신 실측값이 아니다*.
- 현재 업무 인계상의 복구상태 **23/26(88.5%)**와 과거 스냅샷의 **26종 누락**은 관측 시점이 다르다. 신규 서버 실측을 실행했다고 주장하지 않는다.
- 이 fail-closed 메커니즘은 릴리스 차단 용도로 유지한다. 이름 전용의 별도 최신 증빙 없이 과거 26을 3으로 임의 변경하지 않는다.

## 3. 실제 main ↔ QA 프런트엔드 계약 차이

두 브랜치의 `index.html` Git blob을 직접 읽고, 정적인 RPC 호출의 입력 키를 비교함.

| RPC | 운영 main의 입력 계약 | QA의 입력 계약 | 의미 |
|---|---|---|---|
| `admin_set_employee_account_status_v3` | `p_expected` 및 `p_expected_revision` | `p_expected`만 | main의 revision CAS 확대가 QA에 미반영 |
| `admin_apply_personnel_batch_v3` | `p_expected` 및 `p_expected_revision` | `p_expected`만 | main의 revision CAS 확대가 QA에 미반영 |
| `admin_cancel_personnel_batch_v2` | `p_expected_batch`, `p_expected_revision` | `p_expected_revision`만 | main의 배치 스냅샷 CAS가 QA에 미반영 |
| `admin_restore_personnel_snapshot_v3` | `p_expected_revision` | `p_expected_revision` | 이름/이 키만 기준으로 일치 |
| `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` | 호출코드 존재 | 호출코드 존재 | 실제 서버 설치/권한 시험 금지 상태 |

**결론:** 현재 QA 앱을 그대로 테스트해서 운영 인사관리 최신 5-RPC 변경이 종단 간 검증되었다고 주장하면 안 된다. 먼저 QA-only 프런트엔드 코드와 테스트 fixture의 입력 계약을 최신 main 기준으로 재조정하고, 이전 QA의 독립 수정과 충돌하지 않는지 회귀시험해야 한다. 운영 main에 QA 코드를 덮어쓰지 않는다.

## 4. 3-8-54 공식 시작 전 위험 기반 E2E 진입 조건

| P0/P1 | 범위 | 이미 있는 부분 증거 | 공식 E2E 충족 여부 |
|---|---|---|---|
| P0 | 동일 출처 2탭 / 로그인 전환 / Web Locks | 원본 HTML Chromium 합성 로그인 UI PASS (단일 탭/가상 API) | **미충족**: 실제 2탭 세션 소유권 및 서버 권한 검증 |
| P0 | 공휴일·휴일근무 ↔ 편성 SQL 동시성 | 폐기형 PostgreSQL 합성 SQL 경합 일부 PASS | **미충족**: 운영 동등 원본 스키마/RLS 및 전체 앱 |
| P0 | 두 관리자 대정비 revision 경쟁 | 소스 격리·합성 SQL 부분 증거 | **미충족**: 완전한 2인 E2E |
| P0 | 근태 CAS/readonly/disabled 변경 | 가상 직원 근태 저장·재조회, 사진·초과근무 35/35 PASS | **미충족**: 동시 권한 취소 및 원본 서버 계약 |
| P0 | 관리자 PIN/백업·복원 지연/세션 경합 | UI PIN 게이트/코드 범위 검수 | **미충족**: 특히 복원/초기화 3 RPC는 고객센터 기술 조사 전 설치·실행 금지 |
| P1 | Android/iOS 네이티브 사진 picker/PWA | Chromium 합성 이미지 사용 | **미충족**: 실기기 없음 |
| P1 | Supabase Realtime 재연결/읽기 최신성 | 가상 브라우저 느린 응답·초안 보존 일부 PASS | **미충족**: 실제 QA Supabase Realtime |
| P1 | 연가·교대·정비·인사 UI/DB 일치 | 개별 합성 일정/근태 SQL 및 UI 시험 | **미충족**: 통합 앱 및 원본 계약 |

진입 게이트:
1. 운영 `main`의 인사관리 CAS 보강과 QA-only 수정의 차이 조정 후 독립 회귀검수.
2. **실제 운영 프로젝트와 완전히 분리된**, 가짜 직원만 있는 원본 동등 QA 스키마·RPC·RLS와 실제 브라우저 연결 여부 확인. 합성 게이트웨이 PASS는 범위에 명시.
3. 3-8-54에서 실행할 P0 최소 시나리오, 증빙 기준과 실패 시 중단조건 확정.
4. 권한 우회, 지원 응답 전 남은 3 관리자 RPC 설치/실행, 기존 V1 실행권한 변경, 실제 직원 데이터 사용, 운영 `main` 병합/배포 모두 금지.

## 5. 고객센터 대응과 병행하는 다음 안전한 작업

- **즉시 가능한 작업:** QA-only 코드와 최신 main의 인사관리 프런트 계약 비교·정합화 설계 및 변경영역별 격리/Chromium 회귀 준비; 추가 실제 테스트가 없다면 완료/PASS라고 하지 않음.
- **지원 응답 대기 작업:** `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` 및 기존 V1 권한 전환. 2026-10-25 고객센터의 요청에 따라 원래 대화 URL 및 두 스크린샷 제출 완료.
- **공식 3-8-54:** 위 E2E 진입 조건이 실제로 충족된 경우에만 시작하고, 이미 PASS된 합성 검수를 무의미하게 반복하지 않는다.

### 이번 작업의 판정
**54 진입 사전감사 완료 / 54 공식 미시작 / 서버 복구 23/26 보고상 유지 / 운영 데이터·기존 RPC 권한·main 변경 0 / 전체 NOT CLEAN.**
