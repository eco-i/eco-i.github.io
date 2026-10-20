# 근무모아 3차·깊이8 공식 인수인계

- **3-8-37 공식 완료: MEDIUM 신규 결함 1종 발견·QA 수정, 최종 실제 소스 격리·정적 검사 291/291 PASS. 다음 3-8-38.** 3차 누적 **29종**(2차 별도 540종). CLEAN 아님.
- GitHub: `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. 새 채팅 첫 작업으로 `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-37_REPORT.md` 직접 확인.
- **3-8-37-001 MEDIUM:** 구버전 탭이 이전 legacy logout aggregate를 신버전 local preview(`local:<id>`)의 **동일 token 재로그인 성공 이후**에 재기록하면 현행 `storedSessionTombstoned` / `updateHandoffTokenWasLoggedOut`가 예전 logout을 새 로그아웃으로 오인하여 새 로그인/업데이트 인계를 차단함. 실제 원본 함수+가짜 공유 storage 순서로 재현. 실물 구버전 브라우저 탭 E2E 미검증.
- 수정: **로컬 미리보기 token에만** `UPDATE_SESSION_LOCAL_LOGIN_EPOCH_PREFIX` timestamp를 fresh login 성공 경로에서 기록·확인. 이 epoch 이전의 **legacy aggregate 항목에 한하여** 차단 제외. 같은 시각/이후 실제 logout, 신규 per-token logout key, shared suppression, 서버 발급 token은 계속 차단. 기기 시각이 5초 초과로 되돌아가면 epoch 필터 무효화해 fail-closed. epoch 저장 실패 시 로컬 fresh login도 실패.
- 이슈 `qa-round3/issues/3-8-37-001_OLD_LEGACY_LOGOUT_REPLAY_AFTER_LOCAL_RELOGIN.md`, 보고서 `qa-round3/QA_3-8-37_REPORT.md`.
- 최종 QA HTML blob **`084696ce5ef54748bcb0043a14504cbae10ebe26`**, 제품 코드 커밋 **`c4ad51bb9f9e9d193cbb3e9a61d6814b9b5f4a6d`**, 36 완료 이전 blob `86ff27b08a66f7e1853f3888a74a7d8ba0109471`. APP_VERSION `ver20261018-2313` 유지.
- **291/291 PASS 분류:** 마지막 clock safeguard가 반영된 최종 QA source의 local epoch/old writer actual JS mock **190** + `restoreUpdateSessionHandoff` actual function **40** + `startRealtime` 실제 함수/가짜 채널 **20** + 최종 JS parse/HTML ID/기존 가드 정적 **41**. 초기 중간 후보의 테스트 숫자 중복계산 금지. 실제 full-app Chromium·물리 Android/iOS·Supabase 원격 2계정/Web Locks E2E는 미검증.
- 운영 `main` HEAD **`6c784210e048426f18a486d5602652626d97574d` 불변**, 실 직원 DB·근태/지문 기록 조회·변경, 실제 RPC/SQL 및 운영 배포 **0**.
- **다음 3-8-38:** local login epoch 저장 실패/rollback 및 정리 정책, 급격한 시계 보정/초기 bootstrap 선언 순서, Realtime catch-up 완료 후 더 최신 signal 반영, 다중 탭 경합을 QA-only로 계속. old writer 실제 동시 탭 순서는 여전히 물리 브라우저 미검증.
- 연결 끊김/무응답/채팅방 길이 최소화. 사용자 답변 극도로 짧게, 상세는 GitHub 기록. ZIP 불필요, main/직원 DB 절대 무수정.
