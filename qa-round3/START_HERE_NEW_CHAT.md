# 근무모아 3차·깊이 8 최신 공식 인수인계

- **공식 완료: 3-8-21 / 다음: 3-8-22.** 블록 21은 신규 확정 제품 결함 1종(3-8-21-001) 발견 후 QA 한정 수정, CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`, QA 브랜치 `qa-3-8`, 운영 브랜치 `main`.
- 3차 신규 결함 **누적 12종**(직전 11+21번 1). 2차 과거 결함 **540종** 별도. QA 수정 전체 운영 미배포.
- 운영 `main` 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 APP_VERSION `ver20261018-2313` 유지. 실제 직원 DB/운영 SQL·main 변경 **0건**.
- 이번 3-8-21-001(LOW): 기간 근태 달력의 시작일 선택 후 종료일 선택으로 이어질 때 `datePickerGrid.innerHTML` 재렌더가 포커스된 날짜 버튼을 제거해 키보드 포커스가 BODY로 이동. 원본 코드 가짜 DOM과 별도 headless Chromium 390×844 단독 DOM으로 확인.
- QA index.html의 renderAttendanceDatePicker **함수만** 수정: 재렌더 이전 날짜 버튼의 포커스 키 기억, 같은/다음/마지막 선택가능 날짜 또는 월 이동 버튼으로 `focus({preventScroll:true})` 복원. 버전/CSS/DB/근태 로직 변경 없음. 코드 커밋 `49ba06da4dfdf9526ecf5e21adbf1beea33467d5`, 최신 QA HTML blob **`ce076c820937c62bf6b2a2d1f471f9fbf0fe0ce6`**.
- 검증: 실제 함수 가짜 DOM 날짜 포커스 11/11, standalone Chromium DOM 1/1, 실제 휴근 삭제함수 모의 경합 14/14, JS·모바일·저장 경계 정적 24/24 → **합계 50/50 PASS**. 실제 전체 앱 Chromium 로그인/Android/iOS/실 Supabase mutation 병렬 요청 미검증.
- 새 채팅방 시작 시 `qa-round3/CURRENT_STATE.json`, `qa-round3/QA_3-8-21_REPORT.md`를 GitHub에서 직접 열 것. 상세 문제 `qa-round3/issues/3-8-21-001_DATE_PICKER_FOCUS_LOSS.md`.
- index.html은 1MB 초과: `fetch_file` 본문이 비면 최신 blob SHA로 `fetch_blob` 사용. ZIP/수동 업로드 요청하지 말 것.
- **3-8-22 권고**: 날짜 선택기 포커스/중첩 모달 접근성, 휴근 동일 날짜 수정·삭제 동시성, Realtime/연차·장기 재직 저장 경합. QA 브랜치만 패치. 운영 main 배포·실직원 DB 쓰기 금지.
- 사용자 우선: 연결 끊김/무응답 및 대화 길이 최소화, 짧은 진행보고, 상세 자료는 GitHub.
