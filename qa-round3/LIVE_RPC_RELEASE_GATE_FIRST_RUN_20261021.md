# 근무모아 — 운영 RPC 배포 차단 자동검사 첫 실증 결과 (2026-10-21)

> **이 검사는 제품 E2E PASS가 아니라 배포 위험을 놓치지 않는 검수 가드다.**
> USER-APPROVED READ-ONLY live server catalog snapshot만 참조. **GitHub Actions 자체는 실제 Supabase 네트워크 호출·인증·직원 데이터·운영 DB·원본 SQL 본문 사용 0**.

## 결과 (GitHub Actions Run #39540136579)
- [실행 근거](https://github.com/eco-i/eco-i.github.io/actions/runs/39540136579)
- QA branch: `qa-3-8`; 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d`를 별도 **읽기 전용 checkout**하여 앱 RPC 정적 대조.
- **Node 소스 파서 자체 시험 PASS**, QA 체크아웃 PASS, 운영 소스 체크아웃 PASS, API 명단/직접 호출 위치 대조 PASS, sanitized names-only 결과 artifact 생성 PASS.
- 승인받아 확인한 2026-10-21 서버 함수명 스냅샷 기준: **프런트 호출명 80 / 실제 설치 이름 54 / 부재 이름 26 / 운영 코드 직접 호출 31개소**를 정확히 재현.
- Artifact `production-rpc-contract-name-inventory-only` (크기 약 1.1KB 압축, 7일 보존)은 **이름·공개 소스 위치·비민감 상태 플래그만 포함**. 원본 SQL/DB 행/실 직원/보안키/정책식 업로드 0.
- 마지막 `Fail CLOSED on confirmed API contract mismatch (expected red gate)` 단계가 **예상대로 FAILURE**, 따라서 GitHub Actions 전체가 **red/failure**인 것은 의도된 릴리스 차단이다. 도구 실행 자체 실패가 아님.
- releaseApproved=false / realAuthenticatedE2EVerified=false / full app NOT CLEAN.

## 생성된 QA 코드
- [계약 스냅샷](e2e/ci/live-rpc-contract-snapshot.json): 승인된 읽기 전용 `pg_catalog`에서 나온 *이름 존재 여부*만 고정, 7일 후 만료되며 서버 상태 변경 또는 운영 main SHA 변경 시 자동 FAIL CLOSED.
- [자동감사 스크립트](e2e/ci/live-rpc-contract-gate.mjs): `index.html`/별도 JS의 `rpc`·정적 fallback 이름 추출; main와 QA 비교; 누락 함수 직접 호출 검사; 외부 서비스 호출 없음.
- [독립 GitHub Actions 워크플로](../.github/workflows/workmoa-qa-live-rpc-contract.yml): QA 브랜치 경로 변경 시 자동 실행, source+snapshot 조회, fail-closed 출력. 브랜치/저장소 조건 고정, checkout credential 저장 금지, contents read 권한만.
- workflow는 신규 제품 기능 구현이나 26개 실제 SQL 함수 복구가 아님. **기존 구버전 함수로 임의 자동치환하면 CAS·업데이트 충돌 보호가 보장되지 않음**.

## 실제로 릴리스 게이트를 해제하려면
1. 26개 최신 RPC 구현의 정본·기능명·매개변수·반환값·세션/권한 검사·CAS/잠금/감사 정책을 비공개로 확보 또는 별도 설계·검증한다.
2. 테스트 전용 synthetic 사용자·DB에만 적용하여 실제 PostgreSQL + PostgREST + 브라우저 2계정 경쟁검증; 실제 운영 DB/직원 정보 사용 금지.
3. 승인된 별도 변경 계획과 최종 배포 허가 후에만 실제 운영 DB를 수정한다. 수정 후 **새로운 읽기 전용 서버 catalog 스냅샷을 사용자 승인 범위 내 재실측**하여 CI를 갱신한다. **스냅샷을 문구만 수정해 CI 녹색으로 만들면 절대 안 됨**.
4. 확인된 함수명 계약 0건 불일치 + 핵심 인증/권한/동시성/P0·P1 실제 E2E 증빙이 모두 확보된 경우에만 릴리스 승인 검토.

## 공식 상태
- **3-8-53** 마지막 정규 완료, **3-8-54 미시작/보류**, 3차 신규 결함 **37종 유지**.
- `main` SHA 변화 없음; 운영 Supabase/직원기록/실근태·세션·사진·실 SQL 변경 0. 위험 해소와 QA 문서 작성은 동의어가 아님.
