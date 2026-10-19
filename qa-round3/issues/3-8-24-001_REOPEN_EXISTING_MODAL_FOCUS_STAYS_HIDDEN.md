# 3-8-24-001 이미 열린 팝업을 다시 최상단으로 올릴 때 포커스가 숨겨진 이전 팝업에 남음

- 유형: UI/키보드 접근성, LOW
- 수정: `qa-3-8/index.html` `openBackdrop`의 alreadyOpen 분기
- 운영 적용/직원 DB: 둘 다 없음

## 재현
원본 `openBackdrop`, `topOpenBackdrop`, `focusTopBackdrop`, `syncBackdropAccessibilityStack`를 모의 DOM/지연 타이머에서 실행했고, 동일한 동작을 Chrome 390×844 독립 DOM에서 확인했다.

1. 팝업 A 열기 → 포커스 A.
2. 팝업 B 열기 → 포커스 B, A는 `aria-hidden=true`.
3. A에 `openBackdrop('A')` 다시 호출: Z 순서가 A로 변경, B는 `aria-hidden=true`.
4. **기존 코드**는 alreadyOpen 분기에서 접근성 스택만 조정. 브라우저 포커스는 B의 버튼에 잔존해 숨겨진 팝업과 입력 위치가 불일치함.

## QA 수정
```js
else{syncBackdropAccessibilityStack();if(!el.contains(document.activeElement))focusTopBackdrop(el);}
```
이미 최상단 A 내부에 유효 포커스가 있다면 불필요하게 첫 버튼으로 이동하지 않고, A 외부에 포커스가 있을 때만 최상단 팝업으로 회복한다.

## 재검증
- 독립 Chromium에서 원본 (top=A, focused=B, B aria-hidden=true) 확인 및 수정후 (top=A, focused=A) 확인.
- 실제 GitHub 함수 기반 모의 DOM 순서 검사 27/27, 추가 경계 검사 7/7, Tab/Escape 원본 핸들러 14/14와 통합 회귀 공유.
- 전체 로그인 앱 Chromium/물리 모바일/보조공학 실사용 검증은 수행하지 않음.
- QA 수정 커밋 `f40043e73161a5ee47b03888155288f35a1f7b97`, 수정 HTML blob `32b345b52f33de26fb17d88655abca9ee24385cc`. 운영 main 배포 안 함.
