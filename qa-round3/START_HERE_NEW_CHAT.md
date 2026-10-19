# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-22 완료 / 다음 3-8-23.** 블록 22는 범위 한정 CLEAN(신규 확정 결함 0). 실사용/전체 앱 CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-3-8`, 운영 `main`. 다음 채팅은 `qa-round3/CURRENT_STATE.json`과 `qa-round3/QA_3-8-22_REPORT.md` 직접 확인.
- **3차 신규 누적 12종 유지**, 2차 과거 결함 540종 별도. QA 수정 운영 미배포.
- 운영 main 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313`. 실직원 DB 및 SQL 쓰기 0건, main 배포 없음.
- QA 최신 `index.html` blob **`ce076c820937c62bf6b2a2d1f471f9fbf0fe0ce6` 유지**, 블록 22 기능 코드 변경 없음. HTML 1 MB 초과로 GitHub `fetch_file`에서 본문이 비면 `fetch_blob` 사용.
- 이번 범위 **80/80 유효 검사 PASS**: 날짜 선택기 실제 JS·모의 DOM 18/18, 휴근 삭제 preflight/중복/관리자권한/세션/실패 17/17, Realtime 저장 중 serial refresh·catch-up 16/16, 소스·HTML·JS 파싱·DOM ID 등 정적 29/29.
- 인공 fixture 오류: 팝업 닫기 스텁이 실제 focus restore를 누락해 발생한 1개 잘못된 예상조건은 제거. 소스 슬라이서가 async `function`에서 조기 종료한 4개 검사 오류는 테스트를 바로잡아 4/4 통과. 제품 결함으로 잘못 기록하지 않음.
- 테스트는 실제 GitHub JS 함수 일부 + 가짜 DOM/Promise/타이머. 물리 Android/iOS, 전체 로그인 Chromium E2E, 실제 Supabase 동시 쓰기 검증은 수행하지 않음. 행 접근 및 직원 데이터 쓰기 없음.
- **다음 3-8-23:** 휴근 수정→목록 복귀 및 동시 삭제·인사발령 상태, 연차/장기재직 저장 직후 재조회, 3중 모달 Tab/Escape. QA만 수정하고 main/직원 DB 절대 보호.
- 사용자 우선 연결 끊김·무응답/채팅 용량 최소화. 짧은 진행 보고, 상세 GitHub. ZIP·수동 파일 업로드 요구 금지.
