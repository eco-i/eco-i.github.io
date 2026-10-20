# 근무모아 3차·깊이8 공식 인수인계

- **3-8-36 공식 완료: MEDIUM 신규 결함 1종 발견·QA 수정, 유효 격리·정적 검사 189/189 PASS. 다음 3-8-37.** 3차 누적 **28종**(2차 별도 540종). CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. 새 대화에서 `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-36_REPORT.md` 직접 확인.
- **3-8-36-001 MEDIUM:** 새 로그인 토큰 A와 shared logout suppression A가 같을 때 PC 임시 로그인은 표식을 전혀 해제하지 않음. PC 영구·모바일은 표식 제거 실패를 무시하고 로그인 성공으로 판정. 기존 저장 함수 + `storedSessionTombstoned` 실제 JS 추출, mock storage로 재현.
- 수정: `clearSharedLogoutSuppressionForFreshLogin(token)` 신설. 정확히 같은 token의 suppression을 제거 후 재조회. PC 임시/PC 기억/모바일 모두 이 해제와 35의 handoff tombstone 해제 둘 다 성공해야 fresh 로그인 성공. 실패 시 가능한 이전 session token 복원. 다른 token suppression 유지. 기존 `clearLogoutTombstone=false` 복원은 unchanged.
- 이슈 `qa-round3/issues/3-8-36-001_SAME_TOKEN_SHARED_LOGOUT_SUPPRESSION.md`, 보고서 `qa-round3/QA_3-8-36_REPORT.md`.
- QA HTML 최종 blob **`86ff27b08a66f7e1853f3888a74a7d8ba0109471`**, 제품코드 커밋 **`5126e7d2a2382af0e404987f4aa3f0f48cf0120f`**. 이전 blob `4fd569795a1eafbdaf0918c4e0f2c4f0dfca3cbe`. APP_VERSION **`ver20261018-2313` 그대로**.
- **189/189 PASS 구성:** 실제 로그인/표식 저장 함수 격리 108 + `restoreUpdateSessionHandoff` 실제 함수 20 + `startRealtime` 실제 함수/가짜 채널 20 + 최종 source/JS/HTML 보호장치 정적 41. 실제 full-app Chromium / 물리 Android/iOS / QA 서버·2계정 Web Locks·Supabase Realtime E2E **미검증**.
- 운영 `main` HEAD **`6c784210e048426f18a486d5602652626d97574d` 불변**, 직원 DB / 근태·지문 기록 / Supabase RPC·SQL / 운영 배포 **0**.
- **다음 3-8-37:** 구버전 탭이 **늦게 이전 legacy logout aggregate**를 재기록하면 같은 token 재로그인 차단 증거가 부활하는지, 성공한 새 로그인 세대 소유권 및 storage rollback 최악 실패, Realtime 채널/refresh 순서. 실제 구버전 writer와 새 버전 reader 동시성은 증명되지 않았으니 가짜 실기기 성과 주장 금지.
- 연결 안정성·짧은 보고·채팅방 용량 최소화. 직접 GitHub에서 검사/QA 커밋, 운영 무변경, ZIP 불요.
