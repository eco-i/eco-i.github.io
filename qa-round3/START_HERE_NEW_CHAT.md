# 근무모아 3차·깊이8 공식 인수인계

- **3-8-41 공식 완료: MEDIUM 신규 결함 1종 실제 소스 저장소 mock 재현·QA 수정, 최종 288/288 scoped assertion PASS. 다음 3-8-42.** 3차 누적 **33종**(2차 누적 540종 별도). CLEAN 아님.
- GitHub 저장소 `eco-i/eco-i.github.io`; 검수 브랜치 `qa-3-8`; 운영 브랜치 `main`. 새 채팅 첫 작업: `qa-round3/CURRENT_STATE.json`, 본 파일 및 `qa-round3/QA_3-8-41_REPORT.md` 직접 조회.
- **3-8-41-001 MEDIUM:** 이전 `local:<id>` logout 이력+저장소 토큰이 남아 있는데 동일 토큰 재로그인 epoch 쓰기 성공/검증 읽기 실패/이전 epoch rollback 쓰기 또는 삭제 실패가 연속하면, 실패한 로그인에 남은 epoch 때문에 과거 로그아웃이 무효 처리. **PC 임시/PC 로그인 유지/모바일×이전 epoch 유무 = 6개** 원본 JS 함수·저장소 mock 재현. 실제 Supabase 계정 인증 우회 증명 아님.
- QA 수정: `staffAttendance_updateLocalLoginPending_v1:<token>` 영속 guard를 **logout 표식 변경 전** 성공 확인하고, `storedSessionTombstoned` bootstrap에서도 리터럴 키로 검사. 미완료 guard가 있으면 자동업데이트 `storeLoginSession(clearLogoutTombstone=false)`도 거부. 모든 로그아웃 기록 정리가 성공한 마지막 단계에서만 동기 제거. 실패 후 기존 토큰 자동복원 차단. 서버 UUID token에는 적용하지 않음.
- 이슈 `qa-round3/issues/3-8-41-001_COMPOUND_LOCAL_EPOCH_ROLLBACK_FAILURE_RESTORES_OLD_TOKEN.md`, 보고서 `qa-round3/QA_3-8-41_REPORT.md`.
- 최종 QA HTML blob **`24aac098a0a178b28c6be3c97d368286144b5531`**, 제품코드 커밋 **`0d98563a7dcc42eb75bf9f4f264e1f832134a985`**. 40 완료 이전 blob `a86df78b95ae19fffe0f0bb49d613f2f7336a66b`. `APP_VERSION=ver20261018-2313` 불변.
- **최종 QA 함수/정적 288/288 PASS 구성:** 3 저장 범위×2 기존 epoch×7 오류 조합×5 assertion = **210** + 최종 JS parse(2)/HTML IDs(2)/script 개수(1)/버전(1)/세 로그인 경로(1) = **7** + 이전 old-version legacy writer 재생·토큰 격리·초기 bootstrap **55** + Realtime 느린 Promise/신규 signal/세션 소유권 **16**. 초기 시험 fixture 오류 및 original 실패 재현은 PASS 통계 제외. 실제 physical browser/Supabase E2E 아님.
- 운영 `main` 기준 SHA **`6c784210e048426f18a486d5602652626d97574d`**, 실 직원 DB/근태/지문 조회·수정, 실계정 RPC/SQL 및 배포 **0**. 마지막에 main ref 다시 확인.
- **다음 3-8-42:** pending guard 정상 재로그인으로 회수/삭제실패시 사용자 복구 정책, old-version 브라우저 탭과의 호환, clock skew·epoch 키 prune/저장소 한계, Realtime 세션 전환 중 timer/채널 ownership. Guard 자체를 저장하거나 읽을 수 없는 완전 저장소 장애에서는 모든 탭의 영속 fail-closed를 보장할 수 없음을 명시. 운영 직원 DB 절대 금지.
- 연결 안정성·채팅 길이 최소화, GitHub 인계 기록 위주로 짧게 보고. ZIP 불필요.
