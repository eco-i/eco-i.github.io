# 근무모아 — 인사발령 취소 운영 v1 SQL 결합 격리검수(2026-10-23)

**공식 상태: 12/26 RPC 운영 복구 확인, 14종 잔여 / 3-8-53 완료, 3-8-54 보류 / 신규 결함 37종 / NOT CLEAN**

- 비공개 GitHub Actions [Run 39888051203](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39888051203) **SUCCESS, 합성 PostgreSQL17+PostgREST14.18 54/54**. 원본 실운영 인사발령 취소 v1 SQL을 실행방지 초안에서 격리 복사하여 v2 wrapper와 함께 시험함.
- 기존 두 관리자 동시취소, 1성공/1충돌, 기존 안전 복구지점·감사·알림·권한 거부·롤백 검수 38개를 보존하고, 발령 대상 수정 시 revision 누락 경계·추가 synthetic 보호 트리거·ABA·복구지점 생성 실패 원자 롤백 16개를 추가.
- **중요:** 기본 부모행만 revision 증가시키는 초안은 대상 직원 정보 변경을 놓쳐 오래된 취소를 허용하는 경계가 가상 DB에서 확인됨. 54 PASS는 위험 재현과 *synthetic 트리거를 별도로 적용한 제한적 보호 시험*의 합계이지, 운영 적합 승인 증거가 아님.
- 운영 `personnel_batches` revision 컬럼/트리거·인사조회 revision 노출, 운영 2인자 ↔ QA 3인자 앱 계약, 다른 인사/복구·계정 상태 변경 전체의 공통 revision·잠금·복원 ABA 문제는 **미해결**.
- 시험 최초 확대 Run `39887913604`는 QA 테스트 SQL 문자열 오류로 FAIL, 가상 시험 코드만 수정한 최종 Run은 PASS. 자세한 테스트 로그·SQL·안전성 근거는 비공개 서버 보고서 `PERSONNEL_CANCEL_OPERATIONAL_V1_54_QA_GATE_20261023.md`.
- 운영 `main` 및 실제 직원 DB/실운영 Supabase 변경 **0**. 다음은 교차쓰기·잠금순서·복원 세대값 설계 및 추가 격리시험. 운영 설치는 별도 사용자 승인 전 금지.


## 추가 2026-10-23 — 글로벌 generation 교차경합 격리 PASS (여전히 배포 차단)

- 비공개 [GitHub Actions Run 39889256803](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39889256803) **workflow/job SUCCESS**. 기존 취소 v1 원본 SQL 재생 기반 54/54 + 계정변경·직원 인사액션 변경·합성 복원·관리자 동시취소를 공유 generation으로 직렬화한 가짜 PostgreSQL17/PostgREST14.18 **46/46**, 총 **100/100 한정 시험 항목 PASS**.
- global gate 단일 row `FOR UPDATE`를 먼저 취득, 오래된 expected generation 409, 계정변경 뒤 오래된 취소 차단, 변경 후 원상복구/복원 ABA 차단, snapshot+audit 실패 원자 롤백, 2관리자 동시취소 1명만 200, 옛 v1/v2 HTTP EXECUTE 가상 차단.
- 권한철회/세션 만료를 기다리는 동안 변화한 경우 잠금 획득 후 재검증해 거부하는 6개 신규 항목 PASS. 다만 모든 실운영 인증·관리자 세션·권한변경 함수와 동일한 잠금/행 보호가 구현된 것은 아님.
- **주의:** 실제 운영 SQL을 재생한 함수는 인사발령 취소 v1만. 계정상태·직원 인사 수정·복원은 **합성 대역 함수**. 54개 중 일부는 취약했던 부모 revision 단독 방식의 위험이 올바르게 재현된 항목이므로 전체 PASS가 실제 안전 인증을 뜻하지 않음.
- 운영 실스키마 read-only: `admin_apply_personnel_batch`의 신규 직원 ID `MAX(id)+1`, `admin_set_employee_account_status`의 독립 계정 이벤트 추가, `admin_restore_personnel_snapshot`의 delete-reinsert 복구 구조 확인. 모두 common generation·전역 잠금 전환 필요. 운영 main 취소는 2인자, QA는 3인자, 이번 가상 gate 취소는 4인자여서 여전히 클라이언트 계약 불일치.
- 비공개 상세 인수인계 `PERSONNEL_GLOBAL_GENERATION_CROSS_RPC_SYNTHETIC_GATE_20261023.md`. 다음은 실제 서버 등록/계정변경/복원 SQL을 공통 잠금/2차 인증/RLS·세대번호 계약으로 격리 구현 및 종단 통합검수, 운영 전 별도 승인.
- **운영 RPC 12/26 완료, 14종 남음. 3-8-53 완료 / 3-8-54 미시작 보류 / 37종 / NOT CLEAN** 불변. 실제 Supabase DB/직원기록/운영 `main` 변경 **0**.


## 추가 2026-10-23 — 실제 운영 인사관리 v1 원문 재생, 한정 160/160 검수 PASS

- [Private Actions Run 39890396771](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39890396771) **workflow/job SUCCESS**, 기존 54(취소 원문)+46(가상 공통 generation)+추가 **60/60**(실제 운영 `admin_apply_personnel_batch`, `admin_set_employee_account_status`, `admin_restore_personnel_snapshot` 및 관련 helper 원문 재생) = **160/160 scoped assertion PASS**.
- 실운영 원문 7종은 운영 Supabase 함수 정의를 **읽기 전용**으로 확보한 뒤 비공개 저장소 `qa/REAL_OPERATING_*_V1_COPY_NO_DEPLOY.sql.txt`에 직접 실행 차단 가드를 붙여 저장. 임시 QA PostgreSQL17에서만 SHA pin 대조·가드 제거·원문 리플레이 및 PostgREST14.18 HTTP 시험. 운영 DB의 실제 직원행은 읽거나 변경하지 않았음.
- 실제 신규/기존 인사발령 저장·수정, 실제 계정상태 이벤트, 실제 복구지점 생성·보존/복구, 가상 관리자의 2인 동시 신규직원 등록 시 글로벌 잠금 후 1 성공/1 충돌, PIN 불일치 및 감사 오류 롤백, 글로벌 generation ABA 차단 실증.
- **범위 주의:** 실제 운영 SQL 원문은 실행했지만 테이블/세션/권한·RLS/직원 편성 및 전역 generation 래퍼는 가상 구현. 운영에 `generation` 기능이 설치됐거나 14종 누락 RPC 중 어느 것이든 새로 복구됐다는 뜻 아님. 기존 54개 중 일부는 취약성 *재현* 성공. 운영의 별도 old RPC·데이터 복원·초기화 경로, 브라우저 계약, 잠금 교착/관리자 인증·2차 PIN 실규칙은 미해결.
- 실패 이력: Run 39890181728의 fake identity 중복 선언과 Run 39890283697의 임시 SQL 세미콜론 누락은 QA 작업 오류. 수정 후 Run 39890396771만 전체 SUCCESS. 실제 직원기록·운영 UI·서버 SQL/권한·배포 변경 **0**.
- PRIVATE 상세: `PERSONNEL_REAL_OPERATING_THREE_WRITER_GENERATION_160_QA_20261023.md`. 다음은 실운영 인증·잠금순서·旧 RPC 접근차단 및 운영 main/QA의 RPC 매개변수 계약 정합성을 완성한 뒤 브라우저→격리 서버 통합검수. **운영 반영은 별도 사용자 승인 후 진행.**
- 공식 상태 변경 없음: **RPC 운영 12/26(약 46%) / 잔여 14**, 3차 **3-8-53 완료 / 3-8-54 미시작·보류 / 누적 결함 37 / NOT CLEAN**.


### 운영 RPC 권한 참고(추가 카탈로그 읽기 전용 검증)
- `_personnel_capture_state`, `_personnel_make_snapshot`, `_personnel_category_from_state`, `_personnel_group_from_placement`, `_require_admin`의 익명/일반인증 EXECUTE는 **모두 false**, 보조 함수 직접 외부 실행 경로는 허용되지 않음.
- 기존 `admin_apply_personnel_batch`, `admin_cancel_personnel_batch`, `admin_set_employee_account_status`, `admin_restore_personnel_snapshot`의 익명/인증 EXECUTE는 **true**. 함수 내부 토큰 인증은 존재하지만 새 공통 CAS 없이 계속 호출 가능한 **구버전 이행 차단점**이므로, 서버 신규 RPC만 설치해 보호 완료라고 판정하지 않음. 운영 GRANT 변경은 별도 사용자 승인 이후.


## 추가 2026-10-23 — 인사관리 단일 읽기 스냅샷 + generation CAS (198/198 한정 PASS)

- 비공개 GitHub Actions [Run 39893627481](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39893627481) **최종 SUCCESS**: 기존 **54+46+60=160** + 단일 읽기 스냅샷 및 stale UI CAS 신규 **38/38**, 누적 **198/198** *합성 환경 한정 assertion PASS*. 이 수치는 3차 검수 블록 번호 또는 운영 설치 진행률이 아님.
- 추가 QA: `qa/personnel_consistent_snapshot_read_fake_only.sql`, `qa/personnel_consistent_snapshot_read_http_check.py`. PostgreSQL17 `STABLE` 조회 RPC가 한 statement snapshot에서 발령 배치, 액션, 계정 이력, 독립 generation을 JSON으로 반환하도록 구성. 권한제한, 미커밋 변경 비노출, 실제 운영 계정/등록 v1 SQL 원문을 재사용한 합성 래퍼의 세대 증가, stale/NULL/누락 expected generation 차단 및 실패 후 데이터 불변 확인.
- 운영 `main`과 QA `index.html` 원본 blob을 read-only 대조: 취소 RPC는 **2인자 vs 3인자**. 기존 등록 `p_expected`는 기존 직원 정보 배열(신규 직원만 있으면 빈 배열 가능). 계정 `p_expected`도 독립 generation 아님. 복원 해시는 단조 generation 아님. 현재 화면은 인사발령과 계정 이벤트를 `Promise.all`로 **서로 다른 두 RPC**에서 조회하므로 같은 DB snapshot이라는 보장 없음. 이번 가상 조회 함수는 어느 운영 화면에도 아직 연결되지 않았음.
- 다음은 실환경용 **동일 스냅샷 세대 포함 조회 RPC + 모든 인사 쓰기 필수 expected generation 계약**, 기존 v1 RPC 접근 경로의 안전한 동시 전환, 권한·세션·실제 RLS/2차 PIN 및 full-app 브라우저 E2E 격리검증. 서버만 조기 설치하거나 기존 쓰기권한부터 일방적으로 끊으면 보안 우회/기존 앱 장애 위험.
- 비공개 상세 보고서 `PERSONNEL_ATOMIC_SNAPSHOT_GENERATION_198_SCOPED_QA_20261023.md`.
- **공식 불변:** 운영 RPC **12/26 완료·14 잔여**, 3차 **3-8-53 완료 / 3-8-54 미시작·보류 / 누적 37결함 / NOT CLEAN**. 실제 직원 데이터 및 운영 Supabase SQL/DDL/GRANT, 운영 `main` 변경 0. 운영 반영은 별도 사용자 승인 전 금지.


## 추가 2026-10-23 — legacy RPC fail-closed cutover 266/266 scoped QA SUCCESS

- [비공개 Actions Run 39902373202](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39902373202) / Job `120246605316` 모두 **SUCCESS**. 이전 54+46+60+38=198에 새 old-client denylist & new CAS continuity **68/68** 더해 **266/266 합성 시험 항목 PASS**. 일부 기존 항목은 위험 재현 성공으로, 운영 무결성 인증이 아님.
- 비공개 새 파일 `qa/personnel_cutover_denylist_fake_only.sql`, `qa/personnel_cutover_denylist_http_check.py`. DB명/가상 역할/실운영 역할 부재 검사로 **가상 PostgreSQL17 전용**; 구버전 v1 RPC 4종, 취소 v2, 보조 함수 5종, 이전 QA endpoint 4종의 외부 EXECUTE 거부. old `main` 2인자 취소 / QA 3인자 취소 / 기존 v1 HTTP 4종은 **fail closed**; 기록·감사·복구지점·generation 무변경. 신규 격리 CAS로 실제 v1 SQL 내부 실행한 계정·등록·취소는 정상 작동하며 dual expected 검사/원자 generation 상승 확인.
- **운영 RPC GRANT/REVOKE를 실제 바꾼 적 없음.** 실제 운영 캐시·열린 구형 탭·진행 중 트랜잭션/구버전 세션을 안전하게 전환하는 E2E는 미검증. 현재 운영 `main`과 QA 모두 새 전역 expected generation을 전달하지 않으므로, 운영에서 기존 EXECUTE 권한부터 회수하면 **인사관리 기능 장애 위험**. old RPC를 유지하면 **CAS 우회 위험**. 권한 변경과 배포는 업무 중단 시간/사용자 안내/롤백 검토 후 별도 승인 필요.
- PRIVATE 상세 인수인계 `PERSONNEL_LEGACY_RPC_CUTOVER_266_SCOPED_QA_20261023.md`.
- 공식 상태 **운영 RPC 12/26 완료·14종 잔여**, **3-8-53 마지막·3-8-54 미시작 보류**, 신규 결함 37, **NOT CLEAN**. 운영 `main` 및 실제 DB 변경 0.


## 2026-10-23 추가 · Chrome 격리 화면→PostgREST→PG17 E2E (310/310 scoped PASS)

- 비공개 [GitHub Actions Run 39903369092](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39903369092) job 120249688374 **SUCCESS**. 기존 **266/266** 검수 보존 + Chrome 브라우저 추가 **44/44**, 누적 **310/310 한정 assertion PASS**. 일부 초기 항목은 설계상의 문제 *재현 성공* 테스트이므로 시스템 전체 CLEAN과 다름.
- 가상 전용 새 파일: qa/personnel_browser_cutover_fixture.html 및 qa/personnel_browser_cutover_test.cjs. **실제 설치된 Chrome headless**에서 별도 가상 화면 버튼 조작 → localhost PostgREST14.18 → 가상 PostgreSQL17 (운영 v1 SQL 원문을 합성 CAS로 호출) 종단검수. 휴대폰 검증은 **390x844 모바일 viewport 시뮬레이션**일 뿐, 물리 Android/iOS 테스트 아님.
- 구버전 main 취소 2인자/QA 3인자 요청 → 403/404 및 최신 버전 안내, 변경 0. 최신 가상 화면은 단일 snapshot의 generation을 받고, 계정/등록/취소를 필수 예상 generation과 함께 호출함. 다른 관리자 변경 시 409, 관리자 초안 보존/버튼 차단, **사용자의 명시적 최신 조회 + 재확인** 후 성공. 발령 취소는 batch revision+generation 이중 검사. 모바일 화면 overflow 및 가상 외부 네트워크 차단 확인.
- 초기 Run 39903111584는 브라우저 비동기 버튼검증 타이밍, Run 39903232325는 의도된 HTTP403/409 콘솔 메시지 오분류로 실패한 QA 하네스 이슈. 수정 후 최종 Run 전체 성공; 둘 모두 이전 266개 시험은 PASS, 운영 제품 결함으로 집계하지 않음.
- **중요:** 위 화면은 운영 근무모아 전체 1MB index.html이 아닌 **별도 가상 QA sidecar**. 현재 실운영 main/QA 앱 코드 및 운영 Supabase function/GRANT/data를 변경하거나 full-app Chromium E2E를 실행한 것은 아님. 실앱 로그인·모달·관리자 권한 전환·PWA 캐시는 별도 검증 필요. 서버·화면 계약의 실운영 전환과 legacy RPC 권한 회수는 별도 승인 후만.
- 비공개 상세: PERSONNEL_BROWSER_CUTOVER_310_SCOPED_QA_20261023.md. 공식 상태 **운영 RPC 12/26 설치·14종 잔여**, **3-8-53 마지막 완료 / 3-8-54 미시작 보류 / 결함 37 / NOT CLEAN**. 운영 main, 실제 Supabase 직원·근태·지문 데이터와 SQL 및 권한 **변경 0**.
