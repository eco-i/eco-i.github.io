# 근무모아 3차·깊이8 — 3-8-30 공식 검수 보고서

## 판정
- **3-8-30 범위 한정: 신규 확정 결함 1종 HIGH, QA 수정 및 격리 회귀 통과.** 따라서 CLEAN(무결함) 표기는 사용하지 않음. 3차 누적 **19종**(2차 역사적 540종 별도).
- **102/102 유효 검사 PASS**: `restoreSession` 수정본 15, `changeOwnPin` 실제 함수 격리 26, 중첩 modal aria/focus 20, 정적/JS 구문·diff/무결성 41. 원본 결함 재현 **9개 실패 조합**은 유효 PASS에 포함하지 않음.
- QA `index.html` 변경은 관리자 unlock 대기 `await` 이후 2곳에 세션 소유권 재확인 가드를 추가하는 것뿐. 수정 blob `8645c90182b9160951dde13e7249ca92dc43e373`. APP_VERSION `ver20261018-2313` 그대로.
- 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 보호. 실제 직원/근태/감사 DB 행 조회·변경, Supabase SQL 실행, 운영 배포 **0건**.
- 결과는 격리된 함수·모의 DOM/RPC 범위에서의 확인이며 실제 로그인한 전체 사이트/실운영 정상 작동 보증이 아님.

## 깊이 8단계별 내용
1. **공식 상태/기준선**: GitHub `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-29_REPORT.md` 직접 읽어 29 완료, 다음 30, 18종, main 기준선, QA index blob 확인 후 시작.
2. **복구/관리자 잠금 사이 결함 재현**: 실제 `restoreSession()` 소스를 추출하고 `ensureAdminUnlockForRestoreWithScope`를 지연된 가짜 Promise로 대체. 관리자 unlock 대기 도중 token/epoch가 바뀐 상황에서 기존 함수는 사후 소유권 재검사 없이 지난 계정으로 `enterApp` 또는 `enterInitialPinGate` 수행. 로컬, 서버 일반, 서버 초기 PIN 3경로 × token 교체/epoch 변경/token 삭제 3경합 = **원본 9/9 결함 재현**. 단순 문자열 의심이 아닌 실제 비동기 함수 실행으로 확인.
3. **최소 수정·보안 소유권**: 위 `await` 반환 직후 `if(!tokenStillCurrent())return;`을 로컬/서버 분기 2곳에 삽입. 잠금 취소·새 세션 복구 타이머 등 기존 오류·finally 정책은 유지. 원본 코드에서 정확히 2곳만 변화한 것을 재조합 동등성 검사로 확인.
4. **복구 회귀 검사 15/15**: 3 복구 경로 × {안정 세션 정상 진입, 새 토큰, 같은 토큰 새 epoch, 세션 비움, 관리자 unlock 거절} 수행. 새 세션 오염 **0건**, 정상 진입 **3/3**, 잠금 거절 정상 차단 **3/3**. 지연된 기존 세션 응답의 새 계정 화면 진입 불가.
5. **PIN 변경 자체 26/26**: 실제 `changeOwnPin()` 추출하여 일반/강제 PIN 각 13가지: 성공, 비정상 결과, 네트워크 장애, 현재 PIN 오류, 같은 토큰 epoch 역전, 토큰 교체, 공용 세션 오류, 확정 만료, 초기 PIN 재사용, 잘못된 형식, 0000 차단, 기타 서버 오류, 강제 PIN 재확인과 게이트 해제를 검사. 세션 변동 뒤 이전 PIN 결과의 토스트/복원 경로 차단 확인. 모의 RPC 기반이며 서버 실제 PIN 쓰기는 하지 않음.
6. **모달 접근성 스택 20/20**: 실제 `topOpenBackdrop`, `syncBackdropAccessibilityStack`, `focusTopBackdrop`를 가짜 DOM으로 실행. 0~4 중첩 팝업 및 동일 z-index/비순차 z-index 등 10개 배치 × 상단/비상단 초점 호출 2종. `aria-hidden` 및 `aria-modal`과 최상위 focus 대상 보존. 실제 화면 전체 CSS/물리 모바일 키보드 접근성은 미검증.
7. **정적/무결성/회귀 41/41**: GitHub QA/운영 HEAD 기준선, 버전 고정, 인라인 JS 2개 구문 PASS, HTML ID 전체 `id="..."` 패턴 488개 중 중복 0개(이전 태그 매칭 정규식의 486개와 집계 방식이 달랐음), 로그인·PIN·Realtime 소유권 보호, modal 입력 폐기·취소, 저장 중 잠금 확인. 후보 전체 index.html은 원본 + 예정된 2개 코드 편집과 **정확히 동일**.
8. **확정·수정 이력·다음 인계**: 제품 결함 `3-8-30-001` (high), `qa-round3/issues/3-8-30-001_RESTORE_UNLOCK_STALE_SESSION_ENTRY.md`에 원인/재현/수정/미검증 기록. QA 코드만 수정. **코드 배포·실직원 DB 접근 금지** 유지.

## 미검증 및 다음 블록
- 실로그인 Chromium 전체 통합/Android/iOS, VoiceOver/TalkBack, Web Locks 실제 구현에서 2탭·2계정 관리자 unlock 순서 역전, Supabase 실서버 PIN 변경/세션 복구 및 권한 승격·철회는 미검증. 실서버 테스트에는 반드시 별도 테스트 계정/DB 필요.
- **다음 3-8-31:** `ensureAdminUnlockForRestore` 내부 admin-token 스토리지 side effect 및 shared lock 소유권, `enterApp` 부트스트랩 중 권한/사용자 전환, PIN 팝업 delayed close/focus의 실제 함수 격리 경계 확장.

작성시각(KST): 2026-10-19T21:17:51+09:00
