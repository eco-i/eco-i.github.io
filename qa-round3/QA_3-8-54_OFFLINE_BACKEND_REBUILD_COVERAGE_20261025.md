# 근무모아 3차·깊이8 — 오프라인 독립 QA 백엔드 재구성 범위 검수

**날짜:** 2026-10-25 KST · **공식 3-8-54 미시작 / 전체 NOT CLEAN**  
**최종 자동검수:** [Run 40160383202](https://github.com/eco-i/eco-i.github.io/actions/runs/40160383202) — **SUCCESS**, Python parser self-test 9개 PASS, 고정된 소스 범위 baseline 일치 PASS.  
**Git SHA(실행 시):** `e0156d9bec0b93c846bae520eeb0ecfb81c1ca72`.

## 1. 실제 재현 가능한 현재 범위 — 공개 브랜치만 읽음

| 범위 | 재현 가능한 읽기 전용 사실 |
|---|---:|
| `qa-3-8/index.html`의 `rpc('literal')` / `rpc("literal")` 직접 호출 위치 | **105곳** |
| 위 리터럴 RPC 고유 이름 | **71종** |
| `db/migrations/*.sql` 원본 | **16개** |
| 위 SQL에서 정적으로 선언한 고유 `CREATE [OR REPLACE] FUNCTION` | **19종** |
| 프런트 리터럴 RPC 명칭과 선언한 함수명 직접 일치 | **3종** |
| 동일 SQL에서 선언한 함수 정의를 찾을 수 없는 리터럴 RPC 명칭 | **68종** |
| 동일 SQL의 `CREATE TABLE` 선언 고유 이름 | **3종** |
| SQL 텍스트의 `FROM / JOIN / UPDATE / INSERT INTO / ALTER TABLE / DELETE FROM / REFERENCES`에 등장하지만 같은 SQL 세트가 생성하지 않는 관계 이름 | **15종** |

직접 일치한 3종: `admin_set_holiday_work_month_confirmation`, `save_my_overtime_day_v2`, `save_my_overtime_entry_v2`.

공개 SQL에 CREATE TABLE이 있는 3종: `future_holiday_calendar`, `maintenance_schedule_state`, `site_update_history`.

**미정의 관계 참조 15종:** `annual_leave_settings`, `attendance_entries`, `audit_logs`, `company_events`, `employees`, `holiday_work_eligibility`, `holiday_work_entries`, `holiday_work_month_confirmations`, `long_service_exclusions`, `long_service_settings`, `memo_dday_selections`, `overtime_entries`, `personal_memos`, `personnel_account_events`, `personnel_batches`.

위 관계 이름은 공개 SQL에서 나타난 정적 참조만 추린 것으로 **전체 누락 테이블의 완전한 목록은 아니다**. "일치 3종" 역시 배포·컴파일·정상동작을 의미하지 않으며, **RPC 호출의 정확한 서명과 타입 일치도 별도로 미확인**.

## 2. 구축 가능·불가능 항목 분리

- **가능 / 완료:** 공개 파일의 리터럴 RPC/SQL 함수/테이블 선언 목록을 비네트워크 정적 분석. 71/3/68/19/3/15 수치를 자동으로 재계산하고, 정의 이름 또는 개수·원시 호출 위치가 기준점과 어긋나면 **CI FAIL CLOSED**. Python 실행 시 DB 없음, credential 없음, SQL 실행 없음.
- **가능 / 소스만 존재:** 3개 테이블 CREATE와 19개 함수 DECLARATION 텍스트를 보유. **이들이 독립적으로 CREATE 가능한 완결된 schema라는 근거는 없음**: 실제 선언은 기존 함수와 테이블을 호출·참조할 수 있음. 누락된 기반 구조 없이 SQL을 순차 실행하지 않는다.
- **불가능 / 현재 공개 SQL:** 직원·세션 및 관리권한·초기 PIN 검증 함수, 대부분의 출퇴근·메모·사진·인사 SQL, RLS/소유자/권한/trigger까지 포함한 1차 기초 schema의 재현. 현재 공개 증분 SQL만으로 온전한 QA 로그인/근태 저장 E2E 불가.
- **구분:** 비공개 서버 저장소의 기존 운영 시점 metadata는 실제 테이블 28개/함수 214개/컬럼 190개를 설명하지만 **DDL과 개인정보 없이 catalog 속성을 보존한 증거**다. 기존 18개 운영 migration 원문에서 정적 초기 CREATE TABLE이 확인된 것은 4/28개다. 이번 공개 SQL 16개에서 3개 테이블을 찾은 숫자와 분모/출처가 다르므로 섞어서 계산하지 않는다.
- **주의:** 공개 `index.html` 리터럴 `rpc(...)`만 수집한다. 동적 호출, `rpcPrefer*` 래퍼, 다른 스크립트, 서버내 직접 함수 호출, 기존 운영 설치상태 등은 정적 카운트 범위가 아니다. 원본 PostgREST/RLS·세션 검증도 하지 않았다.

## 3. 이번에 추가한 재현 가능한 QA 도구

1. `qa-round3/e2e/ci/audit-backend-rebuild-readiness.py`: Python 표준 라이브러리만 사용, `index.html` 및 `db/migrations/*.sql`을 열어 71/19/3/68/15 집계. `--self-test`는 인메모리 합성 문자열 9개 검사. `--check-baseline`는 동결 snapshot과 완전히 비교해 변경이 있으면 즉시 FAIL.
2. `qa-round3/e2e/ci/backend-rebuild-readiness-baseline.json`: 이전 정적 관측값/매치 함수 3종/테이블 3종/누락 RPC 68종/기초 관계 참조 15종의 고정 기준점. 실제 소스가 바뀌었다면 재점검·명시적 승인 없는 수치 수정 금지.
3. `.github/workflows/workmoa-qa-backend-rebuild-audit.yml`: `qa-3-8`만 실행, Actions 최소 읽기권한, 운영 클라우드 env 차단, `checkout` 외 설치 패키지 없음. GitHub Actions [Run 40160286000](https://github.com/eco-i/eco-i.github.io/actions/runs/40160286000) 최초 기준점 PASS 후, 15종 관계명까지 freeze 확장한 최종 [Run 40160383202](https://github.com/eco-i/eco-i.github.io/actions/runs/40160383202) **SUCCESS**.
4. 이 검사 도구는 저장소 루트의 운영용 파일을 자동 변경하거나 QA SQL을 실행하지 않으며, commit은 `qa-3-8` 브랜치에서만 수행됨.

## 4. 위험 기반 다음 단계

**우선순위 1 — 기초 schema의 비민감 DDL 정본 확보:** 테이블 28개/관계·인덱스·트리거·RLS·함수 214개에 관한 이전 메타데이터가 있으므로, 정식 읽기 전용 스키마 추출 가능 여부와 사용자의 별도 승인·보안 검토부터 확인. 직원 행, PIN, 세션 토큰, 지문 사진, 백업 payload 추출 금지.

**우선순위 2 — 독립 로컬 PostgreSQL 기반 복구성 판정:** 새로 확보한 비민감 DDL은 원본과 시그니처 및 권한 등가성 검증을 거쳐 QA 전용 격리 DB에만 적용. 역사적 18개 원문 마이그레이션을 임의 재실행하거나 운영 이력을 손대지 말 것.

**우선순위 3 — 독립 QA API/Auth/PostgREST/RLS:** 클라우드 프로젝트는 가격·권한 별도 확인 후 사용자 승인 전 생성하지 않음. 가능하면 우선 무료 GitHub Actions의 폐기형 PostgreSQL/PostgREST 환경에서 원본동등 계약을 확인. 운영 Supabase 프로젝트 및 다른 프로젝트 재활용 금지.

**우선순위 4 — 공식 3-8-54 게이트:** 원본 동등 기초 schema와 2인 관리자 세션/CAS/권한·PIN, 근태·사진·메모 등 주요 P0 연결 증명 확보 후 시작. 이 보고서 PASS가 3차 신규 결함 37종 해결 또는 전체 CLEAN을 뜻하지 않는다.

## 5. 공식 현황 유지

| 항목 | 상태 |
|---|---|
| 운영 RPC 복구 | **23/26 = 88.5%** (기존 서버 검증 문서 기준, 이번 서버 재측정 아님) |
| 오프라인 공개 SQL 재구성 범위 검사 | **PASS**, 최종 Run 40160383202 |
| 독립 원본동등 QA 스키마/서버 | **아직 미확보 / BLOCKED** |
| 3차 마지막 완료 | **3-8-53** |
| 다음 블록 | **3-8-54 미시작** |
| 누적 신규 결함 / 전체 상태 | **37종 / NOT CLEAN** |
| `main`·실 직원 DB/권한/원본 Supabase 변경 | **0** |

고객센터 추가 답변 전 마지막 데이터관리 RPC `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` 설치·실행·다른 경로 우회 금지.
