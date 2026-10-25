# 근무모아 3차 깊이8 — 독립 가상 관리자 2명 계정상태 CAS 실브라우저 검수

**검증일:** 2026-10-25 KST

> **공식 3-8-54는 아직 시작하지 않았다.** 본 검수는 가상 관리자 2명 사이의 계정 상태 쓰기 충돌에 국한된 P0 부분 검수다. 실제 Supabase/PostgREST/Auth/RLS/운영 직원 데이터 E2E가 아니며, 전체 상태 **NOT CLEAN**, 배포 **보류**.

## 결과 및 재현성

- **최종 검수:** [GitHub Actions Run 40157002998](https://github.com/eco-i/eco-i.github.io/actions/runs/40157002998) — **SUCCESS**, 로그 `TWO_ADMIN_PASS` **21회**, `TWO_ADMIN_CAS_SCOPED_PASS 21 scoped assertions`, 오류 0.
- 최초 성공: [Run 40156900554](https://github.com/eco-i/eco-i.github.io/actions/runs/40156900554) — SUCCESS, 실제 21개 단언 통과. 다만 테스트 종료 출력에는 18이라고 잘못 표시되어 있었고 후속 커밋에서 21로 정정, 동일 검증 재통과.
- 최종 테스트 커밋 [`c8832d4`](https://github.com/eco-i/eco-i.github.io/commit/c8832d4b841d1dac8602faeed638a04567755519), 제품 앱 `index.html` **변경 없음**.
- 테스트 파일 `qa-round3/e2e/ci/browser-two-admin-account-cas.py`.
- 실행 워크플로 `.github/workflows/workmoa-qa-two-admin-account-cas.yml`.
- DB fixture `qa-round3/e2e/ci/two-admin-account-cas-fixture.sql`.

## 검수한 기능 경로

| 단계 | 실제 수행 | 결과 |
|---|---|---|
| 관리자 A/B 로그인 | 서로 다른 실제 Chromium 브라우저 컨텍스트, 사용자 로그인 UI, 가짜 이름/PIN 및 관리자 2차 PIN | PASS |
| 관리자 권한 보유 | 두 관리자 서로 다른 토큰/employee_id, 실제 앱 관리자 모드 확인 | PASS |
| 동일 직원 편집 | 실제 앱의 계정 상태 변경 팝업을 두 컨텍스트에서 열고 값 및 메모 입력 | PASS |
| 공유 revision 캡처 | 같은 초기 revision `00000000000000000000000000000000`를 양쪽 모두 보유 | PASS |
| 관리자 A 저장 | 실제 계정변경 **저장 버튼 클릭 → 합성 HTTP RPC → 폐기형 PostgreSQL 트랜잭션/CAS** | PASS: revision=1, 기록=1 |
| 관리자 B 늦은 저장 | 열린 초안의 동일한 오래된 revision으로 실제 저장 버튼 클릭 | PASS: **409** 충돌 거부, DB revision=1, 기록=1 유지 |
| 작성 내용 보호 | 충돌 후 B의 미저장 메모 및 dirty 편집 상태 유지 | PASS |
| 최신화 후 재시도 | B가 옛 팝업을 닫고 최신 목록 재조회 및 새 팝업을 연 뒤 수정 | PASS: revision=2, 기록=2 |
| 외부 통신 및 안전 | 브라우저 외부 Supabase 호스트 차단, 백업/초기화/복원 RPC 실행 없음, JS uncaught 오류 없음 | PASS |

### 검수의 한계

- 가상 관리자 2명은 원본 UI에서 로그인했으나 **백엔드 로그인, 관리자 2차 PIN 응답, 서버의 변경 CAS 함수는 테스트용으로 직접 만든 모형**이다.
- PostgreSQL의 row-level transaction 및 revision 체크는 **진짜 폐기형 로컬 DB 트랜잭션**이지만, 실제 운영 `admin_set_employee_account_status_v3` 구현과 함수 본문/RLS/권한을 검증한 결과는 아니다.
- 계정 변경 팝업 열기는 브라우저의 실제 함수 `openEmployeeAccount(2)` 호출이며, 저장 버튼은 실제 사용자 UI 클릭이다. 관리자 목록에서 팝업까지의 모든 클릭을 검증했다고 주장하지 않는다.
- 2개의 Chromium context는 서로 다른 관리자 독립 세션을 모델링한다. 한 브라우저 컨텍스트를 공유하는 2탭 실제 세션 경계 검수는 별도 [14/14 PASS](https://github.com/eco-i/eco-i.github.io/actions/runs/40156466192).
- 관리자 권한 중도 박탈, 관리자 PIN 재확인, Web Locks 경합, 원본 Supabase Auth/PostgREST/RLS, 실시간 Realtime, 전체 직원/정비/공휴일 원본 서버 간섭은 **미검증**.

## 3차 진입 상태와 다음 안전한 목표

- 운영 RPC 복구 기록: **23/26=88.5%**. `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2`는 고객센터 조사 결과를 보기 전 **설치/권한 변경/재실행 금지**.
- 공식 3차: 마지막 **3-8-53 완료** / 다음 **3-8-54 미시작** / 누적 신규 결함 **37종** / 전체 **NOT CLEAN**.
- `main` 운영 기준 `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb`. 이번 테스트는 `qa-3-8`의 검수 스크립트와 인공 fixture/워크플로만 변경, 운영 사이트·실제 직원 기록·운영 서버 RPC 0건 변경.
- 다음 단계는 원본과 동등한 격리 QA 서버 Auth/PostgREST/RLS 및 관리자 권한회수/동시성 시험 충족 여부 점검이다. 이 조건이 충족되기 전에는 **3-8-54 공식 E2E PASS**라고 표시하지 않는다.
