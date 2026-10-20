# 근무모아 3차·깊이8 — 3-8-39 공식 검수 보고서

## 공식 판정
- **3-8-39 완료 (범위 한정), 신규 MEDIUM 결함 1종 3-8-39-001 수정. CLEAN 아님.**
- 3차 누적 **31종**(3-8-38 완료 30+1), 2차 별도 540종.
- QA `index.html` 이전 blob `a9eeafdc9e1531b54423c9067c31762a6cb5601e` → `5ef9c5c4d2e94498e7285b55079454e37ac16d96`. QA 코드 commit `26c6fbeaadaa0e787968d69fee7d9b4995188fb6`. `APP_VERSION=ver20261018-2313` 유지.
- **최종 커밋 실제 소스 격리/정적 495/495 assertion PASS**: logout retention 480, 구문·HTML·기존 불변식 정적 7, Realtime 지연 Promise 8. 원본 실패 및 잘못 구성된 초기 실험 fixture, 대기 중단된 테스트 harness는 이 숫자에 **불포함**.
- 운영 main·실 직원 DB·근태/지문기록 조회 및 변경·원격 SQL/RPC/배포 0.

## 깊이8 범위
1. GitHub 공식 상태/38 보고서/인계 QA blob 대조, 운영 기준 분리.
2. 로컬 로그인 epoch 만료(60초), 클록 5초 미래 허용, 이전 logout legacy와 per-token 우선순위 코드 검토. 숫자 기준 prune는 epoch 자체가 아니라 token-specific logout marker에 존재하는 것으로 확인.
3. 실제 원본 `pruneUpdateHandoffLogoutTokenKeys`, `updateHandoffTokenWasLoggedOut`·`storedSessionTombstoned` 실행: 유효 marker 65개에서 oldest 1건 삭제 후 로그아웃 감지가 해제됨. 1~64 건 정상. 이로 인한 서버 측 인증 우회는 실증하지 않음.
4. 수정은 해당 `index.html` 정리 함수 1곳에만 적용. 매번 expired record 제거는 유지하고 valid record count eviction 중지.
5. **커밋된 실제 JS 원본 함수 검사 480/480 PASS:** 3 저장 방식(모바일/PC임시/PC기억) × 10 marker 카운트(1,2,16,32,63,64,65,66,100,256) × 4 시각 조합(전부 fresh, 5번째 만료, 뒤로 시계 보정, 3번째 invalid) × 4 assertion(로그아웃 인식/부트스트랩 토큰 거부/유효 기록 수/탭 차단).
6. **Realtime source delayed Promise 8/8 PASS:** 신규 signal 유무×정상/실패 완료×이전 세션 소유권 변경. 최신 신호를 완료 처리로 덮지 않음. 실제 채널/slow network 통합은 미실행. 3-8-38 epoch helper 3경로 보존 확인.
7. **최종 HTML 정적 7/7 PASS:** 2 inline JS syntax, script count, HTML id 488개 고유, 버전, 세 login scope 보호. 정적 검사는 full-app UI 증명이 아님.
8. 코드는 QA 브랜치만 커밋. 운영 `main` HEAD / 직원 데이터 불변 확인. 보고서·이슈·공식 인계 갱신.

## 다음 3-8-40 / 미검증
- 다른 탭이 보관한 token을 실제 로그아웃 65회 이후 Chrome/PWA 부트스트랩에서 복구하려는 E2E, 테스트 계정만을 사용하는 원격 세션 인증/Realtime 통합; 운영 직원 DB 제외.
- timestamp가 큰 미래인 marker가 오래 남을 때 localStorage quota; 개인 로컬 epoch key 단독 만료/정리; 양쪽 rollback 실패; 구버전 writer 동시 기록; 초고빈도 토큰 생성을 실제 운영과 동일시하지 않음.
- Full Android/iOS 접근성/초기 PIN/관리자 role handoff·실 multi-tab Web Locks 교차 실행, slow mutation catch-up 로컬 mock 미검증.
- 다음 범위는 **3-8-40:** 남은 local epoch 정리 정책, store/remove 둘 다 실패하는 저장소 경합, Realtime refresh timer 실제 예약 순서 및 이전 세션 타이머 소유권. 오직 격리 QA.

작성 (KST): 2026-10-20 16:56:48
