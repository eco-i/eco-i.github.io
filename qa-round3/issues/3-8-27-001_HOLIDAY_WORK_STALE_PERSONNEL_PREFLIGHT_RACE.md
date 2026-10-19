# 3-8-27-001 — 휴근 저장·삭제 비동기 사전조회 중 인사정보 최신성 상실 후 쓰기 진행

- 제품 결함: 1종 (동일한 인사정보 TOCTOU race가 휴근 저장·목록 삭제 두 경로에 존재)
- 심각도: MEDIUM (클라이언트 사전조건 이탈 후 변경 RPC 호출 가능; 서버가 실제 기록 변경을 허용한다는 주장은 아님)
- QA 브랜치: `qa-3-8`. 운영 `main`·실직원 DB·SQL은 일절 변경하지 않음.

## 원인·재현
기존 `saveSelectedHolidayWork` 및 `deleteHolidayWorkListRow`는 진입 시 `personnelMutationReady()` 검사 후 근태나 휴근 최신 행 조회를 비동기로 기다린다. 조회에서 돌아온 후 `operationCurrent()`는 세션·읽기전용·관리자 권한을 검사하지만 인사정보 최신성은 재검사하지 않는다. 저장 함수는 갱신된 `state.employees`의 동일 직원 휴근 가능 여부도 다시 확인하지 않았다.

실제 GitHub QA JS 함수를 가짜 Promise/RPC로 지연 실행하고, `fetchCurrentHolidayWorkRow`를 기다리는 동안 `personnelMutationReady`를 false로 바꾼 뒤 이전 휴근 행과 같은 결과를 반환했다.
- 원본 **저장**: `save_my_holiday_work_personnel_v2`/관리자 저장 RPC가 호출될 수 있음(격리 mock 1회).
- 원본 **삭제**: `delete_my_holiday_work_personnel_v2`/관리자 삭제 RPC가 호출될 수 있음(격리 mock 1회).
- QA 수정: 두 경로 모두 동일 조건에서 **쓰기 RPC 0회**.
- 유효 인사 마스터가 새로 적용돼 대상 일근 직원의 휴근 가능 설정이 해제되거나 해당 ID가 명단에서 사라진 경우에는 저장을 차단. 과거 기록 삭제는 새 배치가 달라도 인사 최신성이 확인되고 관리 권한이 유지되면 기존처럼 허용.
- 이는 클라이언트 RPC 송신 경합의 재현이며 **실제 서버 기록 삭제·저장 성공/서버 권한 우회 증거가 아님**. 서버의 최신 인사배치·CAS 검증은 별도이며 변경하지 않음.

## QA 최소 변경
`saveSelectedHolidayWork`: 사전조회 완료 직후, 변경 RPC 이전에 `state.employees`에서 현재 대상 직원 재조회, `personnelMutationReady()`·직원 존재·`holidayWorkRegistrationEnabled(freshTarget,key)` 모두 검사. 불충족 시 입력값 보존하고 최신 확인 요청 메시지 표기.

`deleteHolidayWorkListRow`: 사전조회 완료 직후, 변경 RPC 직전에 `personnelMutationReady()` 재검사. 실패 시 중단 메시지. 기존 서버 ID·updated_at CAS, 관리자 권한, 세션, 팝업 pending/중복 요청 가드 유지.

두 함수의 guard 삽입만 변경(+433자). 별도 SQL/설정/HTML 구조 변경 없음.

## 범위·시험·미검증
- 원본과 수정 후보 각각 지연 RPC 재현(저장·삭제), **수정 후보 14/14** 경합·정상 동작: 인사 최신성 상실, 휴근 비활성화, 직원 최신 목록 제외, 관리자/세션 상실, 같은 날짜 연속 제출, 정상 저장·삭제, 변경된 근무자격에서 과거 기록 삭제 등 확인.
- 최신 QA 커밋 본문 재조회 후 저장·삭제 소스와 코드 보존 가드 12/12 점검.
- Realtime 스케줄러 실제 소스 + 가짜 타이머 12/12, 연차·장기재직 읽기 실제 함수 + 가짜 RPC 12/12, 정적/JS/DOM 32/32 포함 블록 유효 고립검사 **70/70**.
- Chromium 합성 DOM 탐색에서 disabled fieldset 내부 버튼이 `:disabled`에는 해당하지만 `.disabled`에는 false인 점을 확인. 현재 QA HTML에는 `fieldset` 태그가 0개이므로 새로운 *제품 결함*으로 산입하지 않고 향후 실구현 시 검토 대상으로 남김.
- PIN 전환·실제 두 사람 세션, Android/iOS, 실제 전체 앱 브라우저, Supabase DB 읽기/쓰기 및 실시간 경합 **미검증**. 실사용·전체 앱 CLEAN 아님.

QA 수정 커밋: `5ffe4f453ad4ac4e8260226418e7f3e5e8876121`
최신 QA HTML blob: `d3e535031861bfdd372fc0b8d1f24ef6070cccdf`
