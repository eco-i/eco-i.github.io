# 근무모아 — 누락 RPC 26종의 실제 앱 응답 계약·검증 함수 확인 (2026-10-21)

> **정적 호출 위치 + 운영 UI 원본 검증함수의 격리 입력 시험 PASS. 실제 서버 SQL 구현/설치/E2E PASS 아님. 공식 3-8-53 완료, 3-8-54 미시작, 37종, 전체 NOT CLEAN.**

## 1. 실행 근거
- 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d`, index blob `5553a1d319e3ab7ff4dd6bb8ee7d995657112698` 기준.
- [GitHub Actions 실제 성공 Run 39594553591](https://github.com/eco-i/eco-i.github.io/actions/runs/39594553591) / QA 소스 commit `c3690b5f1c963b0b0236a82d91d6cc9db65e76f5`.
- [함수별 실제 응답 계약 26종](e2e/ci/rpc-recovery-client-response-contracts.json) / [원본 검증 함수를 실행하는 테스트](e2e/ci/rpc-client-response-gate.mjs) / [무료 workflow](../.github/workflows/workmoa-qa-rpc-client-response.yml).
- Actions 로그인/권한/사내 DB에 접근하지 않고 `main/index.html`의 **실제 검증 함수 11종을 격리된 Node VM에서 추출·실행**. 정상·잘못된 응답은 모두 **합성 JSON**. `26/26` 이름과 직접 호출 `31/31` 위치/검증기 연결 확인. 파서·실제 브라우저 인증 기반 full E2E와 다르다.

## 2. 실제 클라이언트가 요구하는 반환값 유형

| UI 원본 validator | 실제 서버 응답이 충족해야 하는 주요 계약 |
|---|---|
| `strictTrueMutationResultRpc` 및 `strictPersonnelTrueMutationResultRpc` | 반드시 JSON Boolean `true`. `1`/`null`/Boolean `false` 불인정 |
| `strictPositiveIdMutationResultRpc` | 양의 정수 ID, 수정 시 기존 ID와 정확히 일치 |
| `strictPersonnelBatchMutationResultRpc` | `batch_id` 양수 ID와 `count`가 요청 인사건수와 일치 |
| `strictPinResetResultRpc` | 숫자 정수, 미리보기 대상 인원 수와 일치 |
| `strictPersonnelRestoreRevisionRpc` | **32자리 16진 문자열** |
| `strictDataRestorePreviewRpc` | 개인/관리자 구분 `backup_type`, 유효 시각, 항목별 3개 정수 카운트와 `current_revision` 32자리 16진값 |
| `strictDataResetPreviewRpc` 및 `strictSafetyRestorePreviewRpc` | 기대한 항목 배열과 `current_revision` 32자리 16진값 |
| `strictPinResetPreviewRpc` | 비음수 정수 `target_count`와 `target_revision` 32자리 16진값 |
| `strictDataMutationResultRpc` | 초기화 `reset: true`, 복원 `restored: true`, 정확한 `section_counts`; 관리자가 만드는 안전백업 ID 및 안전백업 복원의 출처 ID 추가 확인 |

**중요한 발견:** `preview_data_restore_v2` 한 이름을 실제 UI에서 **개인 범위 2곳, 관리자 범위 2곳**에 사용한다. 클라이언트가 `backup_type` 차이를 검증하지만 **서버 측 권한 검증을 대신하지 않는다.** 독립 QA에서 개인이 관리자 백업 내용을 요청하지 못하는지 확인해야 한다.

## 3. 실제 시험 결과 및 차단
- 실제 원본 JS 함수로 정상 입력 수용과 부적절한 Boolean, 잘못된 ID, 불일치 count, 잘못된 revision, 관리자/개인 scope 교차, 음수 카운트, 잘못된 안전백업 source ID 거부를 시험.
- `RPC_RESPONSE_VALIDATOR_EXTRACTION_SELF_TEST_PASS`.
- `RPC_CLIENT_RESPONSE_CONTRACT_PASS: 26 names, 31 callsites, 11 original browser validators, personal/admin preview 2+2`.
- `BACKEND_RECOVERY_STILL_BLOCKED`: 최신 RPC **26종 실제 구현 SQL 0**, 실제 PostgREST/인증·RLS·CAS/E2E 미실행, 릴리스 차단 RED 유지.
- 테스트는 서버 함수의 반환형을 **프런트가 기대하는 형식으로 추론**한 것이지, 실행되는 운영 서버 SQL의 실제 반환값·권한/동작 동등성을 확인한 것이 아님.
- 실제 서버 SQL이나 보안 RLS 원문·직원·PIN·세션·사진·토큰은 GitHub에 추가하지 않음. 운영 `main`/직원 DB/서버 SQL/배포 변경 0.

## 4. 다음 유효 작업
1. 서버 최신 RPC **반환형/오류·보안 계약**을 이번 UI 검증 함수 11종 및 이전 입력 수용표와 정합시켜 비공개 구현 계획으로 연결.
2. 비공개 구현 정본 또는 승인된 신규 구현 경로에서 SQL 작성·독립 QA 서버 통합 시험 준비. 실제 SQL 작성/설치·QA 프로젝트 생성 또는 비용 부담은 **별도 명시적 승인 대상**.
3. 합성 함수 재반복을 전체 E2E로 승격하지 않음. 권한, `SECURITY DEFINER`, RLS, 관리자/PIN, 2세션 CAS, 백업 롤백 검증은 원본이 연결된 실제 격리 환경에서만 인정.

**공식 정규 검수:** 3-8-53 마지막 완료, 3-8-54 미시작/보류, 제품 결함 37종, 전체 NOT CLEAN, 운영 배포 미승인.
