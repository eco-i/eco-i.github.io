# 3-8-32-003 — 동일 token 재로그인에 대한 지연 관리자 표식 재삭제

- **Severity:** LOW (주로 local preview의 반복 token `local:<employee_id>`에서 확인). **QA:** `scheduleSharedAdminUnlockCleanup()`.
- **재현:** 옛 세션에서 관리자 unlock 정리 retry를 80ms 예약한 뒤 같은 직원으로 재로그인해 새 관리자 2차 인증을 획득해도, 기존 작업은 문자열 token이 같다는 이유로 새 `ADMIN_UNLOCK_KEY`를 삭제. 실제 예약 함수와 `clearSharedAdminUnlockIfToken`을 가짜 timer/storage로 실행해 동일 token + 새 epoch, 동일 token + 새 로그인 시도, Web Lock 대기 후 세대 변화의 **원본 3/3 실패 경로 재현**. 서버 UUID 토큰의 재사용이 일반적이라는 주장은 하지 않음.
- **QA 수정:** retry 예약 시 `sessionContextEpoch`와 `loginAttemptSeq`를 캡처. 타이머 시작 전, shared Web Lock callback 내부, 실패 후 다음 타이머 예약 전 반복 비교. 새 로그인 세대가 동일 token을 재사용하면 이전 정리 중단. 다른 token에 대한 old-marker cleanup 및 정당한 로그아웃 cleanup은 유지.
- **검증:** 일반 정리·같은 token 새 epoch/시도·다른 token·잠금 대기 변경·mutex 실패 후 재시도 = **7/7 PASS**. `requireSessionMismatch:true` 유형 별도 **6/6 PASS**. 원본 3 failures 제외.
- **제약:** 다른 브라우저 문서에서 완전히 동일한 local preview 토큰의 새 재인증을 실행했는데 현재 문서가 전혀 갱신되지 않은 비관측 이벤트는 mock에서 보증 못 함. 필요 시 실제 QA 멀티탭 확인.
- **QA blob:** `8d1793491a2ff6447011fde1b3db8eae05d05830`. 운영 main/DB 무변경.