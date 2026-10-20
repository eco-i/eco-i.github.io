# 3-8-42-001 — 로컬 로그인 pending 차단 표식 읽기 실패를 표식 부재로 오인

- 분류 **MEDIUM**, QA-only, 운영 미반영. 범위: `local:<id>` 모의 로그인/이전 버전 로컬 저장소 복원. 실제 서버 UUID 세션/직원 인증 우회 증명 아님.
- **원본 실제 함수 재현:** 로컬 저장소에 이미 `staffAttendance_updateLocalLoginPending_v1:local%3A7`이 존재하지만 그 키의 `localStorage.getItem`만 일시적으로 예외를 던지면 `storageGet`이 예외를 빈 문자열로 숨겼다. 그 결과 `storedSessionTombstoned('local:7')=false`, `storedSessionToken()='local:7'`, `storeLoginSession('local:7',persistent,false)=true`가 성립했다. 원본 QA blob `24aac098a0a178b28c6be3c97d368286144b5531`, **모바일/PC 로그인 유지/PC 임시 3범위** 재현. 실제 물리 브라우저 E2E 아님.
- **QA 수정:** `storedSessionTombstoned`의 pending-guard 판독은 `localStorage.getItem`을 별도로 try/catch하여 읽기 예외면 **true(차단)** 반환. `storeLoginSession(...,clearLogoutTombstone=false)` handoff guard 판독도 읽기 예외면 **false(복원 거부)** 반환. 실제 없는 키는 계속 정상 통과, guard가 있는 경우/시각상 오래된 경우에는 기존 fail-closed 유지. 서버 UUID 토큰 관련 처리 변경 없음.
- **최종 커밋 소스 검증:** 정상 로그인/epoch 거절/readback 거절/guard 제거 거절 × 3 범위 × 2 기존 guard × 4 logout 증거 = 96 시나리오·**480/480 assertions PASS**; pending guard 없음/있음/오래됨/선택적 읽기 오류/전체 공유 저장소 읽기 오류/쓰기 거절 × 3 범위 = 18 시나리오·**54/54 assertions PASS**; 최종 JS/DOM/버전 정적 **7/7 PASS**; Realtime `requestRealtimeCatchup` 지연 Promise/새 신호/옛 세션 소유권 **16/16 PASS**. 합계 **557/557**. 원본 실패 재현은 PASS 개수에 포함하지 않음.
- **한계:** 모든 저장소 read/write가 연쇄 실패하는 브라우저 환경에서는 사용자 로그인이 거부될 수 있음(의도한 fail-closed). 저장소 외부의 오래된 JS 구버전 탭은 새로운 pending 키 자체를 인식하지 않을 수 있어 모든 혼합버전 간 원자성을 보장할 수 없음. 물리 Chrome/Android/iOS, 브라우저 실제 Web Locks, Supabase QA 계정/Realtime 통합 검사는 미실행.
- 코드 QA `index.html` blob `6c9727dcb3f39d1c2f3063fafbdbe6838cfb345b`, 코드 커밋 `2bcdb23791dd67523b2dbce51284c7acbc5fa523`.
- 운영 `main`, 실제 직원/근태/지문 DB, RPC/SQL 및 운영 배포 **접근·변경 없음**.
- 작성: 2026-10-20 18:03:01 KST
