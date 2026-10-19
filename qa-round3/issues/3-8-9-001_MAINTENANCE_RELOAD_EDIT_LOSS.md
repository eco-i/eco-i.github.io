# 3-8-9-001 — 관리자 정비 ‘최신 설정 다시 불러오기’ 도중 편집 내용 소실

- 검출: 3차·깊이8 종합검수 3-8-9
- 심각도: **중간**
- 영역: `maintenance-20261018.js` → `maintenanceReloadEditor()`, `loadMaintenanceSchedule()`
- 운영 기준: `main` SHA `6c784210e048426f18a486d5602652626d97574d`, version `ver20261018-2313`.
- 운영/직원 데이터 영향: 이번 QA 작업에서 **0건 변경**.
- 수정 위치: 검수 `qa-3-8` 전용 JS, commit `e8e675f35c88937008237433923bfbeaa7e98228`, **운영 미배포**.

## 재현 절차 (실제 QA JS + mock RPC)
1. 관리자 정비 모달의 편집 내용이 clean인 상태에서 ‘최신 설정 다시 불러오기’ 시작.
2. `get_maintenance_schedule` 응답을 의도적으로 보류.
3. 요청 진행 중 사용자가 기간 ‘두번째 정비’를 추가(그 순간 편집 화면의 기간 배열 1건).
4. 서버의 원래 빈 기간 설정(revision 0)이 늦게 응답.
5. 패치 전 `maintenanceReloadEditor()`가 즉시 `maintenanceDraft=maintenanceClone(maintenanceSchedule.data)`로 덮어씀. 기간 1건 → 0건, 사용자 추가 내용 **유실**, 확인 안내 없음.

이는 3-8-8-001(저장 응답의 후속 편집 덮어쓰기)과 달리 **읽기/다시 불러오기 응답과 편집 간 경쟁**이다. 별개 신규 결함으로 집계.

## QA 수정
재조회 시작 시 draft 객체 및 JSON 스냅샷, 세션 토큰을 기록한다. await 이후:
- 모달이 닫혔거나 로그아웃/계정 전환으로 세션이 달라졌거나 draft가 없으면 UI 재생성·덮어쓰기 금지.
- 로드 중 draft 객체 또는 값이 바뀐 경우 **작성 중 내용은 보존**하고 안내 토스트 표시.
- 편집하지 않은 정상 재조회만 새 서버 값과 revision으로 교체.
- 기존 `maintenanceSavePending` 저장 잠금 및 오류 안내 유지.

## 격리 회귀
- (1) RPC 보류 중 기간 추가 → 유지 + 새 서버 응답 revision 수신: PASS.
- (2) 편집 없이 재조회 → 최신 기간·revision 적용: PASS.
- (3) 재조회 중 모달 종료 → 숨긴 draft 재생성 안 함: PASS.
- (4) 재조회 중 로그아웃/토큰 변경 → 이전 세션 draft 재생성 안 함: PASS.
- (5) 서버 네트워크 실패 → 기존 draft 유지 및 오류 토스트: PASS.
- 기존 3-8-8 저장 중 잠금·기존 snapshot 저장·정상 pending 종료 5조건 회귀 PASS.

## 미검증
실제 관리자 로그인/두 탭 실제 서버 경쟁, 사용자의 실휴대폰 터치와 네트워크 지연, 전체 앱 Chromium 통합은 별도로 필요. V8 격리 시험에서 인증·RPC는 모의이며 운영 자료는 불러오거나 수정하지 않았다.
