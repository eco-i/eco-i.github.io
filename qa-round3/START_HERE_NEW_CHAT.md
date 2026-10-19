# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-26 완료 / 다음 3-8-27.** 이번 신규 결함 1종(3-8-26-001, LOW) QA 전용 코드 수정. 범위 한정 검수 PASS; 실사용·전체 앱 CLEAN 아님.
- GitHub `eco-i/eco-i.github.io` / 검수 `qa-3-8` / 운영 `main`. 다음 채팅에서는 `qa-round3/CURRENT_STATE.json`, `qa-round3/START_HERE_NEW_CHAT.md`, `qa-round3/QA_3-8-26_REPORT.md` 직접 확인.
- **3차 누적 신규 결함 17종**. 과거 2차 540종 별도. QA 수정 운영 미배포.
- 운영 main 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 버전 `ver20261018-2313` 불변. 실 직원 DB 조회/변경·SQL 실행·운영 배포 **0건**.
- QA 최신 `index.html` blob **`b65582e09c900785c79122217de8b705c069e166`**, 수정 코드 커밋 `1032c6e49f2db01b38d8c6c377e5f4db0318500c`. 1MB 초과 파일은 `fetch_file` 본문이 비면 `fetch_blob`를 사용.
- 유효 검사 **92/92 PASS**: 독립 Chromium 390×844 요소 판정 7/7, 실제 함수 가짜 DOM 포커스 11/11, 실제 모달/PIN 소스 잠금·초기화 14/14, 실제 휴근 저장 함수 가짜 RPC 경합 16/16, 연차·장기재직 비동기 재조회 가짜 RPC 12/12, 정적 HTML/JS/CAS/PIN 32/32.
- 3-8-26-001: `focusTargetUsable`이 자신의 속성만 보고 `aria-hidden=true`·`inert` **상위 영역** 속 버튼을 포커스 가능으로 판정. 독립 Chromium에서 원본 true·수정 false, 일반 버튼은 true 유지. QA 한 조건에 `!el.closest?.('[aria-hidden="true"],[inert]')` 추가(+47자).
- 첫 PIN fixture의 `modal.getAttribute`, `clearBackdropSensitiveInputs` 누락은 테스트 구성 오류. 원본 함수를 포함해 fixture 보완 후 14/14 PASS만 집계, 제품 결함으로 오인하지 않음.
- 이번 Chromium 실험은 *독립 합성 HTML DOM*이며 운영/QA 실제 로그인 앱을 로드하지 않았음. 실제 Android/iOS, TalkBack/VoiceOver, 실 DB 행 또는 실 Supabase 다중 로그인/RPC는 **미검증**. 제품의 전 범위 안전성 검증으로 과장하지 말 것.
- 다음 **3-8-27**: 중첩 숨김/inert+fieldset 접근성, PIN·관리자 권한/Realtime 빠른 전환, 휴근 삭제와 인사발령 CAS, 연차·장기재직 저장 성공 후 뒤늦은 재조회 실패를 격리 검수. 운영 main·실 직원 DB 절대 보호.
- 사용자 우선 연결 끊김/무응답/채팅 용량 최소화. 채팅에는 짧은 결과만, 상세 GitHub 파일 저장, ZIP 업로드 요구 금지.
