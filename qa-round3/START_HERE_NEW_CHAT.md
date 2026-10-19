# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-28 범위 한정 CLEAN 완료 / 다음 3-8-29.** 이번 신규 제품 결함 **0종**, QA 코드 변경 없음. 전체 앱/실사용 CLEAN 보증 아님.
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-3-8`, 운영 `main`. 다음 채팅은 `qa-round3/CURRENT_STATE.json`, `qa-round3/START_HERE_NEW_CHAT.md`, `qa-round3/QA_3-8-28_REPORT.md`를 먼저 직접 확인.
- 3차 신규 누적 **18종 유지**, 2차 과거 540종 별도. 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 버전 `ver20261018-2313` 불변.
- QA 최신 `index.html` blob **`d3e535031861bfdd372fc0b8d1f24ef6070cccdf`** 및 최근 QA 코드 커밋 `5ffe4f453ad4ac4e8260226418e7f3e5e8876121` 그대로. 1MB 본문은 `fetch_blob` 사용.
- 검수 **88/88 유효 격리 검사 PASS**: 실제 `saveSelectedHolidayWork`/`deleteHolidayWorkListRow`의 지연 가짜 RPC 반환 후 세션·관리자·readonly·응답 불확실/실패·인사상태 경계 14, 실제 `scheduleRealtimeRefresh` 타이머/세션 역전·pending catch-up 16, 실제 연차/장기재직 재조회 함수 가짜 RPC 12, 실제 Tab/Escape 키다운 핸들러 모의 14, 정적/JS/HTML/PIN/CAS 보호 32.
- 이번 **신규 결함 0**, QA index.html 코드 수정 0, 신규 결함 파일 0. 공식 보고서 `qa-round3/QA_3-8-28_REPORT.md`.
- 세션 변동 중 기존 작업의 `finally`에서 개별 pending 키를 바로 지우지 않는 로직은 새 로그인 컨텍스트를 보호하는 설계. 실제 `invalidateSessionBoundLoads`에서 각 키가 초기화됨을 정적 확인. 근거 없이 결함·수정하지 않음.
- **미검증**: 실제 로그인 앱 Chromium E2E, 물리 Android/iOS, TalkBack/VoiceOver, PIN 인증, 실 Supabase RPC와 다중 직원 DB 동시 경합. 실제 DB 행 조회·쓰기, SQL 실행, 운영 배포 **0건**.
- 다음 **3-8-29**: PIN/로그인 전환 중 늦은 결과 소유권과 세션 pending/Realtime 재조회, 중첩 모달, 연차·장기재직 `saveAnnualLeaveSetting`/`saveLongServiceSetting` 자체의 post-mutation 비동기 오염/응답 불확실 경계 심화. QA 코드에서만 검증, main/실 DB 보호.
- 연결 끊김·무응답/채팅 용량 절약: 짧은 사용자 보고, 상세 GitHub 기록, ZIP 불요.
