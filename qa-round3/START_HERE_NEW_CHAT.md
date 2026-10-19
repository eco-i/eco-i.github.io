# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-23 완료 / 다음 3-8-24.** 새 결함 1종(3-8-23-001, LOW) QA 코드에서 수정. 범위 한정 통과, 실사용/전체 앱 CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-3-8`, 운영 `main`. 다음 채팅은 `qa-round3/CURRENT_STATE.json`과 `qa-round3/QA_3-8-23_REPORT.md`를 먼저 직접 확인.
- 3차 신규 결함 누적 **13종**, 2차 과거 결함 540종 별도. main 배포나 실제 직원 DB/SQL 변경 없음.
- 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 버전 `ver20261018-2313` 불변.
- QA 최신 `index.html` blob **`4fc8dcbde1bb9c9a85f637921db0ed872b6a57f4`**, 수정 커밋 `eb546ea8380f6c6a5912272ba47af90025981aeb`. 1 MB 초과 HTML 본문이 `fetch_file`에서 비면 `fetch_blob` 사용.
- 이번 범위 **64/64 유효 검사 PASS**: 휴근 목록 진입·복귀 15, 연차/장기재직 격리 저장 12, 중첩 팝업 원본·수정 가짜 DOM/타이머 6, 실제 Tab/Escape 키 핸들러 10, 정적 JS/HTML/가드 21.
- 3-8-23-001: 중첩 팝업 A→B→C의 이전 타이머가 aria-hidden=true인 A/B로 잠시 포커스를 빼앗는 문제. `focusTopBackdrop`에서 실제 최상위 팝업 소유자만 포커스하도록 QA 1줄 가드 수정. 자세한 내용은 `qa-round3/issues/3-8-23-001_NESTED_MODAL_STALE_FOCUS_TIMER.md`.
- 모의 DOM/타이머, 가짜 RPC와 실제 소스 함수의 **격리 검사**임. 물리 Android/iOS, 완전 인증 Chromium E2E, 실직원/QA DB 2인 동시 경합, 보조공학 실기기 확인 미실행. 직원 DB 행 조회도 하지 않았음.
- 다음 3-8-24: 빠른 팝업 열기·닫기·포커스 반환, 동시 휴근·인사발령 CAS, 연차·장기재직 후속 복구를 QA 격리 범위에서 심화. 운영 main/실DB 보호.
- 연결 끊김·무응답/채팅방 용량 최소화: 대용량 코드와 결과는 내부 축약, 사용자에게 짧게 보고, 자세한 기록은 GitHub. ZIP 요청 금지.
