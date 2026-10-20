# 3-8-41-001 — 복합 epoch 롤백 실패로 이전 로컬 로그아웃 차단이 무력화됨

- **MEDIUM / QA-only**. 기존 3-8-40-001에서 명시적으로 미검증으로 남긴 저장소 복합 장애를 실제 QA JS 원본 함수+모의 localStorage 순서로 재현.
- **재현:** 같은 `local:7`이 이미 저장되고 1초 전 legacy logout aggregate가 남은 상태에서 재로그인 중 epoch `setItem` 성공 → epoch `getItem` 한 번 예외 → 예전 epoch로 되돌리는 `setItem` 또는 `removeItem`마저 예외. `storeLoginSession`은 false를 반환했지만 새 epoch가 잔존하여 이전 legacy logout을 무시하고 `storedSessionTombstoned('local:7')===false`. PC 임시/PC 로그인 유지/모바일 각각 이전 epoch 없음/있음 6조건 재현. 실제 브라우저 인증 우회가 아닌 **local-preview-only 모델의 격리 저장소 오류**.
- **수정:** `completeFreshLoginLogoutReset`은 이전 로그아웃 증거를 건드리기 **전에** token별 `staffAttendance_updateLocalLoginPending_v1:` 영속 차단 표식의 성공을 확인. 실패 중 epoch 되돌리기가 거절돼도 `storedSessionTombstoned`(초기 bootstrap에서 리터럴 키 사용)이 해당 token을 거부. 기존 세션 복원 `storeLoginSession(token,...,false)` 역시 차단. 모든 관련 로그아웃 증거를 정상 정리한 **최종 성공 시에만** guard를 `removeItem`으로 해제. 마지막 해제에 예외가 나면 로그인 false/guard 유지. 같은 token 재시도 성공으로 이 guard를 회수할 수 있음. 서버 UUID token 처리에는 guard를 적용하지 않음.
- 추가 회귀: old-version legacy writer의 과거 timestamp 재기록은 정상 fresh login 뒤 무시; 동시각/이후 logout 기록은 차단, 다른 local token guard 격리, 3 저장방식×2 과거 epoch×7 결함 유형 42건과 이전 token/guard/handoff/복구 주장 217 assertions(정적 7 포함), old writer·독립 토큰 55, Realtime delayed read 16 = **최종 QA 소스 288/288 PASS**. 최초 시험 fixture 오류 및 원본 실패 재현은 PASS 총계 제외.
- 한계: localStorage가 guard 자체를 성공적으로 기록/읽을 수 없다면 여러 탭 전체에 **영구적인** 차단을 보장할 수 없음. 브라우저 종료 후 유효성·물리 Chrome/Android/iOS/원격 Supabase 세션을 확인했다고 주장하지 않음. guard가 오류로 잔존하면 정상 로그인도 다시 성공할 때까지 차단하는 fail-closed 사용성 비용이 있음.
- 수정 QA blob `24aac098a0a178b28c6be3c97d368286144b5531`; 코드 커밋 `0d98563a7dcc42eb75bf9f4f264e1f832134a985`; 운영 main, 실 직원 DB·지문/근태·실계정 RPC/SQL/배포 미변경.
- 작성 시각 2026-10-20 17:53:55 KST.
