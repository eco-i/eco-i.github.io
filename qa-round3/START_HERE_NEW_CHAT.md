# 근무모아 3차·깊이8 공식 인수인계

- **3-8-38 공식 완료: MEDIUM 신규 결함 1종 재현·QA 수정, 최종 커밋 실제 소스 격리·정적 59/59 assertion PASS. 다음 3-8-39.** 3차 누적 **30종**(2차 별도 540종). CLEAN 아님.
- GitHub: `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. 새 채팅: `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-38_REPORT.md` 먼저 직접 확인.
- **3-8-38-001 MEDIUM:** 같은 `local:<id>` 재로그인에서 새 epoch의 storage write가 실패하면 기존 `storeLoginSession`은 먼저 logout tombstone·shared suppression을 삭제한 뒤 실패를 반환. 남아 있는 동일 token의 옛 저장 세션이 로그아웃 차단 없이 보이는 순서를 **실제 원본 함수·저장소 실패 mock**으로 모바일/PC 임시/PC 로그인 유지에서 재현. 실 브라우저 E2E는 아님.
- QA 수정: 3가지 로그인 저장 범위에 `completeFreshLoginLogoutReset` 적용. local epoch 기록 성공을 **로그아웃 증거 삭제 전에** 확인, 후속 삭제 실패면 이전 epoch 복원 시도. 서버 UUID token 및 자동업데이트 `clearLogoutTombstone=false`는 기존 방침 유지.
- 이슈: `qa-round3/issues/3-8-38-001_FAILED_LOCAL_EPOCH_WRITE_CLEARS_LOGOUT_PROOF.md`; 보고서 `qa-round3/QA_3-8-38_REPORT.md`.
- QA HTML blob **`a9eeafdc9e1531b54423c9067c31762a6cb5601e`**, 코드 커밋 **`fb6d027d720ae1eb41c3989735f3ef19f1794fd4`**. 기존 37 blob `084696ce5ef54748bcb0043a14504cbae10ebe26`. 앱 버전 `ver20261018-2313` 유지.
- 최종 QA 실제 소스 mock/정적 **59 assertion PASS**: 모바일/PC 유지/PC 임시 × exact/legacy sign-out, epoch 실패/성공, suppression 실패/epoch 복원, 이전 세션 없음, 서버 UUID 정상 저장; Realtime `requestRealtimeCatchup` 지연 Promise 6종, JS 파싱 2, HTML id 488 중복 0. 59는 최종 커밋 소스에 한정하며 원본 실패 재현과 중간 후보 검사를 중복 계수하지 않음.
- **운영 main HEAD `6c784210e048426f18a486d5602652626d97574d` 그대로**, 실 직원 DB·지문/근태 기록 조회·변경, 실제 RPC/SQL/배포 **0**.
- **다음 3-8-39:** local epoch key 만료·prune 정책, 실패한 rollback 자체도 거절되는 private-mode/quota 조합, old/new 실 브라우저 탭/Web Locks, clock skew, Realtime 느린 catch-up/새 signal 세대 및 초기 복원 경합. 실제 다중기기·Chrome·Android/iOS·QA Supabase 인증 연동 모두 별도 격리 QA 환경 필요.
- 연결 안정성·채팅 길이 최우선. 사용자는 짧게 보고하고 상세 GitHub에 기록. ZIP 불필요. 운영 `main`·직원 DB 절대 무수정.
