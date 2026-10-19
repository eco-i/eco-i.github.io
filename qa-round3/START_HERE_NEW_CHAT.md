# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-25 완료 / 다음 3-8-26.** 신규 1종(3-8-25-001, LOW) QA 코드 수정. 전체 로그인 앱·실사용 CLEAN 판정 아님.
- GitHub `eco-i/eco-i.github.io` / QA `qa-3-8` / 운영 `main`. 다음 채팅에서는 `qa-round3/CURRENT_STATE.json`, `qa-round3/START_HERE_NEW_CHAT.md`, `qa-round3/QA_3-8-25_REPORT.md` 직접 확인.
- **3차 신규 누적 16종**. 2차 기존 540종 별도. QA 변경 운영 미배포.
- 운영 main 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 APP_VERSION `ver20261018-2313` 불변. 실제 직원·근태·감사 행 접근, SQL 실행 및 운영 배포 **0건**.
- QA 최신 `index.html` blob **`fad8e6b20c0001a1bbdcb8ef482e7542522c5373`**, 코드 커밋 `686ea014a094f8255805b932943a986b201c1799`. 1 MB 초과 파일이 `fetch_file`에서 안 읽히면 `fetch_blob` 활용.
- 이번 범위 **104/104 유효 격리 검사 PASS**: 팝업/타이머 31, 휴근 save 실제 함수 mock 15, 연차/장기재직 load 실제 함수 mock 12, 실제 keydown handler 14, 정적 HTML/JS/PIN/CAS 점검 32.
- 결함 3-8-25-001: 열린 최상단 팝업에서 두 번째/세 번째 입력을 선택했는데 이전 열기/닫기 타이머가 첫 입력으로 되돌리는 문제. QA 전용 `openBackdrop`/ `closeBackdrop` 지연 콜백 두 곳에 포커스 유효성 가드 반영. 원본과 후보 15개 시나리오 비교 원본 9/15, 후보 15/15; 최신 실제 QA 함수 31/31 PASS.
- 연차·장기재직 12개 중 처음 1개는 fixture의 `state` 참조 실수. fixture를 바로잡고 재검증하여 12/12 PASS. 제품 결함으로 오인하지 않음.
- **실제 앱 로그인 Chromium E2E / Android·iOS / TalkBack·VoiceOver / 실제 Supabase 동시쓰기·인사발령 경합 미검증.** 사용자의 실제 DB에 조회·쓰기 하지 않음. 모든 mock PASS는 실서버 보증이 아님.
- 다음 **3-8-26:** disabled/hidden focus eligibility, PIN·admin 권한 강등/실행 중 잠금, 겹친 팝업 및 휴근·인사발령 CAS/연차·장기재직 reload 경합. QA 보호.
- 연결 끊김·채팅 용량 최소화: 내부 코드/도구 출력 축약, 채팅 결과는 짧게, 상세 GitHub 보고서, ZIP 요구 없음.
