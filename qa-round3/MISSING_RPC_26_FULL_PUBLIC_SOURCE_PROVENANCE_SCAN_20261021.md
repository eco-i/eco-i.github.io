# 근무모아 3차: 누락 RPC 26종 공개 원본 추가 조사 (2026-10-21)

**결론: 현재 접근 가능한 공개 GitHub 및 확인한 과거 SQL에서는 최신 26종 구현 원본 0건.** 실제 SQL 복구·운영 배포·실직원 DB 접근/쓰기 0. 전체 E2E NOT CLEAN.

## 실제 검사 범위 및 증거

- GitHub API에서 브랜치 **29개, 서로 다른 HEAD 커밋 22개**를 확인. 운영 main, 검수 qa-2-8/qa-3-8, 2026-10-17~18 백업·기능 브랜치의 트리와 SQL 경로 비교.
- 현행 운영 SQL 마이그레이션 **16개**에서는 누락된 26개 함수의 정확 명칭 출현 **0개**(선행 blob 단위 확인). 과거 기능 브랜치에만 있는 **업데이트 내역 관련 SQL 2개**도 추가 확인했지만, 26종과 무관.
- 세 브랜치 main, qa-2-8, qa-3-8의 Git 추적 SQL·Markdown·JavaScript·CJS·JSON·HTML 등 텍스트 **1,210개**를 실제 Node 스캐너로 검색. 대상: CREATE FUNCTION 또는 CREATE OR REPLACE FUNCTION 형태의 누락 RPC 정확 이름 26종.
- **[최종 GitHub Actions Run 39570774153 — SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39570774153)**: SOURCE_SCAN_PARSER_SELF_TEST_PASS 및 PUBLIC_REPO_SOURCE_SCAN_DONE refs=3 textFiles=1210 names=0/26 candidateHits=0.
- 최초 실행 Run 39570556356의 1건 후보는 **검색 프로그램 자체에 들어 있던 가상 save_my_memo_v2 테스트 문장**으로 판명. Run 39570696025에서 파일 경로·줄번호로 오인 원인을 확인하고 자기 파일을 제외한 최종 재실행으로 **후보 0개 확정**. 이전 1건 결과는 회수된 실제 SQL 발견이 아니다.
- 검색 스크립트: [scan-missing-rpc-definitions.mjs](e2e/ci/scan-missing-rpc-definitions.mjs). 자동 검사 설정: [.github/workflows/workmoa-qa-rpc-source-discovery.yml](../.github/workflows/workmoa-qa-rpc-source-discovery.yml). 7일 보존하는 GitHub Actions 결과물은 **함수명·공개 파일경로만**, 함수 본문/비공개 파일/직원 정보 없음.
- 이전 조사에서 비공개 2026-09 SQL 보관본 6개도 정확한 최신 RPC 이름 0건. 해당 보관본의 실제 SQL 본문을 공개 GitHub에 복제하지 않음.

## 확인된 복구 제약

- [현재 26종 호출 인자 계약표](e2e/ci/missing-rpc-recovery-contracts.json)와 [서버 함수명 조사](MISSING_RPC_26_SOURCE_RECOVERY_READINESS_20261021.md)를 유지. 현재 운영 서버 이름 불일치 26종 중 비슷한 구버전 22종 존재, 19종 인자 불일치, 3종은 입력명만 일치/안전성 미검증, 4종은 대응 구버전 자체 없음.
- 구버전으로 자동 우회하면 CAS 동시수정·관리자 PIN·데이터 복원·직원 권한 보장 손상 가능. SQL 임의 조립 및 운영 적용 금지.
- 이 파일 검색은 현재 Git 추적 경로와 몇몇 과거 branch HEAD의 확인 범위이며, **모든 삭제된 커밋·연결되지 않은 비공개 백업·실제 운영 DB 정의의 부재를 증명하지 않는다.**
- 누락된 최신 함수 26종은 현재 운영 DB에 없으므로 함수 본문을 그곳에서 직접 추출할 수는 없다. 재구현을 위해서는 기존 서버 함수 정의/권한·스키마·RLS를 추가 분석하고, **실제 직원 데이터와 완전히 격리된 QA PostgreSQL/PostgREST**에서 검증할 필요가 있다.
- 종전 운영 DB 읽기 승인 범위는 **함수명·인자·시스템 카탈로그 메타데이터**까지였다. 기존 서버의 **함수 구현 본문·RLS 정책식·테이블 구조를 추가로 읽으려면 사용자 별도의 명시적 승인 필요**. 승인 전에는 조회하지 않으며 승인 후에도 본문을 PUBLIC GitHub/Actions에 게시하지 않는다.

## 공식 상태

- main HEAD 6c784210e048426f18a486d5602652626d97574d 유지.
- 공식 마지막 완료 **3-8-53**; 다음 **3-8-54 미시작·보류**; 3차 누적 신규 제품 결함 **37종 유지**.
- 최신 26종 실제 서버 복구 0, 풀스택 E2E 미완료, 운영 배포 0, 서버 릴리스 차단 RED 유지.
