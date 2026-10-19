# 근무모아 3차·깊이8 — 3-8-32 공식 검수 보고서

## 판정 및 기준선
- **3-8-32 범위 한정 완료: 신규 결함 3종 발견·QA 수정·격리 회귀검사 136/136 PASS. CLEAN(신규 결함 없음) 아님.** 신규: `3-8-32-001` HIGH, `002` MEDIUM, `003` LOW. 3차 누적 **24종** (2차 역사적 540종 별도).
- 시작 GitHub QA `qa-3-8` HEAD `1bc1e5a31460cad99b24a123165b1024f51e1077`, HTML blob `a6cc643cc1c7a39c0afdfa8b1790e116d324ff03`, 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d`. `CURRENT_STATE.json`/인계/31 보고서 확인.
- 최종 QA HTML blob `8d1793491a2ff6447011fde1b3db8eae05d05830`; `APP_VERSION ver20261018-2313` **불변**. 실제 직원 DB/근태/지문 자료 조회·쓰기 0, Supabase 접속/SQL/운영 배포 0.
- **136/136 유효 PASS 내역:** 실제 `login()` 지연 cleanup 10 + 권한철회 실제 helper 12 + 같은 token admin retry 7 + logout/mismatch marker 추가 6 + 실제 `scheduleRealtimeRefresh` 14 + PIN 모달 지연 포커스 8 + GitHub 소스/JS 구문/DOM ID/보호장치 정적 64 + 3-8-30의 `restoreSession` 원본 회귀 15. 제품 결함을 재현한 최초 실패 및 잘못된 mock 가정은 이 PASS에서 제외.
- 검증은 **원본 JS 함수 추출 + 가짜 RPC/DOM/Web Locks/storage/timer**에 한정. 실로그인 전체 사이트 Chromium, Android/iOS, 서버 2개 세션·실 Realtime, screenreader 검증이 아님.

## 깊이 8 세부
1. **체크포인트·안전:** 31 완료, 다음 32, 누적 21 확인 후 GitHub QA HTML 소스를 직접 분석. 운영 HEAD 확인, 운영 브랜치와 실사용 DB 작업 금지.
2. **일반 직원 로그인 지연 lock 결함 001:** 기존 `login()`의 local/server 두 분기에서 캡처 토큰 대신 lock callback의 현재 토큰을 사용, 새 관리자의 인증표식을 삭제하는 경합 재현. local preview는 옛 직원 앱 진입도 가능. token/attempt/shared storage 가드를 callback 안팎에 추가.
3. **권한하향/readonly 지연 revoke 결함 002:** `revokeAdminUnlockForToken`의 비동기 callback 및 `clearAdminUnlockForSession`의 무조건 tab unlock 삭제 문제. 원래 직원 인증만 정리하도록 세대·token 조건 보호; 12/12.
4. **같은 token 재로그인 cleanup 결함 003:** `scheduleSharedAdminUnlockCleanup`의 80ms retry가 새 로그인에도 token 일치만으로 새 관리자 표식을 삭제. 예약 시 loginAttemptSeq/epoch를 캡처하고 대기·Web Lock 내에서 비교. 해당 함수 수정 7/7 + `requireSessionMismatch` 6/6.
5. **로그인 변경과 이전 보안 패치 회귀:** `login()` 실제 소스 local/server × 5 시나리오 10/10. 지난 3-8-30 `restoreSession` 3진입 경로 × 5 소유권/관리자 unlock 조합 15/15.
6. **Realtime 지연 타이머·catch-up 14/14:** 실제 `scheduleRealtimeRefresh`를 대상으로 로그아웃/강제 PIN/백그라운드/오프라인/저장 pending/스토리지 mismatch/새 realtime 신호/refresh 실패와 성공/epoch 전환 등 14유형. 예상치 못한 오래된 completion이 최신 catch-up 상태를 지우지 않음. 실제 Supabase subscribe 연결 품질은 별도 미검증.
7. **PIN 초점·소스 무결성:** PIN 창/강제 PIN의 정상·수동 입력·상단 타 modal·stale session·닫힌 backdrop 8/8. 정적·구문·원격 SHA 및 488개 literal HTML id 중복 없음 포함 64/64. 이전 31번 2개 수정과 30번 2개 검사는 그대로 유지.
8. **QA 수정·보고·다음 인계:** 운영 main/버전/DB untouched, 3개 제품 결함 별도 issue markdown 생성; QA index만 패치. 새 SHA와 32 완료 상태를 `qa-round3/CURRENT_STATE.json`과 `START_HERE_NEW_CHAT.md`에 기록. 전체 앱 CLEAN 또는 실제 Web Locks E2E 인증 주장 금지.

## 다음 3-8-33
- 더 오래된 `scheduleSharedSessionCleanup`/세션 tombstone/세션 재진입 사이 경합, `clearStoredLoginSession` 모바일·PC 역할별 저장소 삭제, 회원 인증 완료/초기 PIN/Realtime 채널 overlap에 관한 **QA 전용** 비동기 회귀 확장.
- 실 직원 계정·DB는 사용하지 말 것. QA 전용 분리된 서버/계정 없는 전체 통합검증은 미실시로 표기.

작성시각(KST): 2026-10-19T22:16:35+09:00
