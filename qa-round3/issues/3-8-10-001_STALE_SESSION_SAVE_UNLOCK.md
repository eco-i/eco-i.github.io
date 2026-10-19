# 3-8-10-001 — 이전 계정의 지연 저장 응답이 신규 계정의 편성 저장 잠금을 해제

- 발견 블록: 근무모아 3차 깊이8 `3-8-10`
- 중요도: **높음** (세션 분리 및 새 계정의 편집 잠금 안정성)
- 코드: `maintenance-20261018.js` 내 `maintenanceSave()`의 `finally`와 `maintenanceReset()`
- QA 수정 커밋: `53cd3762bcf7055f9f0feefac3b979dde1081fdd` (`qa-3-8`에만 적용)
- 운영 `main` / 운영 DB / 실제 직원 기록: **변경 없음**

## 실증 재현
1. 관리자 세션 A에서 2027-12-01 A조를 `주`로 변경하고 `admin_save_maintenance_schedule` 호출. RPC 응답은 지연시킨다.
2. 강제 로그아웃/세션 전환 경로와 동일하게 `maintenanceReset()`을 실행하고 세션 B 관리자 로그인 컨텍스트를 구성한다.
3. 세션 B에서 B조 `야`를 선택하고 새 저장 요청을 시작한다. `maintenanceSavePending=true`.
4. A의 오래된 응답이 B 저장보다 먼저 반환되면 A의 `maintenanceSave()` 안 `finally`가 새 세션의 공유 전역 `maintenanceSavePending=false`로 변경한다.
5. B의 저장 도중 B조를 `주`로 바꿀 수 있게 되고, B 저장 응답이 돌아오면 값이 원래 전송된 `야`로 덮여 쓰인다. 변경 사실을 알리는 오류 없이 편집 내용이 유실된다.
6. **실제 QA JS 함수 + 두 가상 세션/지연 mock RPC**로 위 현상을 재현. 운영 서버에 요청을 전송하지 않았다.

## 수정 내용
- `maintenanceSaveSeq`를 저장 요청의 소유권을 나타내는 증가 식별자로 추가.
- `maintenanceReset()`에서 식별자를 증가시켜 이전 계정의 모든 진행 중 저장 콜백을 무효화.
- 신규 `maintenanceSave()` 시작 시 고유 저장 식별자 캡처.
- `finally`에서 **캡처한 식별자가 현재 식별자와 일치할 때만** pending 해제·렌더·오류 메시지 반영.
- 기존 `sharedSessionContextCurrent`와 오류·세션 가드는 유지. 새 식별자는 UI 전역 잠금의 누락된 소유권을 보충한다.

## QA 확인
- 직접 회귀 **5/5**: A 성공→B 대기, A 실패→B 대기, 정상 저장·중복클릭, 현 세션 실패 메시지, B 저장 없이 A 응답 뒤늦게 도착.
- 독립 모의 3세션 A/B/C, **응답 순서 6개 × 각 요청 성공/실패 조합 8개 = 48/48**: 이전 응답이 C의 상태를 덮지 않고, C 종료 전 잠금을 해제하지 않으며, 모든 응답 후 상태가 일관됨.
- 기존 3-8-9 재조회 편집 유지/정상 조회/서버 실패 회귀 **3/3**.
- `index.html`에서 실제 로그아웃 함수가 `maintenanceReset()`을 부르고, `admin_save_maintenance_schedule`가 세션 보호 RPC 집합에 포함됨을 확인.
- 메인 HTML `shiftForGroup` / `holidayNameOn` / `isHolidayWorkDayKey` 및 별도 정비 스크립트, 2028~2035 휴일 목록의 실제 함수/데이터로 **94/94** 교차 회귀 확인.

## 미검증
- 실제 유효 관리자 두 계정으로 비동기 요청 경합을 재연한 것은 아님.
- 실제 Android/iOS/PC 로그인 E2E 및 두 DB 세션의 동시성 테스트 수행하지 않음.
- 운영 배포·서버 RPC 수정·직원 데이터 쓰기 없음. 해당 수정은 QA 후보이며 배포 승인 아님.
