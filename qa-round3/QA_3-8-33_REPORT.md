# 근무모아 3차·깊이8 — 3-8-33 공식 검수 보고서

## 공식 판정
- **3-8-33 범위 한정 완료. 신규 결함 1종(MEDIUM) 발견·QA 수정·회귀검사 PASS. CLEAN(결함 없음) 판정 아님.**
- **3차 누적 신규 제품 결함 25종**(이전 24 + 신규 `3-8-33-001` 1, 2차 역사적 540종 별도).
- **143/143 유효 격리·정적 PASS** = handoff ownership 10 + 예약 shared logout cleanup 10 + PC/모바일 저장소 정리 14 + Realtime 채널 lifecycle 12 + Realtime reconnect 10 + 초기 PIN 게이트 10 + 소스/JS 구문/DOM 고유성 62 + 기존 restoreSession 15.
- 기존 코드에서 확인한 새 토큰 인계정보 삭제 재현은 제품 결함 1종으로 별도 기록하며 PASS 수에 넣지 않음.
- QA `index.html` 이전 blob `8d1793491a2ff6447011fde1b3db8eae05d05830` → 수정 blob `d55a32fcbcad3110db76c8725b4b088fca7362d1`. **APP_VERSION `ver20261018-2313` 고정**, 운영 `main` 기준선 `6c784210e048426f18a486d5602652626d97574d` 변경 금지.
- 실 직원 DB 읽기/쓰기, Supabase 원격 RPC/SQL, 배포 **0건**. 아래 PASS는 원본 JS 함수+가짜 storage/Web Locks/DOM/타이머로 한 범위 한정 결과이며 실 앱 Chromium·물리 모바일/2계정 서버 통합검증이 아님.

## 깊이8 검수 내역
1. **GitHub 상태·소스 기준선:** `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-32_REPORT.md` 직접 검증하여 마지막 완료 32/시작 33/3차 24종/QA HEAD `c8fb9e5006dc1cb45f25a043753d16e7e420941d` 및 운영 HEAD 확인. 대용량 index.html은 원격 Git blob 원본 직접 분석.
2. **자동업데이트 handoff 구 토큰 삭제 결함 001:** `markUpdateHandoffLoggedOut`에서 log-out `OLD`와 tab handoff `NEW`가 중첩될 때 `NEW`가 무조건 삭제되는 실제 함수 격리 재현. 토큰 조건부 제거로 변경. 현재 본인 handoff 제거·다른 사용자 보호·없는/비정상 인계 등 **10/10**.
3. **예약 shared session cleanup 10/10:** 실제 `scheduleSharedSessionCleanup`, `clearSharedSessionIfToken`의 재연결 lock·tombstone·토큰 동등성 확인. old 세션 삭제, NEW 세션 보전, 동일 token 재로그인 시 tombstone 해제, lock 재시도, 삭제 일시실패 후 복구, 지연 콜백 도중 tombstone 해제 시 stale cleanup 중단.
4. **PC/모바일 저장소 구분 14/14:** `clearStoredLoginSession` 실제 본문을 모의 local/sessionStorage로 실행. PC 탭 전용/remembered 각 소유 토큰 삭제, 다른 PC 공유 계정 보전, 모바일 shared token 삭제·오래된 cleanup의 NEW 토큰 보전, old token/new handoff 보전, 불명 토큰 fallback 확인. 실제 모바일 브라우저 저장소의 물리 특성은 미검증.
5. **Realtime lifecycle 12/12:** 실제 `startRealtime` 함수 격리; 직원 미로그인/PIN 강제/공유 세션 mismatch/오프라인/서버 미구성/기존 채널, SUBSCRIBED catch-up, 늦은 CLOSED·이벤트/새 채널 소유권, 오류 시 재연결 확인. 자체 가짜 subscribe callback과 channel 사용. Supabase 실제 채널 통신 미검증.
6. **Realtime 지연 재연결 10/10:** 실제 `scheduleRealtimeReconnect`의 타이머 이전/채널 remove 대기 중 token·epoch 변경, 강제 PIN 진입, 오프라인 전환, 새 채널 선점, 정상 재구독 경계. 이전 세션 콜백의 NEW 세션 채널 침범 없음.
7. **PIN 게이트/이전 패치/무결성:** 실제 `enterInitialPinGate` 함수 10/10 (active vs cold, token/epoch stale, top modal 교체, dismiss, 세션 없음, Realtime stop)과 `restoreSession` 15/15 (local/server/forced gate × 정상·세션 역전·관리자 거절) 완료. 정적/구문/기존 보안 가드 검증 **62/62**, 인라인 JS 2개 파싱, HTML literal id 488개 중복 0, 최종 index는 예상 단일 조건부 handoff 삭제 패치와 정확히 동일.
8. **GitHub 기록·안전·인계:** 신규 `qa-round3/issues/3-8-33-001_STALE_LOGOUT_HANDOFF_REMOVAL.md`, 본 보고서, state 및 next-chat 인계 갱신. QA branch `index.html`만 제품코드 수정. 운영 DB·운영 main·직원 개인정보 접근 및 운영 배포 0.

## 미검증·다음 3-8-34 권고
- 분리 QA DB·테스트 계정 2개를 이용한 실제 브라우저 Web Locks/storage-event 순서, 동일-token 로컬 preview와 다른-token 실제 서버 업데이트 handoff, 새 브라우저 탭·Android/iOS 및 screenreader Realtime/PIN 전체 E2E 미검증.
- **다음 3-8-34:** `clearUpdateHandoffLogoutTombstone`과 레거시 aggregate 이관·동시 로그인 간 우선순위, 복수 페이지/탭 자동업데이트 handoff, token 재사용/무효화 방어 및 Realtime 재연결 상태 QA 전용 확장.

작성시각(KST): 2026-10-20T13:00:54+09:00
