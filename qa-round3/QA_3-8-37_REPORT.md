# 근무모아 3차·깊이8 — 3-8-37 공식 검수 보고서

## 공식 판정
- **3-8-37 범위 한정 완료. MEDIUM 신규 결함 1종(3-8-37-001) 재현·QA 수정. CLEAN 아님.**
- 3차 누적 신규 제품 결함 **29종**(36 완료 28 + 이번 1), 2차 이력 540종 별도.
- **최종 커밋된 코드의 유효 격리·정적 검사 291/291 PASS:** 토큰 재사용·legacy writer·clock skew 실제 함수 **190**, 업데이트 handoff restore 실제 함수 **40**, Realtime subscribe 실제 함수 **20**, 소스/JS·DOM 무결성 정적 **41**.
- QA `index.html`: 이전 blob `86ff27b08a66f7e1853f3888a74a7d8ba0109471` → 최종 blob `084696ce5ef54748bcb0043a14504cbae10ebe26`; 코드 커밋 `c4ad51bb9f9e9d193cbb3e9a61d6814b9b5f4a6d`.
- 앱 버전 `ver20261018-2313` 유지, 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d` 변경 없음. 직원 DB 읽기·쓰기, 실제 계정 인증/SQL/RPC, 운영 배포 0.

## 깊이 8 수행
1. **GitHub 공식 상태 점검:** `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-36_REPORT.md`, QA HTML blob 직접 조회. 36 완료/다음37/3차28종 확인, 운영 기준선 분리.
2. **구버전 writer 재등장 재현:** 현행 `storeLoginSession`과 `storedSessionTombstoned`, `updateHandoffTokenWasLoggedOut` 실제 함수를 가짜 공유 localStorage/sessionStorage에서 실행. local:7 토큰으로 새 로그인(true)한 뒤 `at<fresh login`인 과거 legacy logout aggregate를 구버전 탭에 해당하는 모의 writer로 다시 쓰면, 신규 로그인이 다시 tombstoned되는 제품 결함을 확인. 실물 구버전 탭 E2E가 아니라 **모의 저장 순서 재현**.
3. **국소 QA 보정:** 로컬 재사용 `local:` token에만 신규 로그인 epoch 기록 후 확인. 레거시 항목 시각이 더 이전이면 이관/세션 차단에서 제외. 서버 고유 token, shared suppression, 새/동시각 logout, exact token logout는 그대로 유효. 5초 이상 과거 시계 보정이면 fail-closed로 marker 우회를 억제.
4. **실제 함수 저장소 경합 190/190:** PC temporary, PC remembered, mobile, 25×3 타임라인 반복, 구버전 old writer, genuine new/equal-ms logout, 토큰별 분리, epoch 저장 quota 실패, 구 로그인 차단 보존, 큰 시계 보정, 관리자·복원 외 세션 source 범위 검증. 원본 실패 재현은 PASS 제외.
5. **자동업데이트 handoff 원본 함수 40/40:** `restoreUpdateSessionHandoff`의 tab vs shared, 영구 세션 부활 차단, 관리자 다른 세션 소유권, 유효시간, 신구 legacy logout replay, 새 exact tombstone, 큰 시계 보정 및 다중 local 직원 시나리오.
6. **Realtime 원본 함수 mock 20/20:** `startRealtime` 실제 함수의 subscribe/catch-up, INSERT refresh, 새 채널 고유 topic, 옛 채널 SUBSCRIBED/오류/이벤트 늦은 완료 무시, PIN·offline·shared mismatch. 별도 탐색으로 `requestRealtimeCatchup`/`scheduleRealtimeRefresh`의 늦은 Promise 22건도 이전 후보에서 PASS했으나 최종 291에 중복 계수하지 않음.
7. **JS/HTML/기존 보안 가드 정적 41/41:** 인라인 JS 2개 파싱, literal HTML id 488 중복 0, 버전/main SHA 확인. 선행 30~36 세션/Web Locks/로그아웃 차단/초기 PIN/권한·모달/근태 날짜 선택·감사·Realtime 핵심 함수 존재 확인. 정적 존재 검사는 실 UI 동작시험 아님.
8. **GitHub 안전 인계:** QA `index.html`만 제품코드 변경, 이슈 `qa-round3/issues/3-8-37-001_OLD_LEGACY_LOGOUT_REPLAY_AFTER_LOCAL_RELOGIN.md` 및 본 보고서, state/next-chat 인계 QA 브랜치 기록. 운영 `main`·실 직원 DB·Supabase 원격 접속/배포 변경 없음.

## 미검증 및 다음 3-8-38
- 실제 2개 구버전/신버전 Chrome 탭을 통한 localStorage/브라우저 mutex/시계보정 경합, epoch 표식 저장 자체 실패 이후 rollback까지 실패하는 복합 장애. 이번 수정으로 레거시 writer의 새 logout까지 막았다는 주장 금지.
- 원격 고유 토큰/두 개의 QA 계정·실 Supabase Realtime 구독·관리자 초기 PIN 연쇄변경, Android/iOS PWA 접근성 및 실제 전체 앱 뷰는 별도 QA 환경 필요.
- **다음 3-8-38:** login epoch 저장 실패·시계 급변/정리 정책·bootstrap 상수 초기화 순서 및 Realtime catch-up 실패/신규 이벤트 연속성 집중 QA. 운영본/실 직원 기록 보호 지속.

작성 시각 (KST): 2026-10-20T16:20:22.661+09:00
