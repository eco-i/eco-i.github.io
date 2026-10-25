# 근무모아 3차·깊이8 — 독립 QA 기초 테이블 부트스트랩, 첫 실제 PostgreSQL 성공

**2026-10-25 KST** · **공식 3-8-54 미시작 / NOT CLEAN**  
**성공한 실행:** [GitHub Actions Run 40161115933](https://github.com/eco-i/eco-i.github.io/actions/runs/40161115933) / workflow HEAD `866e2d230372ff8add484fafd70e671749f44234` / job `121072695250` **SUCCESS**.

## 달라진 점 — 실제 실행 가능한 코드 추가

- `qa-round3/e2e/ci/build-qa-table-shells.py`:
  - 공개 저장소에 **실제 비공개 catalog 데이터는 복제하지 않고**, 입력 파일로 제공받은 읽기 전용 column metadata를 검증하여 **새 이름 `workmoa_synthetic_qa` 스키마만 대상으로** 빈 CREATE TABLE 문을 생성.
  - SQL을 **생성만** 하고 연결/실행하지 않는 Python 표준 라이브러리 프로그램. 출력에 운영 프로젝트 ID·함수 원문·데이터·세션·PIN·비공개 해시를 쓰지 않음.
  - 테이블·칼럼 식별자 검증, 12개 PostgreSQL 데이터 타입 allowlist, 서명 불명 객체·저장 row 입력 거절, 최대 크기 제한, identity 구조 구분.
  - 원본 default 표현식이 MD5만 있는 항목은 재구성 불가능하므로 **기본값을 추측하지 않음**. 원본 FOREIGN KEY, CHECK, index, trigger, RLS policy, Auth, 함수 ACL·SQL 본문 등은 생성하지 않음.
  - 생성 SQL은 스키마 공개 사용권한 REVOKE, 모든 테이블 ENABLE RLS + FORCE RLS 및 PUBLIC 테이블 권한 REVOKE, **운영/공개 public 테이블 CREATE 없음**.
  - **운영 배포용 스키마/마이그레이션이 아님.**
- `.github/workflows/workmoa-qa-empty-table-shells.yml`:
  - **오직** `eco-i/eco-i.github.io:qa-3-8`에서 실행. 실제 클라우드 URL/비밀번호 환경 변수 금지, GitHub Actions PostgreSQL16 disposable service의 `127.0.0.1` 포트만 사용.
  - 인위적으로 만든 비식별 2개 테이블/4개 컬럼 fixture로 실행 시험: **CREATE TABLE 2건 / 컬럼 4개 / 양쪽 강제 RLS / 공개 테이블 생성 0건 / PUBLIC·anon·authenticated GRANT 0건 / PASS.**
  - `QA_TABLE_SHELL_SELFTEST_PASS 9 checks`; `EMPTY_SHELLS_PG_PASS 2 synthetic tables, 4 columns, forced RLS, zero public tables/grants`.

## 비공개 읽기 전용 구조 메타데이터와의 **정적 입력 적합성 검사**

비공개 서버 저장소 `ops/production-schema-baseline-20261024/catalog-metadata.json`을 GitHub에서 **읽기만** 확인. 원본 파일을 공개 QA 저장소/CI에 복제하지 않음. 함수 본문/테이블 행/직원 토큰/PIN 접근 없음.

| 항목 | 결과 |
|---|---|
| 구조 기록의 테이블 수 | **28개** |
| 컬럼 수 | **190개** |
| 구조 identity 정보 | **13개** |
| 실제 기본값 표현식이 없고 해시만 있는 컬럼 | **72개** |
| 확인된 컬럼 데이터형 | allowlist **12종** 안에 전부 포함 |
| generator에 전달 가능한 허용 field/schema/type/identifier 검사 | **정적 28/28 및 190/190 적합, 예외 0** |
| 실제 PostgreSQL에 실행한 원본 메타데이터 28테이블 | **0개 — 미실행** |

**정적 28/28은 PostgreSQL 컴파일 PASS가 아니다.** 현재 Actions PASS는 인위적으로 만들어진 2개 테이블/4개 컬럼만을 대상으로 한다. 원본 비공개 JSON을 GH 공개 파일 또는 CI artifact로 올려서 검증했다고 주장하지 않는다.

## 정상 구동까지 아직 부족한 부분

1. 기존 18개의 운영 마이그레이션에서 미확인 24개의 **초기 생성 원문 DDL**은 여전히 필요하다. 구조 metadata를 이용한 빈 table shell은 보안 제약과 business logic을 재현하지 않는다.
2. 원본 default 72개 표현식, PK/FK/CHECK/UNIQUE/index/trigger, RLS policy 정의, FUNCTION 214개의 원본 body/시그니처/ACL, 세션/관리자 2차 PIN/근태/휴일/연차/사진 및 PostgREST 구성의 동등성 검증 불가.
3. 3-8-54를 공식 수행하기 위해서는 **원본 동등 서버에서 P0 검수 PASS**가 필요하다. 이 도구는 독립 QA에서 구조를 읽어 올 최소 안전 기반을 만들었을 뿐 동등 E2E 실행 조건을 아직 충족하지 않았다.
4. 운영 데이터/API/직원 DB 복제·신규 과금 리소스/운영 ACL 변경 금지. 유료 QA 프로젝트나 운영 스키마 추출에 필요한 별도 정상 승인 경로가 확보되기 전 실행하지 않음.
5. 안전 검사 차단된 `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` 운영 설치·실행·GitHub Actions 우회 금지.

## 기준 상태

- 공개 QA 브랜치에만 코드+CI+보고서 반영. 운영 `main` 기존 `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb` 보존.
- 운영 RPC 복구 **23/26=88.5%**(지난 문서의 당시 실측, 이번 운영 서버 조회 아님).
- 종합검수 마지막 완료 **3-8-53**, 다음 **3-8-54 공식 미시작**, 신규 결함 **37종**, 전체 **NOT CLEAN**.
- 다음 작업은 준비 보고서 반복이 아니라, **비민감 원본 DDL을 정상적인 읽기 전용 경로로 확보해 QA-only 환경에서 컴파일·검증**하는 실질적 진입 장애 제거. 현재 연결 수단에는 운영 원본 전체 함수/테이블 DDL 덤프를 제공하는 승인된 전용 추출 기능이 없어 해당 부분은 계속 보류.
