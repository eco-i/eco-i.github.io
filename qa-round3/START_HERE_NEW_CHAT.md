# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-27 완료 / 다음 3-8-28.** 이번 신규 1종(3-8-27-001, MEDIUM) QA 전용 수정. 전 범위·실사용 CLEAN 아님.
- 저장소 `eco-i/eco-i.github.io`; 검수 브랜치 `qa-3-8`, 운영 `main`. 다음 채팅은 `qa-round3/CURRENT_STATE.json`·`START_HERE_NEW_CHAT.md`·`QA_3-8-27_REPORT.md`를 먼저 직접 확인.
- **3차 누적 신규 결함 18종**, 2차 과거 결함 540종 별도. 운영 미배포.
- 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 변경 없음. 실직원 DB 읽기·쓰기, SQL 실행, 운영 main 배포 **0건**.
- QA 최신 index.html blob **`d3e535031861bfdd372fc0b8d1f24ef6070cccdf`**, QA 수정 커밋 **`5ffe4f453ad4ac4e8260226418e7f3e5e8876121`**. 1MB 이상 HTML을 `fetch_file`에서 본문 확인 불가하면 `fetch_blob`.
- 이번 유효 격리검사 **70/70 PASS** = 휴근 저장·삭제 원본·패치 지연 Promise/RPC 시나리오 14, Realtime 실제 JS 12, 연차·장기재직 비동기 재조회 실제 JS 12, 정적 HTML/JS/권한/CAS 32.
- 결함 3-8-27-001: 휴근 저장·목록 삭제가 최초 인사정보 최신 확인 뒤 사전조회 RPC를 기다리면서 인사조회 상태가 무효화되어도 쓰기 RPC를 호출하던 경로. 원본 소스 가짜 RPC에서 저장·삭제 각 쓰기 호출 재현. QA 저장 함수에서 쓰기 직전 **personnelMutationReady, 현재 state.employees 대상 존재, holidayWorkRegistrationEnabled** 확인; 삭제에서 쓰기 직전 **personnelMutationReady** 확인. UI 메시지 추가, SQL 변경 없음. 실DB의 기록이 실제 변경될 수 있음을 입증한 것은 아님.
- 후속 코드 실제 GitHub blob 재조회/가드 12/12 확인(기존 정적 32와 중복되므로 70에 재산입하지 않음).
- 실 Chromium 간이 DOM 조사에서 `fieldset disabled` 내부 버튼의 `.disabled=false`를 관찰했으나 **현재 사이트 HTML에 fieldset 0개**이므로 제품 결함 미산입. 실제 앱 통합 Chromium/Android/iOS/TalkBack/VoiceOver 및 Supabase 다중 로그인·실제 mutation 경합은 미검증.
- **다음 3-8-28:** 저장/삭제 *이후* 상태 역전과 반환값 불확실, Realtime catch-up/PIN/관리자 권한 동시, 팝업 disabled/hidden 검수. 실직원 DB·main 보호.
- 연결 끊김·무응답과 채팅 용량 최소화. 대용량 소스·도구 출력은 내부 축약, 결과만 짧게 보고, 상세 기록 GitHub. ZIP 요구 없음.
