# 2026-10-21 GitHub Actions — 원본 근무모아 브라우저 HTTP ↔ 실제 PostgreSQL SQL 검증

> **공식 결과: 부분 연결 검수 SCOPED PASS (12/12)**. 정규 Supabase Auth/PostgREST/RLS/Realtime 또는 직원 로그인 후 근태 입력폼을 사용한 전체 E2E 통과는 **아님**. 이번 문서 작성은 새로운 검수 블록 CLEAN 판정이 아니며 기존 조건부 코드종료·미배포를 유지한다.

## 1. GitHub 실제 실행 근거
- 성공한 실행: https://github.com/eco-i/eco-i.github.io/actions/runs/39517320631
- 실제 Run ID `39517320631`, head commit `405665a3dc2f5d4793090f224183551f9f6a28f1`, status **completed / conclusion success**.
- 실행 로그에서 **`PASS browser-to-PostgreSQL:` 12행 + `SQL_HTTP_BRIDGE_SCOPED_PASS` 확인**. 
- 1차 도구 검증 실행 https://github.com/eco-i/eco-i.github.io/actions/runs/39517153413 는 검증 절차 마지막의 **차단된 외부 CDN 요청을 “외부 요청이 존재하지 않아야 함”으로 오인**해 도구 테스트 실패. 실제 PostgreSQL 저장/충돌 10개 핵심 검사는 당시 통과. 이후 외부 CDN 요청 **`cdn.jsdelivr.net` 차단 기록과 실제 Supabase 외부 접속 여부를 분리**하여 재실행 성공. 제품 결함 0종.

## 2. 독립 환경 구성
- Workflow: `.github/workflows/workmoa-qa-browser-postgres.yml`, `qa-3-8` push의 특정 QA 파일 변경에만 실행. `permissions: contents: read`, `persist-credentials: false`, 임시 Ubuntu 24.04에서 PostgreSQL 16 Docker 서비스 `127.0.0.1:5432`만 게시.
- 합성 DB: `qa-round3/e2e/ci/synthetic-baseline.sql`을 적용하고 운영과 동일한 척하지 않는 **최소 synthetic helper** 설치. 실제 사용자·직원·근태·지문·비밀번호·원격 credential 사용 없음.
- 실제 QA 교정 SQL: `qa-round3/fixes/QA_3-8-6_holiday_work_serialization.sql` 원문을 변경 없이 SQL 엔진에 적용.
- 브라우저: `qa-round3/e2e/prepare-local-qa-site.mjs`로 **원본 `index.html`의 임시 QA 전용 복제본만** 생성(로컬 연결 주소·테스트 키로 치환). `qa-round3/e2e/serve-local-qa-site.mjs`가 `127.0.0.1:54330` 제공. 실제 Playwright Chromium 사용.
- API: `qa-round3/e2e/ci/browser-postgres-bridge.py`의 **테스트 한정 HTTP 게이트웨이** `127.0.0.1:54321`, 미구현 RPC 기본 404, 가짜 이름·토큰·날짜·내용만 허용; 해당 HTTP 요청을 **psycopg 3.2.10으로 실제 PostgreSQL 함수에 실행**. **PostgREST 서버 또는 정규 Supabase API가 아님**.
- 네트워크: Chromium 모든 외부 요청 차단. `BLOCKED_EXTERNAL_HOSTS: cdn.jsdelivr.net` 한 건의 호스트 유형만 관찰; 실제 운영 Supabase 접속 시도 없음. 모든 외부 요청은 `route.abort`로 차단.

## 3. Chromium → HTTP → 실제 PostgreSQL 12/12 PASS
1. 근무모아 원본 전체 HTML(임시 격리 복사본) 표시, QA 제목/주소 확인.
2. 앱 자체 `rpc()`가 로그인 전 근태 저장 mutation을 네트워크 전 단계에서 거절, 실제 DB 행 증가 0.
3. 합성 로그인 응답으로 초기 PIN 강제 변경 화면을 실제 Chromium에서 표시, 민감 본화면 숨김.
4. 강제 PIN 상태에서 앱 자체 `rpc()`가 근태 저장을 서버로 전송하지 않음.
5. Chromium의 직접 HTTP 요청 → synthetic HTTP gateway → 실제 SQL `save_my_holiday_work`: 잘못된 가짜 세션은 `SYNTHETIC_INVALID_SESSION`, 데이터 변화 없음.
6. Chromium 직접 HTTP → 실제 QA SQL: 가짜 휴일근무 행 1개 커밋 확인.
7. 실제 QA SQL `admin_save_maintenance_schedule`: 기존 휴일근무 기록이 있으면 해당 날짜 휴일 해제 `HOLIDAY_WORK_HISTORY_CONFLICT`; revision/행 불변.
8. 가짜 행만 독립 QA DB 내에서 제거한 뒤, 브라우저 직접 HTTP → 실제 QA SQL로 공휴일 해제 성공·revision 증가.
9. 휴일 해제 후 브라우저 직접 HTTP → 실제 QA SQL에 휴일근무 기록 요청하면 `NOT_HOLIDAY` 거절·행 0.
10. 옛 revision의 관리자 변경 요청이 `STALE_MAINTENANCE_SCHEDULE` 거절.
11. 실제 운영 또는 다른 Supabase `*.supabase.co` 연결 시도 없음.
12. 외부 CDN 요청은 모두 차단되었고 기타 허용되지 않은 외부 호스트는 확인되지 않음.

### 매우 중요한 해석
- **앱 실제 RPC guard**는 로그인 전·초기 PIN 강제 변경 상태에서 쓰기를 차단한 것을 확인함.
- **성공적인 쓰기 요청 6~10은 앱 내 실제 근태 입력 폼이나 권한 있는 `rpc()`가 아니라, 브라우저의 별도 JavaScript `fetch`를 이용한 테스트 전용 HTTP 경로**를 호출했다. 따라서 **로그인 후 사용자가 실제 근태 저장 버튼을 눌러 DB까지 저장되는 E2E라고 주장하면 안 된다**.
- 합성 `_session_employee`, `_require_admin`은 실제 직원 권한/기기 세션 인증이 아닌 **테스트 더블**이다.
- 이전 첫 PostgreSQL 동시성 별도 실행과 비교해 실제 브라우저 네트워크 요청부터 SQL commit/rollback 응답까지 검증 경계가 확대됨. 그러나 **여전히 정규 Supabase 인증/보안·모바일/지문·근태 CAS/연차·Realtime 통합시험 미검증**.

## 4. 상태 및 운영 보호
- 3차 **공식 마지막 완료 3-8-53**, 다음 3-8-54 **미시작**, 신규 제품 결함 **37종 유지**, 전체 CLEAN 아님.
- 제품 QA `index.html` Git blob **`08867d7117ad9ae5a8247eda8d223687af2b8411`**, `maintenance-20261018.js` **`f8e8e469503d0abf53844aa85188b15b09a95238`** 그대로.
- 운영 `main` HEAD **`6c784210e048426f18a486d5602652626d97574d`** 변동 없음. 직원 DB/운영 SQL/지문/실제 인증/운영 배포 변경 0.
- 새 QA 스크립트와 workflow·문서만 `qa-3-8`에 저장. 과금 서비스 0.

## 5. 다음 실제 과제
- 앱에서 로그인 후 실제 업무 데이터를 쓰는 사용 흐름을 검증하려면 **정규 Supabase 자체 또는 안전하게 구현·제한된 독립 테스트 백엔드**의 직원·세션·관리자·연차·근태·기본 스키마, RLS/정규 RPC를 설계해야 한다. 지금의 bridge의 임의 JSON 응답과 합성 인증 헬퍼만으로는 전체 앱을 신뢰할 수 없다.
- 이를 확보해 실제 앱 클릭부터 서버까지 E2E를 수행하기 전에는 P0/P1 공식 전체 CLEAN·배포 승인하지 않는다.
