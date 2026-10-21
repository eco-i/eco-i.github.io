# 근무모아 — 실제 PostgreSQL 분리형 CAS 경쟁 시험 (2026-10-21)

**확인 결과: 격리된 GitHub Actions PostgreSQL 17.11에서 두 개의 동시 데이터베이스 연결을 실제로 실행, 테스트 PASS. 단, 근무모아 실서버 26종 RPC/Auth/RLS 검증 PASS는 아님.**

## 실행 근거
- 최초 실 PostgreSQL 시험: [Actions Run 39605818320](https://github.com/eco-i/eco-i.github.io/actions/runs/39605818320) 성공.
- **인사발령 동시 변경까지 확장한 최종 시험:** [Actions Run 39606034883](https://github.com/eco-i/eco-i.github.io/actions/runs/39606034883) **성공**.
- [격리 시험 SQL](e2e/experiments/synthetic-postgres-cas-lab.sql) / [두 연결 경합 실행기](e2e/experiments/run-synthetic-cas-lab.sh) / [실제 PostgreSQL 실행 워크플로](../.github/workflows/workmoa-qa-postgres-cas-lab.yml).
- PostgreSQL 17 서버는 GitHub Actions 일회용 Linux 서비스 컨테이너에서 실행되며, 앱 운영 Supabase와 연결되지 않는다. 실제 직원 데이터·실제 인증·PIN·키·운영 DB의 테이블 구조 0건 사용. 테스트 종료 후 임시 컨테이너 폐기.

## 실제로 검증한 것
1. **인사발령 취소 (결정 공백 1)**: 이미 변경된 revision으로 취소하면 예외 발생/기존 발령 유지. 유효한 revision과 미래 active 발령일 때만 취소 및 감사기록 커밋. 과거 발령 취소는 거부.
2. **휴근 가능 설정 (결정 공백 2)**: `expected_enabled`·`expected_revision`을 제출하는 설계에서 변경된 이전 상태로 요청하면 거부. 동일한 최신값으로 다시 저장할 경우 중복 감사/리비전 증가 없음. 과거 휴일근무 건수 불변.
3. **2개 동시 연결 — 휴근 설정**: 관리자 A 트랜잭션이 행 잠금을 유지하는 동안 B의 예전 revision 수정 요청을 실제로 실행. B는 대기 후 `STALE_QA_ELIGIBILITY` 오류로 거부; A의 커밋, revision, 감사기록 1건, 기존 가상 휴근 기록 보존.
4. **2개 동시 연결 — 미래 인사발령**: 관리자 A가 같은 발령의 적용일/리비전을 변경하며 행 잠금을 유지할 때 B가 오래된 expected revision으로 취소. `STALE_QA_BATCH` 거부, A의 새 적용일·active 상태 보존, 취소 감사로그 0.
5. **원자적 롤백**: 트랜잭션 내 임시 변경 후 ROLLBACK. 자격 없는 추가 변경이나 감사기록이 남지 않음을 SQL assert.

### 승인되지 않은 운영 변경
실험 SQL은 `qa_rpc_cas_lab` 별도 schema에 생성되며 함수 이름도 `qa_rpc_cas_lab.cancel_future_batch` / `qa_rpc_cas_lab.set_eligibility`이다. 이 이름은 **운영 RPC와 다르며, 실제 앱의 API 구현 또는 배포 마이그레이션이 아니다**. 실험에서 `p_expected_revision` 같은 새로운 인자를 사용했다는 사실은 현재 운영 앱과 계약 호환을 의미하지 않는다.

## 실제 복구로 넘어가기 위한 필수 조건
- 현재 `admin_cancel_personnel_batch_v2`는 **클라이언트에서 발령 ID만**, `admin_set_holiday_work_enabled_v2`는 **직원 ID와 목표 설정만** 전달한다. 실험에서 성공한 expected-state 비교를 실제로 사용하려면 클라이언트/서버 합의된 버전 인자를 안전하게 추가하거나 동등한 방식을 증명해야 한다. **이번에 앱 `index.html`을 무단 변경하지 않았다.**
- 운영 기존 26종 SQL 원본 부재·독립 근무모아 QA Supabase 프로젝트 부재·별도 근무모아 비공개 GitHub 저장소 부재(확인 시점). 기존 메이플랜드 등 다른 서비스의 공간을 근무모아 구현 저장 장소로 전용하지 않는다.
- 비공개 서버 구현 소스 저장 위치, QA 프로젝트 조직/비용의 사용자 승인·선택, 26종 실제 구현의 Auth/RLS/EXECUTE/관리자 PIN 검토와 실제 앱 통합 시험이 필요.
- **실험은 PostgreSQL 트랜잭션/경합 설계의 동작 증명일 뿐** 직원 인증, 관리자/본인 권한, 모든 26종 반환 계약, Supabase PostgREST, 실사진 브라우저, 운영 데이터 복구 안전성을 증명하지 않는다.

## 공식 상태
- 작업 대상: `eco-i/eco-i.github.io`의 `qa-3-8`만. `main`·운영 Supabase·실제 직원 DB/근태/지문·운영 배포·비공개 SQL 반출 0.
- 정규 마지막 블록 **3-8-53**, **3-8-54 미시작/보류**, 공식 결함 **37종**, 누락 최신 RPC **26종**, 전체 **NOT CLEAN**. 기존 출시 차단 RED 유지.
