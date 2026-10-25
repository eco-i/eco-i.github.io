# 근무모아 3차 깊이8 — 휴일근무 가능 설정 서버 RPC/QA 브랜치 계약 차이

**2026-10-25 KST · 정적 GitHub 기록 재대조 + 가상 서버·실제 Chromium 재현.**
**공식 3-8-54 미시작 / 신규 제품 결함 37종 유지 / 전체 NOT CLEAN.**

## 1. 10월 24일 운영 카탈로그 시점과 현재 브랜치의 직접 비교

기준 비공개 자료: `ahnbest23-hash/workmoa-backend-private:main/ops/production-schema-baseline-20261024/catalog-metadata.json`. 구조 추출 시점 **2026-10-24 17:26:21 KST**, `public` 함수 208종 + `workmoa_guard` 6종, **실제 직원 행·PIN·로그인 토큰/데이터 접근 없음**. 해당 기록은 **2026-10-25 현재 서버를 재조회한 값이 아님**.

- 운영 `main/index.html` Git blob `897045149eca1ac78e666421635cad0803d02ae3`.
- 검수 `qa-3-8/index.html` Git blob `4aaf055302e5ff967f912353bdba8f24f201cf0f`.
- 양측 모두 `rpc('literal')` 고유 호출 이름은 **71종**. 운영 기록과 비교하면 **main은 68/71종 함수명이 있고 3종은 미확인**(현재 지원 대응중인 `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2`). **qa-3-8은 67/71종 함수명 일치, 나머지 4종은 위 3종 + `list_holiday_work_eligibility_v2`**. 동적 이름 또는 래퍼 호출, 전체 DB 계약의 완전한 검증은 별도이다.
- 운영 main 휴일근무 읽기는 기존 `list_holiday_work_eligibility(p_token)` 호출, 반환 `employee_id`, `holiday_work_enabled`의 2열 구조. 쓰기 `admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled)` **3인자** 호출. 비공개 운영 카탈로그의 함수 이름·인자 계약과 일치.
- 검수 qa-3-8 읽기는 **`list_holiday_work_eligibility_v2(p_token)`**를 요구하며 `eligibility_revision` 숫자까지 확인. 검수 qa-3-8 쓰기는 `admin_set_holiday_work_enabled_v2(p_token,p_employee_id,p_enabled,p_expected_revision)` **4인자** 요청. 10/24 구조 기록에 **신규 읽기 함수 이름 없음, 쓰기 함수 3인자 서명만 있음**.
- 정적 직접 호출 인자 대조: 71종 중 `main`은 지원대상 3종 미존재만 별도 상태, `qa-3-8`은 추가 읽기 함수 미존재 1종과 현재 구조 서명 불일치 쓰기 1종이 있음. **`save_attendance_personnel_v2`, `save_attendance_with_annual_leave_personnel_v2` 호출은 `...legacyPayload` 전개를 쓰므로 일반 텍스트 key 파서만으로 일치/불일치를 단정하지 않는다.**

**결론:** 이 차이는 `qa-3-8`의 **새 CAS 계약이 원본 서버에 아직 연결되지 않은 릴리스 준비 격차**다. **운영 main에서 동일 장애가 발생했다는 증거가 아님**.

## 2. 새 범위 검수 — 14/14 PASS

- GitHub Actions **[Run 40161528424](https://github.com/eco-i/eco-i.github.io/actions/runs/40161528424)** / PASS / 14 assertions.
- QA 전용 재현 스크립트: `qa-round3/e2e/ci/browser-holiday-rpc-catalog-mismatch.py`.
- QA 전용 워크플로: `.github/workflows/workmoa-qa-holiday-catalog-mismatch.yml`.
- 원본 QA 브라우저 UI를 localhost 가상 API로 실행. 이 가상 API는 과거 운영 카탈로그에 `list_holiday_work_eligibility_v2`가 없는 상황을 합성 `HTTP 404 PGRST202`로 모사함. 실제 운영 Supabase 요청/직원 자료 없음, PostgreSQL16은 폐기형 합성 인사 DB.
- 실제 관리자 로그인+2차 PIN 및 직원 목록 3명 로드는 성공.
- `state.holidayWorkEligibilityReady === false`로 최신 조회 **실패를 정확히 표시**. `coreMonthSyncHealthy()` 실패, 없는 CAS revision 숫자 임의 생성 없음.
- 실제 `changeHolidayWorkEligibility(input)` UI handler를 호출해도 쓰기 HTTP 요청 **0**, 가상 DB revision0/event0, JS 미처리 예외 0, hosted Supabase 접속 0.
- 따라서 "**호환되지 않는 서버 계약에서 수정이 차단되는지**"는 검증했지만 "**새 버전 계약으로 정상 저장되는지**"를 원본 서버에서 검증한 것은 아니다.

## 3. 기존에 이미 준비된 대안과 한계

비공개 개발자료 `DRAFT_HOLIDAY_ENABLED_CAS_V2.sql.txt`에는 `eligibility_revision bigint`, 새 읽기 RPC, 필수 4인자 CAS setter 후보가 있음. 첫 `DO ... RAISE EXCEPTION 'WORKMOA_DRAFT_ONLY'`로 실행을 고의 차단하는 **검토 전용 초안**, 실운영 배포 금지.

비공개 `HOLIDAY_ENABLED_CAS_V2_SCOPED_GATE_20261022.md`의 기존 격리 PG17+PostgREST14 **43/43 PASS** Run 39723552930은 합성 사용자를 대상으로 ABA/동시 쓰기 및 권한 오류를 검사했으나, **기존 휴근 저장과 토글 간 일관된 잠금 프로토콜 및 원본 세션/Auth/RLS 동등성**은 완료하지 못했음. 해당 문서는 명시적으로 운영 배포 불승인. 이미 확인한 가상 PASS를 운영 설치 승인이나 현재 본서버 확인으로 승격하지 않는다.

### 안전한 다음 단계

1. 운영`main`은 그대로 두고, QA 코드는 4인자 CAS 필수/미확인 revision을 fail-closed로 유지. **3인자 구버전 함수를 자동 fallback으로 사용하면 lost update 및 ABA 방어가 무너질 수 있어 금지**.
2. 실제 운영 함수 정의/잠금/권한·휴일근무 저장의 동일 직원 row-lock 조정과 독립 QA schema+PostgREST 동등성 확보가 먼저.
3. 승인된 독립 QA 서버에서 새 읽기 3열·쓰기 4인자/정상·경합·Auth/RLS·기존 앱 구버전 차단을 검사한 뒤에만 54 공식 진입판정. 운영 Supabase에 직접 테스트 쓰기/기능 복구·기존 함수 권한 전환을 하지는 않음.
4. 고객센터 답변 대기중인 다른 데이터 관리 3 RPC를 다른 CI/CLI/앱으로 우회 설치하지 않는다.

## 4. 공식 진행 현황

| 지표 | 현 상태 |
|---|---|
| 운영 RPC 복구 | 기존 검증 기준 **23/26 = 88.5%**; 이번 턴에는 운영 서버 실측 없음 |
| 신규 14항목 안전 실패 재현 | **14/14 PASS**(가상 오류 상황, 기존 운영 사용성 PASS 아님) |
| QA 휴근 CAS 계약 연결 | **미완료/BLOCKED** |
| 공식 3차 마지막 완료/다음 | **3-8-53 / 3-8-54 미시작** |
| 3차 신규 결함 / 전체 | **37종 / NOT CLEAN** |
| 운영 main·운영 함수·실제 직원 DB 변경 | **0건** |
