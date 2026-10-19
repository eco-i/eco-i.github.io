# 3-8-23-001 — 중첩 팝업의 이전 타이머가 하위 팝업 포커스를 일시적으로 탈취

- 등급: LOW (키보드/보조공학 접근성 및 포커스 안정성)
- 범위: `qa-3-8/index.html` 내 `focusTopBackdrop`와 `openBackdrop` 지연 포커스 콜백
- 운영 main 적용: **아니오** / 실제 직원 DB 조회·쓰기: **없음**

## 재현과 영향
실제 QA HTML에서 추출한 `openBackdrop`, `topOpenBackdrop`, `focusTopBackdrop`, `syncBackdropAccessibilityStack`를 모의 DOM/타이머로 실행했다.
동일 JS 턴에 팝업을 A→B→C로 여는 경우 기존 `openBackdrop`이 각 팝업마다 포커스 타이머를 등록한다. A의 타이머가 실행될 무렵 실제 맨 위 팝업은 C인데도, 원본 `focusTopBackdrop(A)`는 단순히 A가 열려 있다는 이유만으로 숨겨진 A 내부에 포커스를 옮겼다.
- 원본 두 팝업 포커스 기록: A→B (A는 aria-hidden=true)
- 원본 세 팝업 포커스 기록: A→B→C (A/B는 aria-hidden=true)
- 한 팝업에서는 이상 없음
실기기/전체 앱 통합에서 발생 빈도와 스크린리더 체감 수준은 **미검증**. 코드 흐름 기반의 접근성 결함이다.

## QA 전용 수정
```js
function focusTopBackdrop(backdrop){
  if(!backdrop?.classList.contains('open')||topOpenBackdrop()!==backdrop)return;
  // 나머지 기존 로직 유지
}
```
변경은 해당 가드 한 줄만 적용(+30자). 팝업 순서, 팝업 닫기/복귀, API, 근태 데이터 로직 변경 없음.

## 재검증
- 원본 1/2/3중 팝업 모의 DOM 재현 3/3 기대 관찰.
- 수정 후보 1/2/3중 팝업 포커스 소유권 3/3 기대 관찰; 2/3중에서는 맨 위 팝업만 포커스.
- 팝업 Tab/Escape 실제 핸들러 분리 검사 10/10 통과.
- 패치 전후 index.html 다른 내용 동일, 인라인 JS 2개 파싱 성공, 정적 회귀 21/21 PASS.
- 실제 모바일·스크린리더와 완전한 인증 앱 Chromium E2E는 수행하지 않음.

수정 커밋: `eb546ea8380f6c6a5912272ba47af90025981aeb`
QA 수정 HTML blob: `4fc8dcbde1bb9c9a85f637921db0ed872b6a57f4`
