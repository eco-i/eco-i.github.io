# 3차 깊이8 · 인사발령 취소 revision CAS QA 보강 — 2026-10-22

**공식 판정: QA 클라이언트 소스/계약 범위 PASS, 실제 취소 서버 E2E BLOCKED, 3-8-54 미시작·전체 NOT CLEAN.**

## 실제 원인과 수정

- 운영 `main` 인사발령 취소 RPC `admin_cancel_personnel_batch_v2`는 `p_token,p_batch_id` **2인자**만 전송. 최신 list를 취소 직전에 다시 조회·검사하더라도 조회 후 쓰기 사이 변경을 DB 트랜잭션 내에서 막는 expected 값이 없음.
- `qa-3-8/index.html`에서만 서버 `list_personnel_assignments` 반환의 선택적 `batch_revision`을 정밀 검사하도록 추가. 유효한 비음수 JS safe integer가 제공되면 발령별 일관성을 확인하고 snapshot에 포함. 잘못된 revision 또는 같은 발령의 행끼리 불일치하면 읽기 거부.
- QA 온라인 발령 취소 시 revision이 없으면 **확인창/변경 RPC를 실행하지 않고 잠금**. 정상 버전은 최종 `p_expected_revision`으로 보내 서버 CAS 강제를 요구. 최신 목록 재조회·현재 관리자 세션·대기중 취소 보호는 유지. `STALE_PERSONNEL_BATCH` 등 충돌 안내 추가. 로컬 비서버 모드는 기존 경로 유지.
- 기존 출처가 제공하지 않는 필드를 가짜 0으로 생성하거나, 2인자 레거시 취소 경로로 fallback하는 코드 **추가하지 않음**.
- `qa-round3/e2e/ci/rpc-recovery-integrity-gate.mjs`: frozen 운영 `main`의 **26종 원래 이름/31곳 호출과 원 인자**는 그대로 유지하고, QA 한정 `admin_set_holiday_work_enabled_v2` 및 `admin_cancel_personnel_batch_v2` **정확히 두 호출의 필수 `p_expected_revision` 추가만 허용**. 나머지 24개 계약은 동일. 예전 26종 자료는 과거 이력이며 운영 현재 누락 23종과 혼동 금지.

## 실제 GitHub Actions 수행

- [인사발령 취소 QA runtime/source 계약 Run 39752387949](https://github.com/eco-i/eco-i.github.io/actions/runs/39752387949) job `119735882065` **SUCCESS, 19/19 PASS**. 버전0, 옛 반환/잘못된 정수/동일 발령간 버전 불일치, snapshot ABA·실질 수정 검출, 취소 전 가드, RPC 필수 인자·서버 stale 안내 등을 분리 점검.
- 첫 Run [39752256238](https://github.com/eco-i/eco-i.github.io/actions/runs/39752256238)는 테스트 하네스 정규식 이스케이프 문법오류로 FAIL. 테스트만 고쳐 최종 성공. 앱 실동작 서버 시험으로 승격하지 않음.
- [frozen main 정적 RPC 계약 Run 39752081840](https://github.com/eco-i/eco-i.github.io/actions/runs/39752081840) **SUCCESS**, QA 예외 2건 외 기존 호출 계약은 fail closed.
- 기존 메모·휴근 UI·합성 근태 등 회귀 워크플로는 인사 QA 변경 직후 실행되어 각 범위 SUCCESS 확인; 다른 테스트는 해당 구현의 실 서버 동등성 주장 불가. 기존 배포 차단 release 게이트의 의도적 RED는 현재도 유지.

## 검증 경계/실제 차단

- 실제 운영 `list_personnel_assignments`는 `batch_revision` 제공 여부를 새로 검증하거나 변경하지 않았음. 따라서 **현재 QA 온라인 취소 UI는 revision 필드가 없으면 의도적으로 차단**되고 실제 성공 E2E는 0. 운영 `main` 사용자는 기존 동작 그대로(변경 없음).
- 운영 실서버에 CAS 구현, 발령 DB revision 열/트리거/UPDATE 권한, 관리자 PIN/RLS·Auth 보안 검증, 두 관리자 PostgREST 동시취소·감사 원자성이 미완료. UI revision 전달만으로 실제 SQL 충돌 방지 완료가 아님.
- SQL은 발령 note/직원 action/계정상태 수정, 취소, 백업복원 등을 포괄해 revision 증가 및 안전한 epoch/generation 유지가 필요. **서버 상세 수용조건은 비공개** `ahnbest23-hash/workmoa-backend-private/PERSONNEL_CANCEL_REVISION_CONTRACT_GATE_20261022.md`에만 작성. 개인 자료/SQL 본문/키 공개 업로드 없음.
- 사용자 별도 승인 없는 운영 SQL·DDL/RPC 설치/직원 DB 변경/운영 `main` 병합 금지.

**현재 공식값 불변:** 마지막 3-8-53 / 다음 3-8-54 미시작·BLOCKED / 3차 제품결함 37 / 운영 서버 누락 RPC 23 / 종합 NOT CLEAN.
