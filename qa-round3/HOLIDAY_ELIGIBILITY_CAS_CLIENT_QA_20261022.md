# 3차 깊이8 — 휴일근무 가능 설정 4인자 CAS 클라이언트 보강 (3-8-54 사전 범위)

**2026-10-22 KST | QA ONLY | 부분 검증 PASS / 종합 3-8-54 블록은 여전히 BLOCKED / 전체 NOT CLEAN**

## 왜 수행했는가
- 기존 QA/운영 앱 `list_holiday_work_eligibility`는 직원별 Boolean만 읽고, 최신 변경 RPC `admin_set_holiday_work_enabled_v2`에 `p_token,p_employee_id,p_enabled` 세 인자만 보내므로 두 관리자 동시 변경에서 stale/ABA를 검출할 수 없음.
- 비공개 SQL 후보 `DRAFT_HOLIDAY_ENABLED_CAS_V2.sql.txt`가 요구하는 계약은 `list_holiday_work_eligibility_v2`의 `eligibility_revision`와 **필수 `p_expected_revision` 4번째 인자**. 독립 PostgreSQL17/PostgREST14.18 43/43 및 휴근 저장 교차잠금 46/46은 이미 합성 격리 통과했지만 프런트 연결은 없었음.

## 수행한 QA 브랜치 변경
1. `qa-3-8/index.html`: 온라인 휴근 가능 설정 조회를 `list_holiday_work_eligibility_v2`로 교체. `employee_id`, Boolean, **0 이상 안전한 정수 revision**이 모든 직원마다 1개씩 있어야 `holidayWorkEligibilityReady=true` 설정; 누락·중복·문자열·음수·최대 안전정수 초과·조회 실패는 변경 잠금. 실제 직원 ID/민감자료를 저장소에 담지 않음.
2. 관리자 휴근 설정 변경 시 **조회에서 얻은 직원별 revision을 캡처**하고 RPC 인자 `p_expected_revision` 추가. revision 부재/유효하지 않으면 서버 쓰기 0. 기존 확인창·Pending·세션/인사 권한 보호 유지.
3. 서버가 `STALE_HOLIDAY_ELIGIBILITY` 충돌을 반환하면 같은 이전 revision으로 재시도하지 않고 직원/인사/허용정보의 최신 원본을 재조회. 성공하면 사용자에게 다른 관리자의 선행 변경을 안내, 실패하면 데이터 보존하되 변경 버튼 잠금·새로고침 안내. 실제 성공 응답과 실패 경로를 분리.
4. 테스트용 가상 서버 `browser-attendance-form.py`는 `list_holiday_work_eligibility_v2` 가상 직원 1명의 revision=0을 응답하도록 보강. 구버전 읽기 응답은 회귀 비교용으로 보존.
5. `rpc-recovery-integrity-gate.mjs`는 과거 `main`의 고정 26개 이름·31 호출 위치/인자는 그대로 엄격히 검사하되, **유일하게** QA만 `admin_set_holiday_work_enabled_v2`의 필수 `p_expected_revision` 한 필드 추가를 허용하도록 정확히 한정. 다른 필드/함수 변경은 여전히 fail closed. 이전 26개 미설치 스냅샷은 **과거 이력**이며 2026-10-22 사용자 승인 메모3 운영 복구 후 실제 남은 미설치 23개로 구별.

## 실행 증빙
- [QA 새 런타임 9/9 PASS: Run 39744288968](https://github.com/eco-i/eco-i.github.io/actions/runs/39744288968) — 실제 프런트 함수 원문 추출+Node VM 합성 데이터 테스트: 버전읽기·엄격검증·중복/누락·4인자 쓰기·0/음수/잘못된 expected 차단·stale 409 재조회/실패 시 lock·일반 실패·오프라인 처리.
- [기존 정적 호출 계약 gate PASS: Run 39744367713](https://github.com/eco-i/eco-i.github.io/actions/runs/39744367713) — frozen main 계약 검증 유지 + 허용한 단일 QA CAS 계약 예외만 인정.
- 초기 실패 Run 39744187905: synthetic Node VM 내 `todayKey` stub 누락. 누락 stub만 보정하여 최종 Run 39744288968 PASS. 별도로 기존 정적 계약 Run 39744030026은 옛 QA=main 3인자 가정으로 FAIL, 이후 정확한 QA 전용 4인자 정책 검증으로 교체 후 PASS.
- **기존 Chromium 회귀 3개 최종 PASS**: [휴일근무·초과근무 실패 UI Run 39744390017](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390017), [근태 등록 UI+독립 PostgreSQL Run 39744390068](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390068), [개인 메모 404 오류·초안 보존 Run 39744390034](https://github.com/eco-i/eco-i.github.io/actions/runs/39744390034), 모두 SUCCESS. 다만 기존 가상 RPC 응답 테스트이며 새 휴근 토글 UI 실 PostgREST 성공 E2E를 의미하지 않음.

## 출시 차단 / 후속
- 휴근 가능 설정 관련 신설 SQL의 **운영 배포 없음**: 기존 운영 `main`은 2열 읽기/3인자 쓰기 계약이며, 운영 DB 최신 `list_holiday_work_eligibility_v2` 및 4-arg `admin_set_holiday_work_enabled_v2`는 아직 실제 설치되지 않음.
- 서버 측 글로벌 eligibility와 실제 본인/관리자 휴근 저장 RPC의 공통 직원 잠금, 변경 감사 원자성, 운영 인사 효력일/계정 PIN/Auth/RLS 권한 등가 및 실 관리 화면 2관리자 경쟁·실패 재조회 **Chromium→진짜 PostgREST→독립 PG 전체 연결 E2E**는 미확인.
- 이번 QA 브랜치 보강은 서버 기능 복구 0종, 운영 데이터/DDL/RPC 변경 0, 운영 `main` 배포 0. 메모 3종 복구는 이미 별도로 사용자 승인 및 완료; 26개 누락 중 **남은 23개**는 여전히 다른 기능의 출시 차단.
- **공식 마지막 3-8-53 완료 / 다음 3-8-54 보류 / 3차 신규 제품 결함 37종 / 전체 NOT CLEAN**. 별도 종료승인 없이는 3-8-54 완료 금지.
