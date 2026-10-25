# 근무모아 3차·깊이8 — 관리자 저장 진행 중 권한 회수·세션 핸드오프 실브라우저 부분 검수

**검수일:** 2026-10-25 KST  
**공식 3-8-54 미시작 / 전체 NOT CLEAN / 운영 배포 보류**

## 1. 실제 확인 결과

- **최종 SUCCESS:** [GitHub Actions Run 40158653217](https://github.com/eco-i/eco-i.github.io/actions/runs/40158653217), HEAD `c7a9c7138c01f8f706a53cfe813991fc59cdc71d`. `INFLIGHT_PASS` **24회**, `INFLIGHT_SCOPE_PASS 24 scoped assertions`, 실패 0건.
- 첫 시도 [Run 40158527468](https://github.com/eco-i/eco-i.github.io/actions/runs/40158527468)는 테스트 대기 루프의 **fixture 문제**로 실패. Python `threading.Event.wait(10)`이 Playwright sync event loop를 막아 브라우저 요청을 전달하지 못했음. 이후 Playwright `page.wait_for_timeout` 기반 비차단 폴링으로 변경, 동일 범위 24/24 최종 성공. 첫 실패를 제품 결함으로 잘못 계상하지 않음.
- 스크립트: `qa-round3/e2e/ci/browser-admin-inflight-revocation.py`
- 워크플로: `.github/workflows/workmoa-qa-admin-inflight-revocation.yml`
- QA 사이트: `qa-3-8`의 실제 `index.html`을 localhost용으로 안전 치환한 임시 HTML. 외부 요청은 차단. 2개의 실제 Chromium 브라우저 컨텍스트, 합성 관리직원, 가짜 HTTP 권한검사/응답, 폐기형 PostgreSQL.
- 기존 21/21 관리자 권한회수 시험을 반복하지 않고 **대기 중 응답**과 **계정 핸드오프**라는 별도 경합을 추가 검증.

## 2. 실제 24개 검수 불변식(요약)

### A. 관리자의 계정 변경 SAVE 도중 역할 회수
1. 가상 관리자 A가 실제 편집창의 저장을 클릭한 RPC가 로컬 서버에서 보류된 상태 확인.
2. 서버 응답 전 PostgreSQL revision=0, 계정 이벤트=0.
3. 직원목록 응답에서 A의 `is_admin` 회수 → 실제 앱 재조회 시 관리자 권한/PIN unlock 제거 및 관리자 도구 숨김.
4. 작성 중이던 계정 변경 메모는 유지. 이후 서버가 `ADMIN_PERMISSION_REVOKED`로 거절.
5. 대기 중 저장 상태 해소 후에도 관리자 권한·저장 가능성 되살아나지 않음.
6. DB revision=0, 이벤트 0, 미승인 쓰기 0.

### B. 다른 계정으로 다시 로그인한 직후 이전 만료 응답 도착
1. 가상 관리자 B의 SAVE HTTP 요청을 로컬 서버에서 보류한 채, 앱의 로그아웃 동작 수행.
2. B의 기존 토큰/사용자 세션이 제거된 상태에서 같은 브라우저 페이지에 가상 관리자 A로 실제 로그인(+2차 PIN).
3. B의 대기하던 HTTP 응답을 `SESSION_EXPIRED`로 완료.
4. 새 A 토큰/사용자 정보/별도 2차 PIN unlock/앱 화면 유지.
5. 요청 2건 모두 서버에서 거절; PostgreSQL CAS mutation 0건; 외부 운영 Supabase 연결 0; 브라우저 uncaught JS 오류 0.

**특히 주의:** 이 시험에서 HTTP 지연과 서버 거부 결정은 테스트 스크립트가 만든 것이다. 원본 PostgreSQL commit 시점의 admin 권한 검증 또는 Auth 서버 세션 무효화 기능을 실증하지 않았다. 서버가 쓰기를 **성공적으로 commit하고 HTTP 응답만 늦게 전달하는 결과 불확실 상태**까지 검증한 것도 아님.

## 3. 원본 동등 QA 환경의 부족 조건(코드 리뷰)

비공개 서버 저장소 `ahnbest23-hash/workmoa-backend-private`의 `DRAFT_PERSONNEL_FIRST_FIVE_REAL_SCHEMA_CAS_REVIEW_ONLY_20261023.sql.txt`를 **읽기만** 확인했다. 이 SQL은 의도된 `DO ... RAISE EXCEPTION ... REVIEW_ONLY_NOT_FOR_LIVE` 보호가 있는 설계 후보이며 설치/실행하지 않았다.

- 후보 `workmoa_guard.require_epoch`는 `_require_admin(p_token)` 확인 → 공유 `generation FOR UPDATE` 잠금 → 관리자 재확인 → 32자리 revision CAS 조건으로 작성되어 있다.
- 후보 `admin_set_employee_account_status_v3`, `admin_apply_personnel_batch_v3`, `admin_cancel_personnel_batch_v2`, `admin_restore_personnel_snapshot_v3`는 공유 revision + 개별 expected snapshot을 이용하도록 작성되어 있으나 실제 운영 원본/개별 V1 writer cutover/RLS 검증이 아니다.
- 현재 합성 PG 시험은 전용 `qa_two_admin_change_account`를 사용하며 위 후보와 같은 원본 구현이 아니다. 특히 단순 숫자 revision32와 후보의 혼합 해시 revision32가 다르므로 실제 반환 계약 정합성을 별도로 확인해야 한다.
- 강제 *본인 1차 PIN* 변경(`change_own_pin_v2`, `initialPinRequired`) 경로는 QA 앱에 존재하지만, **관리자 2차 PIN 변경/재발급의 실제 서버 종단 간 경합**은 이번 시험 범위에 없음.
- 원본 동등 독립 QA용 Auth, PostgREST, RLS, 완전 기본 스키마 및 가상계정으로 이루어진 분리 환경은 확보되지 않았으며 공식 3-8-54 진입 조건이 아니다.

## 4. 공식 누적 상태

- 운영 RPC 복구: **23/26 = 88.5%**, **이번에 재측정하거나 남은 3종을 실행하지 않음**.
- 이전 안정화 4/4, 사진/초과근무 35/35, CAS 정적 22/22, 같은 출처 2탭 14/14, 두 관리자 합성 CAS 21/21, 권한 회수 및 세션 만료 21/21: **모두 이전 SUCCESS 유지**.
- 이번 새 in-flight 영역: **24/24 scoped PASS**.
- 공식 3차: 마지막 **3-8-53**, 다음 **3-8-54 미시작**, 결함 **37종**, 전체 **NOT CLEAN**. 전체 블록 수가 미정이므로 %는 만들지 않는다.
- 운영 `main` 임의 변경/병합/배포 0, 운영 DB 직원정보·인증·SQL/RPC 권한 변경 0, 새 유료 QA 클라우드 생성 0.
- 남은 RPC `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2`: 고객센터 기술답변 도착 전 설치·실행·권한변경·반복/우회 **금지 유지**.

## 5. 다음 작업

1. 강제 1차 PIN 변경 중 저장 요청과 **응답이 뒤늦게 도착할 때** 브라우저 상태 방어 범위를 따로 설계(운영 2차 PIN 교체와 혼동 금지).
2. 원본 서버 함수의 사전/사후 역할 재검증·공유 CAS·Auth/PostgREST/RLS 분리 QA에서만 검증할 수 있도록 부족한 독립 스키마 구성요소를 목록화.
3. 사용자 승인 없는 유료 QA 프로젝트 생성·운영 자료 복제 금지. 진입 조건이 갖춰지기 전 공식 3-8-54 시작 금지.
