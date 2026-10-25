# 근무모아 3차·깊이8 — 휴일근무 가능 설정 CAS 정상 경로 실브라우저·가상 PostgreSQL 검수

**2026-10-25 KST · 공식 블록 3-8-54 미시작 / 전체 NOT CLEAN**

## 1. 최종 판정 및 실행

- [GitHub Actions Run 40161938774](https://github.com/eco-i/eco-i.github.io/actions/runs/40161938774) — **completed / SUCCESS**
- `HOLIDAY_CAS_SCOPED_PASS 24 checks` 및 개별 `HOLIDAY_CAS_BROWSER_PASS` **24/24**.
- `qa-3-8` 원본 `index.html`의 관리자 실제 로그인 버튼, 관리자 2차 PIN 입력, 직원관리 창의 실제 **휴일근무 가능** 체크박스 `data-holiday-work-enabled="2"` 클릭. **가상 관리자 A/B 2개 Chromium 컨텍스트**를 사용.
- HTTP는 localhost 가짜 REST gateway에서 3열 `list_holiday_work_eligibility_v2(p_token)`, 4인자 `admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled,p_expected_revision)`만 SQL로 매핑; **PostgREST 서버 원본 미사용**.
- PostgreSQL16은 Actions에서만 실행되는 **폐기형 DB**, 실존 직원·운영 계정·실 운영 RPC/스키마/토큰·PIN·Supabase 데이터 없음.
- 신설 SQL: `qa-round3/e2e/ci/holiday-toggle-4arg-cas-fixture.sql` — `qa_holiday_toggle_state`, `qa_holiday_toggle_audit`, 가상 직원 1·2·3과 `qa_holiday_toggle_cas` 작성. 실운영 스키마·Auth/RLS 및 비공개 검토용 후보 함수의 DDL을 복사하지 않은 **별도 합성 DB 검수 함수**.
- 스크립트: `qa-round3/e2e/ci/browser-holiday-cas-4arg-positive.py`.
- 워크플로: `.github/workflows/workmoa-qa-holiday-cas-positive.yml`.

## 2. 실제 브라우저 경과와 DB 전후

1. 관리자 A와 B가 서로 다른 가상 토큰으로 로그인, 모두 `employee_id=2`의 `holiday_work_enabled=false, eligibility_revision=0` 스냅샷을 읽음.
2. A가 실제 체크박스를 클릭해 허용=true 요청: 4개 인자와 `p_expected_revision=0`로 DB 트랜잭션 수행 후 상태 **true / revision 1 / audit 1**. 원본 UI 재조회도 revision 1 확인.
3. 아직 이전 rev 0을 읽은 B가 실제 체크박스를 클릭함. 서버 가상 SQL은 `STALE_HOLIDAY_ELIGIBILITY`을 오류로 내고 HTTP 409 응답; 원본 UI가 최신 목록을 재조회해 revision 1/허용=true 표시. DB는 **true / rev 1 / audit 1** 그대로, 자동쓰기 재시도 없음.
4. B가 최신 UI에서 다시 클릭해 허용=false 및 `p_expected_revision=1`을 전송. 최종 **false / rev 2 / audit 2**. 실제 CAS 호출 revision 배열은 **[0,0,1]** / 두 명 토큰 보존.
5. 관리자 A가 구 3인자 `admin_set_holiday_work_enabled_v2`를 직접 RPC 호출하려는 음성 경로를 테스트. 가상 서버가 `PGRST202 FOUR_ARGUMENT_CAS_REQUIRED`로 **DB 실행 전에 거부**, 최종 행/audit 변화 0.
6. 실 브라우저 미처리 JS 예외 0, hosted Supabase 요청 0.

### 테스트 제작 과정의 수정 — 제품 결함 집계 없음

- 첫 실행 [Run 40161853328](https://github.com/eco-i/eco-i.github.io/actions/runs/40161853328)은 시험 코드가 Playwright `.check()`를 사용해 중단. 근무모아 실제 변경 핸들러는 사용자가 눌렀을 때 **검증 전 체크 상태를 원래대로 되돌리고**, 비동기 저장 성공 후 최신 데이터로 재렌더하므로 `.check()`의 즉시 체크 완료 가정이 잘못됨.
- 시험 코드를 **`.click()`로 변경하고 DB/CAS readback만 평가**해 최종 [Run 40161938774](https://github.com/eco-i/eco-i.github.io/actions/runs/40161938774) 24/24 PASS. 원본 앱 코드 변경은 0. 최초 시험 fixture 이슈를 신규 제품 결함으로 합산하지 않음.

## 3. 검수 한계 — 반드시 분리

- 이 QA는 **가상 REST gateway**와 단순 합성 PG 함수를 사용한 실제 브라우저 사용자 상호작용 + PostgreSQL 원자 CAS/충돌 테스트다. **비공개 실제 CAS 후보 함수, 운영 SQL, 실제 PostgreSQL owner/grants/RLS, PostgREST, Auth, 강제 첫 PIN·두 번째 관리자 PIN 서버 검증, 휴일근무 등록과 설정 변경 사이의 공통 직원 잠금**은 이번 실행에 포함하지 않음.
- 과거 비공개 `HOLIDAY_ENABLED_CAS_V2_SCOPED_GATE_20261022.md`의 가상 PG17+진짜 PostgREST14 **43/43 PASS** 기록과 병행하더라도, 해당 시험은 별도 fixture이며 이번 Chromium ↔ **원본** PostgREST 전체 E2E가 통과한 게 아님.
- 과거 2026-10-24 운영 서버 catalog에서는 versioned 읽기 함수가 없고 `admin_set_holiday_work_enabled_v2`는 **3인자**뿐임. 이는 QA 브랜치의 CAS 3열·4인자와 계약 미충족을 의미하되, 2026-10-25 현재 실 서버의 최신 상태를 재측정한 게 아님. 기존 운영 main은 2열·3인자를 사용하므로 현재 운영 장애로 단정 금지.
- 비공개 `DRAFT_HOLIDAY_ENABLED_CAS_V2.sql.txt`는 **review only**로, fail-fast 배포 차단 sentinel이 있고 운영 설치 승인 또는 안전 검사 우회 대상으로 사용할 수 없음. **구버전 3인자 무CAS fallback 추가 금지**.

## 4. 다음 실질 장애와 공식 현황

- **이번에 실제 제거한 위험:** `qa-3-8` 프런트의 새 3열 조회 및 필수 4인자 CAS 입력이 최소한 **실제 관리자 UI → 합성 HTTP → 폐기형 PG** 종단에서 정상 저장·오래된 화면 409·재조회·최신 재저장까지 실행되는지 불명확했던 문제 → **24/24 scoped PASS**.
- **여전히 공식 3-8-54를 막는 것:** 원본동등 독립 QA 기초 스키마/세션/권한/PostgREST/RLS 확보, 그리고 휴일근무 토글 ↔ 휴일근무 저장의 동일 직원 범위 잠금/트리거/실효일 인사조건 확인. 데이터 관리 3종 RPC는 고객센터 답변 전 운영 설치/우회 금지.
- 운영 RPC 복구 **23/26 = 88.5%** (이전 기록, 이번 실측 아님).
- 공식 3차 마지막 완료 **3-8-53**, 다음 **3-8-54 미시작**, 신규 제품 결함 **37종 유지**, 전체 **NOT CLEAN**.
- 운영 GitHub `main`, 실제 직원 DB/Supabase, ACL/복구 SQL, 운영 배포 **변경 0건**. GitHub 공개 `qa-3-8`에서 합성 테스트 3파일만 작성.
