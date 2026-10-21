# 근무모아 — 26종 RPC 복구 계약 보호 자동검수 실제 실행 증빙 (2026-10-21)

> **정적 안전 게이트 PASS / 실제 서버 함수 설치·기능 E2E NOT CLEAN / 배포 BLOCKED.**
> 작업 범위: `qa-3-8` 브랜치의 공개 호출 계약 확인 자동화만. 운영 `main`, 실제 Supabase SQL·직원 DB·세션·지문기록 **접속/변경 없음**.

## 실제 통과
- [GitHub Actions Run 39569094304](https://github.com/eco-i/eco-i.github.io/actions/runs/39569094304) — **completed/success**.
- Node 22, 저장소 자격증명 비저장 read-only checkout 2개, SQL/DB 권한·비밀키 없이 실행.
- 성공한 작업: `node --check`, 파서 정상/음성 자기시험(필수 동시수정 인자 삭제 시 탐지, 구버전 이름 변경 시 탐지), 운영 `main` commit+Git blob 변동 여부 확인, QA↔운영 26함수/31개 직접 호출 위치와 인자 계약 비교, 비민감 결과 artifact 생성.
- 새 정적 보호기: [rpc-recovery-integrity-gate.mjs](e2e/ci/rpc-recovery-integrity-gate.mjs).
- 워크플로: [workmoa-qa-rpc-recovery-integrity.yml](../.github/workflows/workmoa-qa-rpc-recovery-integrity.yml).
- 기준 인자명 및 위치: [missing-rpc-recovery-contracts.json](e2e/ci/missing-rpc-recovery-contracts.json).
- 결과 artifact: `workmoa-rpc-recovery-static-contract-only`, 7일 보존. 현행 manifest는 실제 서버 함수 **본문이 아닌** 공개된 앱 인자명 및 서버의 존재·구버전 인자명 메타데이터만 포함.
- 새 검증이 PASS이더라도 **실제 서버 함수 26종 이름 불일치용 별도의 릴리스 차단 게이트는 RED**이며 우회하지 않음.

## 원본 추가 추적 결과 / 엄격한 한계
- 공개 저장소의 SQL/RPC 관련 GitHub commit 검색을 추가 수행했다. 검색에서 확인된 DB 변경 커밋들은 예를 들어 사내 사이트 업데이트 내역 RPC migration, 초과근무 `v2` 수정이었으며, **미설치 26종 최신 구현 본문이 확보되었다는 증거는 얻지 못함**. GitHub 검색/공개 파일 범위에 한정되며 삭제된 모든 과거 commit의 완전한 전수 조회가 아니다.
- 기존 상세 감사에서 실제 운영 서버 이름 기준 **26종 미설치**, 이름 유사한 과거 함수 **22종**, 이 중 인자 이름·수 불일치 **19종**, 이름만 일치 **3종**, 같은 기본 이름의 구버전도 없는 경우 **4종**. 인자만 같아도 권한/CAS/반환값이 같다는 뜻 아님.
- 구버전 SQL 함수가 누락된 `p_expected`, `p_expected_revision`, `p_expected_updated_at` 등의 CAS 인자를 지원한다는 증거는 없음. 단순 우회·대체 금지.
- 최신 원본이 없기 때문에 **실제로 실행 가능한 서버 복구 SQL은 만들어 설치하지 않음**. 기존 검사 통과를 복구 완료로 서술하지 않음.

## 실제 운영·공식 상태
- 정규 검수 **마지막 완료 3-8-53**, 다음 **3-8-54 미시작/보류**.
- 공식 3차 누적 신규 제품 결함 **37종** 유지.
- `main`/실 직원 DB/운영 Supabase·RPC/운영 배포 변경 0.
- 다음 실질적 진전: 승인된 비공개 경로에 최신 26종 구현 원본/검증 가능한 스키마·권한·동시성 계약 확보 → 실제 운영과 완전히 분리된 진짜 PostgreSQL/PostgREST/인증·RLS E2E 수행 → 안전성과 복구 시나리오 확인 → 최종 사용자 배포 승인.
