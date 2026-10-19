# 근무모아 3차·깊이8 — 3-8-14 검수 보고서

## 결과
- **3-8-14 검증한 범위 CLEAN**, 신규 제품 결함 **0종**.
- 3차 누적 **8종 유지**, 2차 역사적 결함 540종 별도.
- 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d`, 버전 `ver20261018-2313`.
- 코드·DB·직원 근태 기록 운영 변경 **0건**. 이번 블록은 QA 수정 코드도 변경하지 않음.

## 깊이8 점검 (1~4)
1. 최신 `CURRENT_STATE.json`, 인수인계, 3-8-13 보고서 및 브랜치 compare 재확인.
2. 근태 폼의 원본 `attendanceFormDirty`, `attendanceRecordSourceSnapshot`, `syncCleanAttendanceFormFromLatestAttendance`를 실제 함수로 격리 실행. 수정 중/저장·삭제 중 보존, clean 폼 최신 반영, 서버 삭제 시 안전 종료, 병가 부분 응답, 관리자·직원 구분 **12/12 PASS**.
3. 원본 `renderAnnualLeaveSettingInputs` 실제 함수 검사. 연차 dirty 입력 보존, readonly·페이지 복귀·조회중·서버실패·저장중 잠금, 2026 잔여연차 **9/9 PASS**.
4. 원본 `refreshAnnualLeaveUsagePreservingDraft` 실제 비동기 함수와 모의 RPC로 서버 성공·오류·연도 변경·입력 상태 변경·로그아웃·화면 전환·세션 변경 **7/7 PASS**.

## 깊이8 점검 (5~8)
5. 실제 `visibleServerScreenSignature`·`markVisibleServerScreenValidated`: 직원 PIN·근태·전체 근태·메모·휴일근무·초과근무·감사·용량·백업·인사 편집 등 **10개 보조창**의 열기/닫기, 조회 세대 변경, 관리자 권한 및 인사 저장중 조건 **17/17 PASS**.
6. 실제 `populateAnnualLeaveYears`: 범위 아래 2025, 최소 2026, 2030, 최대 2035, 초과 2036/2040, 기본 연도 등 **7/7 PASS**. 선택지 2026~2035만 표시.
7. 대형 원본 `index.html`(GitHub 원본 blob)과 QA `maintenance-20261018.js`의 정적 연결 검사. 필수 ID 26개 및 QA 정비 코드 정적 ID 26개 **누락 0**; 검사기가 인식한 HTML ID 486개에서 중복 0. 관리자 팝업 `maintenanceOpen()`의 권한/연결/준비상태/초안 복제 **5/5 PASS**.
8. `main...qa-3-8` 기준 SHA 및 운영 격리 확인. `main`에 추가 수정 없음. 이번 블록의 검증은 **기능/화면 관련 실제 JS를 V8에서 모의 DOM·RPC로 격리 실행 및 HTML 정적 검사**한 결과. Chromium 원본 전체 앱 로그인·모바일 실기기·실계정·실 DB 병렬 갱신은 **검증하지 않았음**.

## 계수 및 한계
- 모의 DOM/RPC **12+9+7+17+7+5 = 57 시나리오 PASS**. 추가로 ID 검사 26+26 누락 0.
- 기존 제품 결함 **3차 8종**은 QA 수정/후보 상태로 운영 미배포. 이번 신규 0종, 수정 0건.
- 실제 브라우저의 픽커·포커스·키보드·스크린리더·특정 기기 레이아웃까지 CLEAN 주장 금지.

## 다음 3-8-15
- 보조 팝업 닫힘→재열림·더보기 비동기 레이스, 연차 사용·예정·근태 편집 동시 갱신, 모바일 원본 CSS/접근성 경계 및 실세션 테스트가 필요하면 별도로 위험 없이 검증 가능한 방법 마련. 운영 코드/실직원 데이터 변경 금지.
