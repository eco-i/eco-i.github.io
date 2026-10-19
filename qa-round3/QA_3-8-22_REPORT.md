# 근무모아 3차·깊이8 — 3-8-22 공식 보고서

## 공식 판정
- **3-8-22 범위 완료 / 신규 확정 제품 결함 0종 / 범위 한정 CLEAN**. 전체 앱·실사용 검증 CLEAN 아님.
- 3차 누적 **12종 유지**, 과거 2차 이력 540종 별도. QA 제품 코드 및 SQL 변경 **없음**.
- QA index.html blob `ce076c820937c62bf6b2a2d1f471f9fbf0fe0ce6` 유지, 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 불변.
- 실제 직원 기록 및 감사로그 조회·변경, Supabase DML/DDL, main 배포 **0건**.

## 깊이 8단계
1. GitHub qa-3-8의 CURRENT_STATE.json/START_HERE_NEW_CHAT.md/QA_3-8-21_REPORT.md 확인: 공식 마지막 21, 다음 22, 신규 누적 12, QA HTML blob 일치. main 대비 QA ahead 100/behind 0.
2. 날짜 선택기 원본 `renderAttendanceDatePicker`, `chooseAttendanceDate`, `moveAttendanceDatePickerMonth` 모의 DOM 실행: 2026-01, 2035-12 경계, 12월/1월 이월, 기간 시작·종료일, 포커스 복원 및 비활성 날짜 필터 확인.
3. 날짜 선택기 동적 검사: 유효한 **18/18 PASS**. 초기 별도 모의 닫기 함수가 실제 `closeBackdrop`의 포커스 복구를 구현하지 않아 BODY 포커스를 요구했던 1개 fixture 기대조건은 폐기(제품 결함·검사 통과로 집계하지 않음).
4. 휴근 삭제 원본 `deleteHolidayWorkListRow` 분리 실행+지연 mock RPC: 최신 서버 행 스냅샷 사전 대조, 중복 삭제 방지, 직원 2 대상 관리자 전용 삭제, 관리자 권한 박탈·세션 전환 후 mutate 중단, 취소·readonly·다른 save pending·서버 실패 시 안전 정리 **17/17 PASS**.
5. Realtime `scheduleRealtimeRefresh` 실제 함수+가짜 timer/refresh: 저장 중 refresh 직렬화, 350ms→650ms catch-up, 여러 신호 병합, offline/hidden/shared-login/PIN 경계, 응답 중 새 signal 보존, 실패 시 catchup 유지 **16/16 PASS**.
6. 연차 `saveAnnualLeaveSetting`·장기재직 `saveLongServiceSetting`의 현재 화면과 서버 snapshot 비교/사용내역 fresh 가드 및 휴근 삭제 CAS 파라미터를 원본 소스로 점검. 실제 mutation RPC 호출은 없음.
7. 정적 회귀 **29/29 PASS**: 날짜선택 키·대체 포커스·DOM 범위, 휴근 예상 ID/updated_at, 연차·장기재직 stale save 경계, Realtime 정렬, Tab/Escape, 모바일 viewport, inline JS 2개 구문 파싱, HTML ID 486개 중 중복 0. 최초 4개 false는 테스트 소스 슬라이서가 async 함수의 단어 function에서 조기 종료한 fixture 오류이며 슬라이서를 수정해 4/4 재검증 PASS.
8. 유효한 동적·정적 검사 합계 **80/80 PASS** (날짜 18 + 휴근 17 + Realtime 16 + 정적 29). 이번 블록에서 확정할 신규 제품 결함은 없으며 QA app 소스 무변경.

## 범위 및 미검증
- 실행 검사는 GitHub에서 추출한 실제 JS 함수를 **가짜 DOM/타이머/Promise/RPC**와 결합한 격리시험이며, 실제 전체 로그인 앱 Chromium, Android/iOS 실기기, 실제 Supabase 관리자/직원 동시 세션 및 실제 mutation 후 실시간 갱신은 검증하지 않음.
- 검수 중 직원·근태·휴근·감사 DB 행을 조회 또는 수정하지 않았음.
- 테스트 fixture와 실제 코드 결함을 구분했고, fixture 오류를 PASS로 집계하지 않았음.

## 다음 3-8-23
- 휴근 편집 복귀·동일 날짜 세션/인사발령 경계, 연차/장기재직 optimistic-save 후 화면 회복, 모바일 키보드 Tab/Escape 중첩 modal 접근성, 실제 앱 통합이 가능한 비운영 조건 탐색. QA에서만 수정, 운영 main·직원 DB 보호.
