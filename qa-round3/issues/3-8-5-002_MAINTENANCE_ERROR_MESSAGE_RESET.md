# 3-8-5-002 — 정비/공휴일 관리 저장 실패 안내가 즉시 사라지는 문제
- 확정: 기존 `maintenanceSave()`의 catch가 `maintenanceStatus`에 오류를 설정하나 finally에서 열린 모달에 `maintenanceRender()`를 실행함. `maintenanceRender()`는 상태 텍스트를 항상 기본 문구로 덮어쓰기 때문에 사용자에게 저장 오류가 표시되지 않음.
- 중요도: 보통(저장 실패 확인/재시도 및 다른 관리자 충돌 진단).
- QA 브랜치 `maintenance-20261018.js` 변경: 실패 안내를 임시 보관하고 finally 렌더 **뒤**에 다시 표시. 기존 stale/CAS 에러와 일반 서버 오류·휴근 이력 충돌 전용 안내 함께 유지.
- JS 문법 PASS. 실제 `maintenanceSave` 함수 격리 테스트: 휴근 충돌, stale, 일반 오류 3건 메시지 유지 PASS.
- 운영 코드 변경·배포 없음, 실제 브라우저·모바일 UI 검증 필요.
