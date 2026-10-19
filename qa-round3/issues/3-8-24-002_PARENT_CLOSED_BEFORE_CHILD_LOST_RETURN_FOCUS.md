# 3-8-24-002 부모 팝업이 자식보다 먼저 닫히면 자식 닫기 이후 원래 화면 포커스 상실

- 유형: UI/접근성·강제 닫기 경계, LOW
- 수정: `qa-3-8/index.html` `closeBackdrop`의 복귀 포커스 소유자 관리
- 운영 적용/직원 DB: 둘 다 없음

## 재현
원본/후보 동일 기능을 Chrome 390×844 독립 DOM에서 실험:
1. 화면 트리거에 포커스 → A 열기 → B 열기.
2. B가 열린 상태에서 먼저 A를 닫는다(예: 강제 닫기, 동시 열기·닫기 경계).
3. B의 `backdropReturnFocus`는 이미 닫힌 A 내부 버튼을 가리킴.
4. B까지 닫으면 그 요소는 렌더링 불가(사실상 focus 불가). Chrome 원본 최종 activeElement는 트리거가 아닌 BODY(빈 ID)로 남음.
5. 같은 조건에서 수정 후보는 원래 트리거로 포커스 복귀.

## QA 수정
A를 닫고 복귀 초점 정보를 제거하기 전에, 다른 열린 팝업이 A 내부 요소를 복귀 위치로 기억하고 있다면 A의 원래 복귀 위치를 승계한다.
```js
const returnFocus=backdropReturnFocus.get(id); backdropReturnFocus.delete(id);
for(const [otherId,otherReturnFocus] of backdropReturnFocus){
  if(otherId!==id&&otherReturnFocus&&el.contains(otherReturnFocus))backdropReturnFocus.set(otherId,returnFocus);
}
```
팝업 close()/force close 권한·데이터 변경, 실제 저장 중 lock 등 기존 로직은 바꾸지 않음.

## 회귀 범위
- 원본 순서 permutation 27개 중 12개에서 포커스 소유권 실패(재열기 버그와 결합된 수).
- QA 수정 후 27/27 정상, 추가 경계 7/7, 키보드 핸들러 14/14 통과.
- 모의 환경의 `HTMLElement` 상속을 빼먹어 가짜 null returnFocus가 생긴 최초 테스트 실패는 fixture 수정 후 전량 재실행. 제품 결함에 미산입.
- 실제 전체 앱 인증·다중 사용자의 팝업 경합은 미검증.
- QA 수정 커밋 `f40043e73161a5ee47b03888155288f35a1f7b97`, 수정 HTML blob `32b345b52f33de26fb17d88655abca9ee24385cc`. 운영 main 미변경.
