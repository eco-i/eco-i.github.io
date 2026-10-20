# 근무모아 3차·깊이8 공식 인수인계

- **3-8-40 공식 완료: MEDIUM 신규 결함 1종 실제 소스 mock 재현·QA 수정, 최종 327/327 assertion PASS. 다음 3-8-41.** 3차 누적 **32종**(기존 2차 540종과 별개). CLEAN 아님.
- 저장소 `eco-i/eco-i.github.io`, 검수 브랜치 `qa-3-8`, 운영 `main`. 다음 채팅에서 `qa-round3/CURRENT_STATE.json`, 본 문서, `qa-round3/QA_3-8-40_REPORT.md` 먼저 직접 확인.
- **3-8-40-001 MEDIUM:** `local:7` 이전 세션 + legacy logout 이력이 있을 때 `recordLocalFreshLoginEpoch`의 epoch `setItem`은 성공하고 **바로 뒤 확인용 `getItem`만 실패**하면 `storeLoginSession`이 false를 반환해도 새 epoch가 남아 이전 legacy 로그아웃이 무효 취급될 수 있음. 모바일/PC 로그인 유지/PC 임시 세 경우 모두 **원본 실제 JS 함수+가짜 저장소 오류 주입**으로 재현. 실 Chrome·Supabase E2E 재현은 아님.
- 수정: `completeFreshLoginLogoutReset`에서 epoch 기록 자체의 실패까지 `restorePreviousEpoch` 공통 롤백을 적용. 기존 downstream logout cleanup 실패의 rollback도 유지. **rollback `removeItem` 또는 이전 값 `setItem`까지 거절되는 복합 장애는 해결 보장 없음**; 다음 단계에서 추가 점검.
- 이슈 `qa-round3/issues/3-8-40-001_EPOCH_READBACK_FAILURE_LEAVES_REJECTED_LOGIN_UNBLOCKED.md`; 보고서 `qa-round3/QA_3-8-40_REPORT.md`.
- 최종 QA HTML blob **`a86df78b95ae19fffe0f0bb49d613f2f7336a66b`**, 제품코드 커밋 **`139360be01d772c6fd9fdbe0a6170d12961af0bd`**; 이전 39 blob `5ef9c5c4d2e94498e7285b55079454e37ac16d96`. `APP_VERSION=ver20261018-2313` 유지.
- 최종 커밋 실제 함수/정적 **327/327 PASS** = 저장소 오류 주입 3 storage scopes × 2 prior epoch × 4 logout marker 종류 × 3 정상/오류 상황 × 4 체크 = **288** + Realtime `scheduleRealtimeRefresh` 예약/재예약/지연 Promise/새 신호/이전 세션 소유권 **32** + 최종 JS parse 2, script 개수 1, DOM 488 id 두 검증, 버전 1, 세 로그인 경로 확인 1 = **7**. 오류 있는 초기 harness 중간 테스트 결과는 계산에서 제외.
- **운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d` 유지**, 실 직원 DB·지문/근태 기록 조회/수정·SQL/실계정 RPC 및 배포 **0**.
- **다음 3-8-41:** epoch rollback remove/set 둘 다 실패하는 storage quota/private-mode 복합 장애, epoch key 정리/시계 급변, Realtime 이전 타이머 ownership / session switch, 기존 장기 미검증 browser/Android/iOS / QA 격리계정 다중탭 E2E. 운영 및 실 직원 DB 절대 접근 금지.
- 연결 끊김 방지·짧은 보고·채팅 용량 최소화 우선. 상세는 GitHub에 기록. ZIP 불필요.
