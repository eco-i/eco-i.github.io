# 근무모아 3차·깊이8 — 3-8-27 공식 보고서

## 공식 결과
- **3-8-27 완료 / 신규 확정 결함 1종 (3-8-27-001, MEDIUM), QA 전용 수정.**
- 3차 누적 신규 결함 **18종** (이전 17 + 이번 1). 2차 과거 이력 540종과 별도.
- 이번 범위 **70/70 유효 정적·실제 함수 격리검사 통과**. 실제 서버/기기/전체 앱 CLEAN 판정 아님.
- QA `index.html` 저장·삭제 쓰기 전 검사 두 곳만 수정(+433자). 코드 커밋 `5ffe4f453ad4ac4e8260226418e7f3e5e8876121`, 새 HTML blob `d3e535031861bfdd372fc0b8d1f24ef6070cccdf`.
- 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 변경 없음. 실제 직원 DB·감사 로그·근태 행 조회나 변경, SQL 실행, 운영 배포 **0건**.

## 검수 깊이 8단계
1. **GitHub 공식 상태**: `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-26_REPORT.md` 확인. 원격 공식 마지막 26/다음 27/신규 누적 17, 원본 QA HTML blob `b65582e09c900785c79122217de8b705c069e166` 직접 대조.
2. **실제 UI·접근성 경계 조사**: `focusTargetUsable`, `openBackdrop`, `closeBackdrop`, 팝업·PIN 처리와 nested aria/inert 검토. Chromium 독립 DOM에서 `fieldset disabled` 내부 버튼이 property `.disabled=false`지만 CSS `:disabled=true`임을 관찰. 실제 `index.html`에는 `fieldset`가 전혀 없어 현재 사용자 경로의 신규 제품 결함으로 판정하지 않음. 기존 aria/inert 방어 유지.
3. **휴근 삭제·인사발령 비동기 TOCTOU 재현**: 실제 `deleteHolidayWorkListRow` 분리 실행. `fetchCurrentHolidayWorkRow` Promise 대기 동안 `personnelMutationReady()`를 true→false로 바꿔도 원본은 삭제 RPC 경로에 진입할 수 있음을 가짜 RPC로 재현. 실제 DB mutation 없음.
4. **휴근 저장·인사배치 변경 경합 재현**: 실제 `saveSelectedHolidayWork`도 같은 창 사이 인사 최신성을 재검사하지 않음. 새 인사 상태에서 대상 직원이 휴근 부적격이 됐어도 최초 선택 대상 객체를 기준으로 저장할 수 있는 클라이언트 경로 확인. 수정 후보는 현재 `state.employees`와 자격/인사 최신성 재확인.
5. **QA 수정 회귀**: 저장·삭제 쓰기 직전 가드 두 곳만 추가(+433자). 가짜 RPC·Promise 실제 함수 14/14 PASS: 정상 자기 휴근 저장, 과거 행 삭제, 인사 최신성 상실, 직원 자격 비활성화·마스터 목록 제거, 관리자·세션 상실, 동시 중복 요청 singleflight. 서버 CAS 매개변수 및 기존 에러 처리 보존. QA 코드 커밋 및 새 blob 확인.
6. **Realtime/PIN·권한 변경 안전성**: 실제 `scheduleRealtimeRefresh` 함수+가짜 타이머 12/12 PASS: 초기 PIN 화면, 페이지 숨김, 공유 세션 불일치, 오프라인, 지문 사진 선택, 저장 중 serialized catch-up, 늦은 세션 변경, 새 signal, 실패 refresh. PIN 팝업 닫기·민감 입력 초기화·modal 잠금은 원본 소스 정적 재확인; 실제 PIN 인증은 수행하지 않음.
7. **연차·장기재직 재조회 실패 경합**: 실제 `loadAnnualLeaveData`/`loadLongServiceData`와 가짜 RPC로 12/12 PASS: 원자적 정상 채택, 일부 RPC 실패, 기존 정상 스냅샷 보존, 다른 연도 혼동 방지, shared 세션 전환, 장기재직 dirty 제외기간 보존. 실제 저장·직원 DB 접근은 없음.
8. **정적 회귀·범위·인계**: 패치 위치 2개만 역비교, inline JS 2개 파싱, 488개 HTML ID 유일, 이전 포커스·PIN·session·Realtime/연차·장기재직·휴근 CAS 보호 확인 **32/32 PASS**. 새 QA 코드 다시 직접 조회해 12개 후속 guard 점검(정적 32개와 중복되는 항목은 공식 70개에 재산입하지 않음). 공식 유효 합계 **14+12+12+32=70**.

## 후속과 한계
- 신규 결함 3-8-27-001 상세: `qa-round3/issues/3-8-27-001_HOLIDAY_WORK_STALE_PERSONNEL_PREFLIGHT_RACE.md`.
- 수정 테스트는 실제 코드에 모의 인사상태/서버 결과를 조합한 클라이언트 분리검증. 실제 원격 Supabase 동시 세션, 직원/관리자 실로그인, 물리 Android/iOS, 운영 앱 Chromium 통합·보조공학 검증은 수행하지 않음.
- **다음 3-8-28**: 휴근 저장·삭제 성공 후 인사/세션 상태 변화에 따른 최종 알림·복구 및 CAS, Realtime pending catch-up과 팝업 권한 강등, 브라우저 실제 modal focus/disabled state (QA 환경에서만). 운영 `main`/실 직원 DB 계속 보호.
