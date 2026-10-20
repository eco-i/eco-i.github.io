# 근무모아 3차·깊이8 — 3-8-36 공식 검수 보고서

## 결과
- **3-8-36 완료(이번 범위 한정). 신규 MEDIUM 결함 1종 `3-8-36-001` 발견·QA 수정. CLEAN 아님.**
- 3차 누적 신규 결함 **28종** (= 이전 27 + 이번 1). 2차의 별도 이력 540종은 집계에 더하지 않음.
- **189/189 유효 실제 소스 격리·정적 검사 통과** = 로그인/로그아웃 저장소 **108** + 자동업데이트 handoff 복원 **20** + Realtime 구독 경합 **20** + JS/HTML·기존 보안 가드 **41**.
- QA 이전 HTML `4fd569795a1eafbdaf0918c4e0f2c4f0dfca3cbe` → 최종 HTML blob `86ff27b08a66f7e1853f3888a74a7d8ba0109471`, QA 코드 커밋 `5126e7d2a2382af0e404987f4aa3f0f48cf0120f`. 앱 버전 `ver20261018-2313` 고정. 운영 main `6c784210e048426f18a486d5602652626d97574d` 불변.

## 깊이 8 수행
1. **인계 상태 확인:** GitHub `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, 35 공식 보고서를 직접 조회해 35 완료/다음 36/누적 27과 소스 blob 일치 확인. QA index 실제 전체 JS 분석.
2. **공유 suppression 로그인 회귀:** 35 완료 source의 `storeLoginSession` + `storedSessionTombstoned` 실제 함수를 추출하여 동일 token suppression가 있을 때 PC 임시 로그인의 성공 상태가 바로 차단됨을 재현. PC 영구·모바일은 suppression 제거 실패를 가짜 storage에 주입하여 같은 결과 재현.
3. **QA 국소 수정:** exact token 공유 suppression 제거 후 재조회 확인 함수 신설. 임시 PC·기억 PC·모바일 공통 fresh login 가드에 종전 handoff logout marker 해제와 AND 결합. 실패 시 성공하지 않고 저장된 세션을 가능하면 이전 상태로 복구. 다른 token의 suppression을 지우지 않음.
4. **저장소·로그인 격리 108/108:** PC 임시/영구/모바일 정상·정확히 일치하는 suppression·타 token marker·삭제 거부·legacy A/B 부분 이관·관리자 표시 및 새/옛 token 롤백·복원(clearLogoutTombstone=false) 각 조건 및 72개 추가 순서/저장모드/실패 조합 검증. 신규 실패 경로에서 false 및 상태 일치 확인. **실제 브라우저 구현·서버 토큰 발급 검사는 아님**.
5. **인계 복원 20/20:** `restoreUpdateSessionHandoff` 원본 실제 함수로 60초 TTL, 구버전 legacy·정확한 logout·부분 quota·관리자 handoff 보전·임시 대 영구 자동복원·이전 탭 로그인 우선순위 등을 가짜 storage에서 확인.
6. **Realtime 20/20:** `startRealtime` 실제 함수의 구독 시작, SUBSCRIBED catch-up, INSERT refresh, token mismatch·오프라인·강제 PIN·옛 채널 지연 SUBSCRIBED/CLOSED/오류 무시, 새 토픽 고유성 확인. 실제 Supabase 접속/Realtime 이벤트는 수행하지 않음.
7. **소스/기능 무결성 41/41:** 인라인 JS 두 블록 구문 정상, literal DOM id 488개 전부 중복 없음, APP_VERSION 유지, 기존 관리자 인증·세션·Web Locks·PIN·달력·감사·저장/삭제 중 작업·handoff·Realtime 핵심 코드 가드 존재 확인. 이는 그 모든 UI를 물리 브라우저에서 시험했다는 뜻이 아님.
8. **QA GitHub·운영 보호:** `index.html` QA 한정 코드 변경, 이슈 `qa-round3/issues/3-8-36-001_SAME_TOKEN_SHARED_LOGOUT_SUPPRESSION.md`, 본 보고서, state 및 handoff 갱신. main/실 직원 DB/RPC/SQL/배포 0.

## 다음 3-8-37 미검증 우선순위
- **구버전 동시 탭**이 같은 token의 옛 logout aggregate를 새 로그인 후 재기록하는 경합은 실제 구버전 writer+새 버전 reader가 동시에 있는 별도 QA 환경 검증 필요. 토큰 generation/최신성 보호를 바꾸려면 새 로그아웃 표식 우선순위가 약화되지 않는지 매우 신중히 판단.
- 브라우저 storage 제거/쓰기 모두 불능 및 실패한 rollback, 앱 전체 실제 멀티탭 Web Locks, local fallback 동일 token 재사용, initial PIN/관리자 unlock 세대 소유권, 실제 Supabase Realtime catch-up 불확실성.
- 실직원 데이터는 한 건도 사용하지 않았으며, 검증은 격리/정적 범위 한정.

검수 일자: 2026-10-20 (KST)
