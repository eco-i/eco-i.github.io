# 근무모아 3차·깊이8 — 3-8-43 공식 검수 보고서

## 공식 결과
- **3-8-43 범위 완료, MEDIUM 신규 제품 결함 1종(3-8-43-001) 실제 핸들러 mock 재현·QA 코드 수정. CLEAN 아님.**
- 3차 누적 신규 제품 결함 **35종** (42 완료 34종 + 1). 2차 540종은 별도.
- 최종 QA `index.html` blob **`44639c7e2f31f7037b4a10999c580348c083fd1e`**, 제품코드 커밋 **`baab6ab7704364fbfbbd74b11407625344079213`**. 42 완료 이전 blob `6c9727dcb3f39d1c2f3063fafbdbe6838cfb345b`. APP_VERSION `ver20261018-2313` 유지.
- 최종 GitHub 실제 소스 기반 격리·정적 **381/381 assertions PASS**. Chrome/Web Locks/Android/iOS/QA Supabase 실제 종단간 테스트는 하지 않았고 검증 통계에도 포함하지 않음.
- 운영 `main` 및 실제 직원 DB·근태·지문·실 RPC/SQL/배포 접근·변경 없음.

## 깊이8 검수 내용
1. 공식 `CURRENT_STATE.json` / `START_HERE_NEW_CHAT.md` / `QA_3-8-42_REPORT.md` 직접 조회하여 42 완료, 다음 43, 3차 누적 34종과 QA HTML blob 대조. main 별도 유지.
2. pending local-login guard의 정상 재인증/이전 epoch 회복 및 PC 임시·PC remembered·모바일 차단/복원 규칙 확인. guard 읽기 실패는 fail-closed, 같은 token 정상 신선 로그인만 guard 해제.
3. **원본 제품결함 재현:** 기존 `handleSharedSessionStorageChange`가 정확히 동일한 suppression token의 PC temporary sessionStorage 로그인만 storage 이벤트 처리에서 제외. 기존 `storedSessionTombstoned`는 반대로 해당 토큰을 revoked로 처리해 이벤트 즉시 UI 권한 제거가 불일치. 서버 auth bypass가 아닌 민감 UI 지연 정리 위험.
4. **QA 국소 수정:** storage suppression 경로에서 PC 임시 제외 조건 제거, `current===e.newValue` 토큰 일치 시 `logout(false)` 실행. 잘못된 token·foreign storage 이벤트는 기존대로 무시, 비로그인 세션에는 영향 없음.
5. **수정본 실제 핸들러 102/102 PASS:** 모바일 여부×PC tab token 존재×동일 token 여부×4 이벤트 유형=32종×3 assertions(로그아웃 호출수, deferred admin draft cleanup, 서버 RPC 없는 local logout 호출) =96; 외부 storage area 2×현재 token 3 =6.
6. **Realtime reconnect 32/32 PASS:** 실제 `scheduleRealtimeReconnect` 함수, 소유권/새 channel 존재/제거 Promise 후 세션 소유권/오프라인/old channel 존재 2⁵ 조합. 늦은 remove 완료가 새 세션 채널을 열지 않으며, 최신 채널 참조를 제거하지 않음.
7. **guard 정상 재로그인 실제 함수 180/180 + 최종 정적 7/7 PASS:** 3 저장 방식×이전 guard 유무×3(정상/epoch write 거절/guard remove 거절)×2(legacy 기록 없음/있음)×5 관찰값=180. inline script parse 2, script 개수1, HTML ID 488개/고유성 각1, APP_VERSION1, 이전 로그인 guard 3경로1. 최종 Realtime `startRealtime` status/INSERT/stale channel source mock 18 케이스 **60/60 PASS** (SUBSCRIBED·INSERT·CLOSED 이벤트와 callback 소유권).
8. QA 코드·이슈·보고서와 명시적인 **`qa-round3/EXIT_CRITERIA.md` 종료 게이트**를 GitHub에 기록. `main` HEAD 불변 검증. 종료 판단은 블록 숫자가 아니라 고위험 이슈·브라우저/서버 검증의 확인 여부를 기준으로 하며, 미실행 E2E를 완료로 처리하지 않음.

## 남은 위험 / 다음 3-8-44
- pending guard의 storage 이벤트는 새로운 key이므로 현재 변경사항이 모든 구버전 탭의 동기화를 보장하지는 않음. guard가 매우 오래 남는 정상 복구, 기기 시계 급변, localStorage 완전 장애에서의 사용자 안내 역시 실제 기기 미검증.
- 실제 Chromium old/new 2탭·Web Locks 권한 경합, Android/iOS PWA, 관리자 PIN/사진·관리 화면·실시간 실계정 QA-only 2계정 Supabase 채널 접속은 **미검증**, 실제 직원 데이터는 실험에 이용할 수 없음.
- **다음 3-8-44:** 미해결 guard storage 이벤트/UX의 영향도 좁혀 확인하고 종료 기준 중 실제 가용 QA-only 테스트 환경에서 확인 가능한 항목을 우선한다. 같은 종류의 모의 edge case를 끝없이 늘리지 말 것.
- EXIT_CRITERIA.md의 **확인된 것 / 격리 환경 필요 / 배포 이전에 반드시 증명할 것**을 분리하여 사용자 동의 없이 운영 main 병합하지 않음.

작성 KST: 2026-10-20 18:20:51.
