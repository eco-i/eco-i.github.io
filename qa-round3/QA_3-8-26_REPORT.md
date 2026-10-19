# 근무모아 3차·깊이8 — 3-8-26 공식 검수 보고서

## 공식 판정
- **3-8-26 범위 검수 완료, 신규 확정 결함 1종(3-8-26-001, LOW) QA 전용 수정.**
- 3차 누적 신규 결함 **17종** (이전 16 + 이번 1). 2차 과거 540종 별도.
- 신규 결함: 상위 `aria-hidden=true` 또는 `inert` 영역의 자식 요소를 포커스 가능으로 잘못 판정.
- QA `index.html`의 `focusTargetUsable` 조건 한 곳만 수정(+47자). QA 코드 커밋 `1032c6e49f2db01b38d8c6c377e5f4db0318500c`, 새 HTML blob `b65582e09c900785c79122217de8b705c069e166`.
- **92/92 유효 격리 검사 PASS**. 독립 Chromium 7 + 포커스 모의 11 + PIN/모달 모의 14 + 휴근 저장·세션/인사·CAS 모의 16 + 연차·장기재직 재조회 모의 12 + 정적/JS 파싱 32.
- 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 유지. 실제 직원 DB·감사·근태 행 조회나 변경, DDL/DML, 운영 배포 **0건**.

## 깊이 8단계
1. **공식 인수인계**: GitHub `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-25_REPORT.md` 직접 검증. 마지막 25/다음 26/누적 16, 인계 QA HTML blob `fad8e6b20c0001a1bbdcb8ef482e7542522c5373` 일치 확인.
2. **실제 브라우저 접근성 요소 판정**: Chromium 144, 독립 합성 HTML·390×844에서 정상/disabled/display:none/visibility:hidden/상위 aria-hidden/상위 inert/aria-hidden=false 등 7/7 기대 판정. 원본은 상위 aria-hidden·inert 2종을 잘못 허용. 화면에 남는 요소라도 접근성상 숨겨져 있으면 포커스 복귀 후보에서 제외해야 함.
3. **실제 JS 소스 및 최소 수정**: GitHub 원본 `focusTargetUsable`에서 상위 `aria-hidden=true`·`inert` 탐색이 빠져 있음을 확인. `!el.closest?.('[aria-hidden="true"],[inert]')`를 기존 단일 조건에만 추가. 실제 함수 분리·가짜 DOM 11/11 PASS, 원본에서 3종 경계 오판 확인.
4. **PIN·팝업·권한 UI 보호**: `openBackdrop`/`closeBackdrop`/`focusTargetUsable`/`clearBackdropSensitiveInputs` 등 실제 소스와 가짜 DOM·타이머를 결합. PIN 강제변경 팝업 비강제 닫기 금지, 강제 종료, pending·dirty 팝업 잠금, PIN 두 입력값 닫기 후 삭제, 기존 잠금 중 입력값 보존, 실제 최상위 팝업 포커스 14/14 PASS. 초기 fixture의 `modal.getAttribute` 및 PIN 정리 함수 누락 오류는 수정 후 전량 재실행해 유효 14개만 집계.
5. **휴근·인사·세션 경합 방어**: `saveSelectedHolidayWork` 실제 JS 함수+가짜 RPC로 정상 등록, 관리자 다른 직원 scope, 동일날짜 근태 충돌 취소/승인, 인사/휴근 자격 미확인, readonly, 숨긴 페이지, 최신 서버 행 CAS, preflight 통신 실패, 권한·shared 세션 상실, RPC 응답 불확실, 중복 클릭 single-flight 등 16/16 PASS. **실 Supabase mutation 미실행**.
6. **연차·장기재직 재조회 안전**: `loadAnnualLeaveData`, `loadLongServiceData` 실제 비동기 소스와 모의 RPC 12/12. 동일 연도/다른 연도 실패시 마지막 정상값 보호·서로 다른 연도 구분, 프로필/사용 기록 일부 읽기 실패 원자 방어, 오래된 shared 세션 결과 미적용, dirty 장기재직 제외기간 초안 보존. 실제 사용자 데이터 읽기 없음.
7. **정적·구문 및 보호 회귀**: 기존 `3-8-23~25` 포커스 개선 유지, modal top/aria-modal/중첩 복귀·PIN clear/저장 pending lock, Realtime pending 직렬화, 휴근 expected ID·timestamp, 연차·장기재직 stale snapshot 및 RPC 반환 계약, 488개 HTML ID 중복 0, inline JS 2개 구문 파싱, **단 1곳 조건식 치환만 수행한 역바이트 대조** 등 정적 검사 32/32 PASS.
8. **GitHub QA 코드 저장·실사용 보호**: `qa-3-8/index.html` QA 수정과 신규 결함·보고서 공식 기록. 운영 `main` 및 실제 직원 DB/SQL/근태 기록 무변경. 독립 Chromium은 전체 근무모아 인증 앱이 아니며 Android/iOS/TalkBack/VoiceOver 또는 실제 DB 동시 경합 검증을 대체하지 않음.

## 다음 3-8-27
- disabled `fieldset`, 중첩 aria-hidden과 `inert`의 포커스 trap, 실제 브라우저의 팝업 재열기·초점 반환, PIN 변경·권한 전환의 가짜 지연 RPC 경합.
- 휴근 삭제·인사발령 CAS 충돌 및 연차/장기재직 optimistic-save 실패 뒤 후속 재조회 지연 교차를 QA 격리 범위에서 검수. 실제 직원 DB를 사용하지 말 것.

상세 결함: `qa-round3/issues/3-8-26-001_ARIA_HIDDEN_INERT_ANCESTOR_FOCUS_ELIGIBILITY.md`.
