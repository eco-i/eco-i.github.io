# 근무모아 3차·깊이8 공식 인수인계

- **3-8-39 공식 완료: MEDIUM 신규 결함 1종 재현·QA 수정, 커밋 실제 소스 격리·정적 495/495 assertion PASS. 다음 3-8-40.** 3차 누적 **31종**(2차 540종 별도). CLEAN 아님.
- GitHub: `eco-i/eco-i.github.io`; 검수 `qa-3-8`; 운영 `main`. 새 채팅에서는 `qa-round3/CURRENT_STATE.json`, 본 문서, `qa-round3/QA_3-8-39_REPORT.md` 직접 확인.
- **3-8-39-001 MEDIUM:** `pruneUpdateHandoffLogoutTokenKeys`가 65개 이상의 서로 다른 최근 logout key 중 시각상 오래된 **아직 유효한** 기록을 숫자 64 상한으로 제거. 이로 인해 `updateHandoffTokenWasLoggedOut` / `storedSessionTombstoned`가 false를 반환해 잠든 PC 임시탭/모바일 잔존 토큰의 자동복원 차단이 약화될 수 있음. 1분 내 65개 이상의 별도 토큰 발생이라는 희귀·고부하 경계 조건이며, **실제 서버 계정 진입/인증 우회는 확인하지 않았음**.
- 수정은 `qa-3-8/index.html` 토큰 정리 함수 1곳만. 만료된 per-token 로그아웃 기록은 기존대로 정리하되, 아직 fresh한 기록은 수량 상한으로 제거하지 않음. 비정상적인 미래 clock/tombstone 다수 시 저장소 사용량 증가 가능성 별도 관리.
- 이슈 `qa-round3/issues/3-8-39-001_FRESH_LOGOUT_TOKEN_EVICTED_AT_64_CAP.md`, 보고서 `qa-round3/QA_3-8-39_REPORT.md`.
- 최종 QA HTML blob **`5ef9c5c4d2e94498e7285b55079454e37ac16d96`**, 제품코드 커밋 **`26c6fbeaadaa0e787968d69fee7d9b4995188fb6`**. 이전 38 완료 blob `a9eeafdc9e1531b54423c9067c31762a6cb5601e`. `APP_VERSION=ver20261018-2313` 불변.
- **495/495 PASS 분류:** 최종 커밋 실제 소스 `prune/updateLogout/storedTombstone/storedSessionToken` 3 저장방식×10 토큰수×4 시각조건×4 assertion=**480**; 최종 JS 파싱 2, script 개수 1, HTML id 488 중복 0 (2 checks), 앱버전 1, 이전 epoch 보정 guard 1 = **7**; 실제 `requestRealtimeCatchup` Promise 2×2×2 **8**. 중단된 timer harness와 잘못 구성된 초기 fixture 결과는 **전부 제외**. 실제 full browser/Supabase E2E 아님.
- 운영 `main` 기준 SHA **`6c784210e048426f18a486d5602652626d97574d`** 유지. 실 직원 계정·근태·지문 DB 조회/변경, SQL/RPC 및 운영 배포 **0**.
- **다음 3-8-40:** local epoch key 오래된 값 정리/복원, localStorage set/remove 양쪽 거절 상황, Realtime refresh 2단계 예약 타이머/느린 Promise/세션 소유권, 오래된 페이지 2탭 Web Locks. Chrome·Android/iOS·QA-only 실계정 통합은 아직 미검증. 운영 DB는 절대 접근하지 말 것.
- 연결 안정성·짧은 진행 보고·채팅 용량 최우선. 상세 기록 GitHub에만. ZIP 파일 불필요.

