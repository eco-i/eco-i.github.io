# 근무모아 3차·깊이8 — 3-8-40 공식 검수 보고서

## 판정과 기준
- **3-8-40 범위 한정 완료 / MEDIUM 결함 1종(3-8-40-001) 재현 및 QA 수정 / CLEAN 아님.**
- 3차 누적 신규 제품 결함 **32종**(기존 31 + 1). 2차 540종 이력 별도.
- 최종 QA 코드 `index.html` blob **`a86df78b95ae19fffe0f0bb49d613f2f7336a66b`**, 코드 커밋 **`139360be01d772c6fd9fdbe0a6170d12961af0bd`**. 이전 QA blob `5ef9c5c4d2e94498e7285b55079454e37ac16d96`.
- **유효 검사 총 327/327 PASS:** 로그인·저장소 288 + Realtime 타이머 32 + 최종 정적 7. 실제 브라우저 E2E는 미검증.
- `APP_VERSION=ver20261018-2313` 불변. 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d` 분리, 실 직원 DB·지문·근태·SQL·실계정 RPC/배포 0.

## 검수 8단계
1. GitHub `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-39_REPORT.md` 직접 대조. 39 완료/다음 40/누적 31종/QA HTML blob 기준 확인.
2. 로컬 login epoch timestamp 유효성(60초/5초 미래 허용), legacy aggregate 비교, exact token logout, shared suppression, expiry-only marker pruning(39 수정)을 원본 소스에서 검토. 만료된 epoch 키 자체는 별도의 정리 루프가 없어 잔존 가능하지만, 만료 시 필터가 거절하여 즉각적인 세션 부활 결함으로 단정하지 않음.
3. 원본 실제 함수 mock 재현: local token 기존 세션 + legacy 이전 logout에서 epoch `setItem` 성공 후 **검증용 `getItem` 1회 예외** 발생 → 저장 false인데 새 epoch가 남아 이전 logout이 무시됨. 모바일/PC remembered/PC temporary 세 저장 범위 모두 재현.
4. `completeFreshLoginLogoutReset`의 실패 경로에도 복구 함수를 적용: epoch 기록 실패(설정 실패·readback 실패) 또는 후속 tombstone/suppression cleanup 실패 시 기존 epoch로 복원 시도. 최소 국소 QA HTML 수정.
5. 최종 GitHub 커밋 실제 함수 `storeLoginSession`, `storedSessionTombstoned`, epoch 및 logout helper **288/288 PASS**: 3 로그인 범위×2 epoch 이전값×4 logout 표식 유형×3 조건(정상/epoch set 거절/set 뒤 readback 거절)×4(최종 반환, 구세션 차단, epoch 정리, 예외 주입).
6. 커밋 실제 소스 `scheduleRealtimeRefresh` 타이머/Promise/세션 소유권 **32/32 PASS**: 예약 전 pending 유무, 예약 후 pending 유무, 실행 중 새 signal, 정상/실패 read, 세션 소유권 상실 2×2×2×2×2. 지연 타이머 최대 3회 실행, 재예약 동작 검증. 처음 미완성 harness의 경과상 오류는 통계에 산입하지 않고 다시 구성한 유효 fixture만 집계.
7. 최종 JS/HTML **7/7 PASS**: script 2개 parse, script 개수, HTML literal id 488개 중복 0, APP_VERSION 불변, 3 login 저장 경로의 epoch guard 보존. 정적 검사와 실제 로그인 full-app UI 통합 검증은 구분.
8. GitHub `qa-3-8`만 제품코드 커밋 후 이슈·보고서·state·인계 저장. 운영 `main`과 실 직원 DB는 호출하지 않았으며 변경/배포하지 않음.

## 한계·다음 3-8-41
- **실 브라우저:** old/new Chrome 2탭/Web Locks/localStorage readback transient exception, Android/iOS PWA, 실제 로그인/관리자 PIN/role handoff/Realtime Supabase 연동 전부 미검증.
- **복합 저장 실패:** epoch 쓰기 직후 readback 실패와 이어지는 rollback remove/set마저 실패할 때 durable 증거 보장 미입증. 만료 epoch 키 자체의 주기적 정리/스토리지 quota·시계 큰 보정, PC temporary 구버전 writer 원자성도 별도 QA 필요.
- 실제 직원 DB에 연결하지 말고 격리 mock 및 테스트 계정에서만 진행.
- 다음 **3-8-41:** rollback까지 거부되는 storage failure, epoch cleanup/clock skew, Realtime lifecycle에서 새 세션 타이머 소유권 및 nested restore 추가 검증.

작성: 2026-10-20 17:20:32 KST
