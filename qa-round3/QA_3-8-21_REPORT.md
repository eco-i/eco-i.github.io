# 근무모아 3차·깊이8 — 3-8-21 공식 보고서

## 공식 결과
- **3-8-21 범위 검수 완료, 신규 확정 결함 1종(3-8-21-001), 전체 CLEAN 아님.**
- **3차 신규 누적 12종** (직전 11 + 이번 1). 2차 결함 이력 540종 별도.
- QA branch `qa-3-8`의 `index.html` 날짜 선택 달력 렌더러만 수정. QA 코드 커밋 `49ba06da4dfdf9526ecf5e21adbf1beea33467d5`.
- 최신 QA HTML blob `ce076c820937c62bf6b2a2d1f471f9fbf0fe0ce6`. 운영 main 기준 `6c784210e048426f18a486d5602652626d97574d`, 운영 버전 `ver20261018-2313` **미변경**. 실제 직원 DB DML, 운영 SQL 변경 및 main 배포 **0건**.

## 깊이 8단계 검수
1. **GitHub 공식 인수인계**: qa-3-8의 CURRENT_STATE, START_HERE_NEW_CHAT, QA_3-8-20_REPORT 직접 확인. 마지막 20, 다음 21, 누적 11종, 최신 원본 HTML blob 확인. main...qa ahead 95/behind 0.
2. **휴근 삭제 실제 비동기 함수**: `deleteHolidayWorkListRow`의 최신행 사전 확인, 동일 직원·날짜 중복 방지, preflight stale 차단, 관리자 권한 상실/세션 전환 중 mutate 거부, 실패 안내, 성공 후 조회·pending 해제 등 **14/14 실제 함수 mock 검사 PASS**. 실서버 삭제는 하지 않음.
3. **모바일 날짜 선택기 탐색**: `openAttendanceDatePicker`, `chooseAttendanceDate`, `renderAttendanceDatePicker` 실제 소스 및 기간·단일 선택 모드, 달력 월 탐색·최소 날짜 조건·팝업 초점 흐름 검토.
4. **신규 결함 재현(3-8-21-001)**: 기간 근태에서 시작일 날짜 버튼이 포커스된 상태로 선택되면 `chooseAttendanceDate`가 `renderAttendanceDatePicker`를 재호출. `innerHTML`로 기존 버튼을 제거해 포커스가 BODY로 이동하며 종료일 선택기가 열린 채로 남음. 원본 함수 기반 가짜 DOM 재현과 headless Chromium 390x844 독립 DOM 시험에서 재현.
5. **QA 전용 수정**: `renderAttendanceDatePicker`에서 기존 날짜 버튼의 키를 포착하고, 재렌더 뒤 열린 팝업의 동일 버튼·다음 사용 가능 버튼·마지막 버튼·월 이동 버튼 순으로 `focus({preventScroll:true})`하여 키보드 포커스 유실 차단. 해당 함수에만 633자 순증. HTML CSS/ID/근태 데이터·RPC 무변경.
6. **재현·재발방지 회귀**: 날짜 선택기 원본/수정 동작 분리 실행 **11/11 PASS**; 별도 독립 headless Chromium 실제 DOM 포커스 재현·복구 **1/1 PASS**. 전체 앱 Chromium 로그인, iOS/Android 실기기 테스트로 주장하지 않음.
7. **저장 직후/Realtime 및 구조 점검**: 저장 중 관리자/세션 소유권 검사·연차/장기재직 stale 데이터 차단·Realtime pending guard·달력 2026~2035 경계·팝업 Tab/Escape·모바일 viewport·2개 inline JS 파싱·486개 고유 HTML ID·렌더러 외 소스 불변 등 **24/24 정적 검사 PASS**. 실제 연차/장기재직 저장 RPC 실행 안 함.
8. **종합·보호 확인**: 이번 범위 **50/50 검증 통과(11+1+14+24)**. 신규 제품 결함 1종(접근성 문제) QA 수정. 3차 누적 12종, 기존 11종 수정 이력 보존. 운영 main·직원 DB·SQL 무변경, 모바일/실서버 E2E 미검증 범위 명시.

## 한계·후속
- 실제 전체 앱 로그인 및 상호작용을 포함한 Chromium E2E/물리 Android·iOS, 실제 다른 직원과 동시 휴근 편집·삭제/동시 연차 저장은 수행하지 않음. 가짜 RPC·DOM 검사 PASS는 실서버 mutation 성공 증명이 아님.
- 상세 결함 `qa-round3/issues/3-8-21-001_DATE_PICKER_FOCUS_LOSS.md`.
- **3-8-22** 권고: 날짜 선택 모드 전환과 탭 이동 실제 전용 브라우저 가능 범위, 휴근 동일 날짜 상충 저장/삭제와 인사 변경 이력, 모바일 팝업 3중 중첩·스크린리더, 저장 성공 시 Realtime 후속 조회. 운영 `main`/실직원 DB 변경 금지.
