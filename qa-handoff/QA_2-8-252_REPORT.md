# 근무모아 2차·깊이 8 — 2-8-252 공식 완료 보고

**KST 시작:** 2026-10-14 20:35경. **공식 완료:** 2026-10-14T20:56:34.669+09:00. 심층검수 실제 20분 이상. 중간보고 20:43, 20:47, 20:52 KST.

## 기준 및 공식 상태
- 마지막 유효 완료 **2-8-252**, 다음 **2-8-253**, 독립 제품 결함 **535→536종** (252차 신규 +1종).
- QA 브랜치 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL/운영 배포/버전 변경 없음. APP_VERSION `ver20260927-0944`.
- 252 불변 시작 `qa-handoff/index.before-2-8-252.html`: SHA-256 `90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e`, 1,173,752 bytes, Git blob `db7b1904ad620ac7fc630ff4c13ac57487983227`.
- QA `index.html` / `qa-handoff/index.working-2-8-252.html` / 차기 불변 `qa-handoff/index.before-2-8-253.html` 동일: SHA-256 `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`, 1,174,027 bytes, Git blob `f530e495859f46f0eaa669acdbc8e7a3f6907bdf`.

## 신규 독립 제품 결함 1종: 네이티브 확인창 이후 공유 로그인 철회 전파 지연
- 원인: 사진 등록·삭제, 메모, 사내일정, 휴근, 근태 저장/삭제 등 총 11개 변형의 직접 `confirm()` 호출에 `markNativeDialogReturn()` 누락. Chromium에서 다른 탭의 `localStorage` 삭제가 네이티브 창 직후 짧게 보이지 않아 철회된 토큰으로 보호 RPC를 보낼 수 있음.
- 실제 Chrome RED [#38558453478](https://github.com/eco-i/eco-i.github.io/actions/runs/38558453478) **10 PASS/2 FAIL**. 지문 사진 비근무일 확인창이 열린 동안 다른 탭에서 (a) 공유 저장소 전체 삭제, (b) 공유 세션 키 개별 삭제. 두 경우 모두 철회된 토큰으로 `save_my_fingerprint_photo` RPC 전송. 정상 로그인 컨트롤은 정상.
- 수정: 11곳의 직접 네이티브 확인 직후 `markNativeDialogReturn()`을 호출. 이미 있는 180ms 소유권 반영 유예와 RPC 송신 직전 가드 재검사를 모두 활용. 기존 pre/post 확인창 가드 11개를 유지하고 추가 로직은 단 한 가지 공통 원인만 수정.
- Chrome GREEN [#38558725521](https://github.com/eco-i/eco-i.github.io/actions/runs/38558725521) **12/0**. 모바일 에뮬레이션 [#38559156586](https://github.com/eco-i/eco-i.github.io/actions/runs/38559156586) **12/0**. 18개 독립 Chrome 컨텍스트 반복 [#38559348314](https://github.com/eco-i/eco-i.github.io/actions/runs/38559348314) **72/0**.
- 11개 변경 위치: `handleFingerprintPhotoInput`, `deleteFingerprintPhoto`, `deleteSelectedDateMemo`, `deleteSelectedMemos`, `deleteCompanyEventManage`, `saveSelectedHolidayWork`, `deleteSelectedHolidayWork`, `deleteHolidayWorkListRow`, `saveAttendance` 2곳, `deleteRecord`.

## 깊이8 브라우저·상태 회귀
- 같은 후보 SHA `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`에서 실제 Chromium 8계층 종합검사 **214 PASS/0 FAIL × 독립 3회**: [#38558897297](https://github.com/eco-i/eco-i.github.io/actions/runs/38558897297), [#38559179238](https://github.com/eco-i/eco-i.github.io/actions/runs/38559179238), [#38559178870](https://github.com/eco-i/eco-i.github.io/actions/runs/38559178870).
- PC/모바일 세션 범위 324조합과 로그아웃 tombstone 324조합, 총 **648 PASS**: [#38559555387](https://github.com/eco-i/eco-i.github.io/actions/runs/38559555387).
- HTML·SHA·바이트·인라인JS 2개 문법·정적 DOM 고유 ID 457개·APP_VERSION·11개 원본 대조 hunk/22 diff lines·변경 전후 confirm 소유권 가드·3개 후보 파일 Git blob 일치: [#38559795074](https://github.com/eco-i/eco-i.github.io/actions/runs/38559795074) PASS.
- 중간 전체 테스트 한 차례 실패는 테스트가 구 SHA/바이트 기대값을 유지한 하네스 문제로, 새 기준 SHA로 정정 후 214건 3회 모두 PASS. **제품 결함 집계에 포함하지 않음.**
- 미검증: 운영 Supabase/RLS/인증 다중 사용자, 물리 Android 카메라·파일 선택기, iOS Safari, 지속 BFCache, 운영 백업·복원. 실 Chromium이나 RPC는 스텁.
- 상세 검수 자료 및 소스는 GitHub에 보관. 대화 출력만 최소화하고 검수 깊이·시간·테스트 반복은 줄이지 않음.

## 다음
**2-8-253**, 불변 기준 `qa-handoff/index.before-2-8-253.html`. High·깊이8 유지, 블록마다 최소20분 실제검수, 20분 이내 KST 보고, 발견 즉시 수정·회귀. main/SQL/APP_VERSION/실배포 불변, ZIP 금지.
