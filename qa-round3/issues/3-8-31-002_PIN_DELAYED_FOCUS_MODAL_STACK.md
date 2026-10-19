# 3-8-31-002 — PIN 팝업 전용 지연 포커스가 최상위 팝업 초점을 탈취

**Severity:** low · **Branch:** qa-3-8 only · **File:** index.html

## 재현 및 원인
기존 일반 `openBackdrop`/close 의 지연 포커스는 최상위 창을 확인하지만, `openSelfPin`(50ms), `enterInitialPinGate`(40ms)의 **개별 focus 타이머**는 session/epoch 및 원래 창 open만 검사한다. 이 동안 다른 모달을 위에 열면 이전 숨겨진 PIN 창으로 포커스가 옮겨지고, 동일 자기 PIN 창에서 사용자가 새 비밀번호 입력 필드로 이동한 후에도 첫 입력칸으로 포커스가 역전됨.

실제 함수 본문+가짜 DOM/타이머로 원본의 `self_other_top`, `self_manual_new`, `gate_self_above`, `gate_other_on_top` **4가지 실패 재현**. 전체 앱 브라우저·실기기 접근성 재현은 하지 않았음.

## QA 수정
두 타이머에서 `topOpenBackdrop()===backdrop` 확인. 자기 PIN 창은 최상위 상태라도 이미 사용자가 입력 필드에 포커스를 둔 경우 덮어쓰지 않으며, 첫 열림의 닫기 버튼에서 원래 의도한 현재 PIN 입력으로 이동하는 동작 유지. 초기 강제 PIN 안내는 최상위일 때 초기 변경 버튼을 우선하되 상위/다른 팝업에 포커스를 빼앗지 않음.

## 검증 및 잔여 위험
실제 원본 JS 함수 추출 + 가짜 DOM/지연 타이머 **18/18 수정 회귀 PASS**. 첫 테스트의 mock 닫기 버튼 tagName을 INPUT으로 잘못 지정한 fixture 오류를 수정하여 재검증한 결과를 사용. TalkBack/VoiceOver, 실제 중첩 모달/키보드/Android/iOS는 아직 미검증.

QA 후보 blob: `a6cc643cc1c7a39c0afdfa8b1790e116d324ff03`.