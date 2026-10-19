# 3-8-15-001 — 감사로그 팝업 재열기 시 오래된 응답 사용

- 신규 운영 제품 결함: **1종** (중간).
- 대상: 운영 `main/index.html`의 `openAudit()`·`loadAuditPage()` 호출 관계.
- 검수/수정: `qa-3-8/index.html` commit `194f9d45c118165e4129788150155a099f57130a`, blob `76be467649cbe398198282639f93328dd6c1df9a`. **운영 미배포**.

## 실제 코드 재현
1. 관리자 ‘최근 변경 내역’ 열기: `openAudit` → `loadAuditPage(true)`; `auditLoading=true`, 느린 GET-A 송신.
2. 팝업 닫기 후 다시 열기. `backdropOperationPending('auditBackdrop')`는 별도 잠금이 없어 닫을 수 있다.
3. 두 번째 `openAudit`가 `loadAuditPage(true)`를 부르지만 앞선 `auditLoading` 때문에 즉시 `false`로 종료되어 새 GET-B를 보내지 않는다.
4. GET-A의 오래된 결과가 뒤늦게 돌아오면 새로 열린 팝업에 그대로 렌더된다. `realtimeNeedsCatchup=false`라면 재시도도 예약되지 않는다.
5. 실제 운영 HTML 함수 + 지연 RPC 모의 검증에서 **조회 1회만 전송**, 오래된 결과 표시를 재현. 실제 운영 DB/직원 기록 읽기·쓰기 없음.

## QA 수정
- `openAudit`가 호출됐는데 지난 조회가 진행 중이면 `auditPageLoadSeq`를 올려 **지난 응답 소유권을 폐기**, `auditLoading=false`로 만든 후 새로운 `loadAuditPage(true)`를 시작.
- 기존 `loadAuditPage`의 요청 세대 검사/오류 무시/최신 결과 사용/Realtime catch-up 보류 메커니즘과 연동.
- old/new 응답 순서 양방향, 이전 오류→새 성공, 새 실패→이전 성공, deferred realtime, 관리자 권한 상실, 연속 세 번 열기, 수정 전 재현 **8/8 시나리오 PASS**.
- 새 QA HTML 내장 스크립트 두 개 `new Function` **2/2 구문 검사 통과**.
- 실제 Chromium 전체 앱·실 관리자 로그인·서버 동시성 E2E는 미검증.

운영 기준: `main` SHA `6c784210e048426f18a486d5602652626d97574d`, `ver20261018-2313` 유지. SQL/실직원 기록 변경 0건.
