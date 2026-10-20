# 3-8-38-001 — 로컬 로그인 epoch 기록 실패 시 로그아웃 증거 선삭제

- 심각도: **MEDIUM** / QA-only / 운영 미반영
- 실제 문제: 동일 `local:7` 토큰으로 다시 로그인하는 도중, `storeLoginSession`이 먼저 `clearUpdateHandoffLogoutTombstone` 및 `clearSharedLogoutSuppressionForFreshLogin`을 성공시킨 뒤 `recordLocalFreshLoginEpoch`의 저장이 quota/private-mode 쓰기 실패로 거부되면 false로 종료한다. 직전 `SESSION_KEY=local:7`가 남아 있던 경우 이전 로그아웃 표식이 삭제되어 `storedSessionTombstoned(local:7)`가 false로 바뀐다. 로그인 실패 중 구세션이 저장소 기준으로 다시 유효해질 수 있다.
- 재현: 원본 QA blob `084696ce5ef54748bcb0043a14504cbae10ebe26`에서 **실제 원본 함수+모의 localStorage 실패**. 모바일/PC 로그인 유지/PC 임시 모두 동일 재현. 저장 실패를 주입했을 때 `storeLoginSession=false`, 하지만 `storedSessionTombstoned=false`; 실제 브라우저 E2E 수행 아님.
- 수정: `completeFreshLoginLogoutReset`으로 **로컬 epoch 저장·재읽기 성공을 먼저 검증**한 뒤에만 이전 로그아웃 토큰 및 공유 suppression 제거. 후속 제거 실패 시 해당 토큰의 이전 epoch 복원 시도. 서버 UUID 토큰은 기존 epoch 미적용 정책 유지.
- 최종 QA 코드: `index.html` blob `a9eeafdc9e1531b54423c9067c31762a6cb5601e`; commit `fb6d027d720ae1eb41c3989735f3ef19f1794fd4`.
- 확인: 실패·성공·기존/미존재 세션·legacy/exact logout·suppression 실패 등을 포함한 **실제 소스 격리 59 assertion PASS**(Realtime 지연 콜백 6종, JS parse, DOM ID, 버전 확인 포함). 특히 3가지 로그인 저장 범위 × exact/legacy 이전 logout에서 epoch 저장 실패 시 차단 유지.
- 제한: 실패한 localStorage **rollback 자체가 거부되는 복합 고장**, 오래된 버전과의 실제 동시 탭, clock correction, 물리 Android/iOS, 실제 Supabase 인증/DB는 이 모의시험으로 보장할 수 없음. 실제 운영 employee DB 절대 접근하지 않음.
- 운영 브랜치 `main` 및 실제 직원/근태/지문 기록 조회·수정·SQL·배포 **없음**.

작성: 2026-10-20 16:38:07 KST
