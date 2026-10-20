# 근무모아 3차·깊이8 공식 인수인계

- **3-8-35 공식 완료: 신규 MEDIUM 결함 1종 발견·QA 수정, 유효 격리·정적 검사 154/154 PASS. 다음 3-8-36.** 3차 누적 **27종**(2차 별도 540종). **CLEAN 아님.**
- GitHub: `eco-i/eco-i.github.io`. 검수 `qa-3-8`, 운영 `main`. 다음 대화 시작 시 `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-35_REPORT.md` 직접 조회.
- **3-8-35-001 MEDIUM:** 기존 레거시 로그아웃 aggregate가 다른 token의 migration 실패로 남은 상태에서 *같은 token*의 신규 로그인이 성공(true)을 반환하지만 바로 tombstone으로 차단되는 결함. 원본 PC 임시/PC 기억/모바일 세 경로 모두 격리 재현.
- QA fix: `clearUpdateHandoffLogoutTombstone`이 남은 legacy aggregate에서 **신규 로그인 token만 제거**하고 B 등 다른 token 차단은 보전. 실패 시 false를 반환. `storeLoginSession`의 세 경로는 표시 제거 실패를 로그인 성공으로 처리하지 않고 기존 저장 토큰을 가능한 복원. 실제 동시 탭 원자적 안전을 인증한 수정은 아님.
- 이슈 `qa-round3/issues/3-8-35-001_SAME_TOKEN_RELOGIN_LEGACY_TOMBSTONE.md`; 보고서 `qa-round3/QA_3-8-35_REPORT.md`.
- QA HTML 최종 blob **`4fd569795a1eafbdaf0918c4e0f2c4f0dfca3cbe`**, 코드 커밋 **`9eca7cef89362cc81fc052a82a1134c399340231`** (34 완료 blob `c754f9ff2be9e82768b550eb7ea3852f9b82d687`). APP_VERSION `ver20261018-2313` **그대로**, 3-8-30~34 이전 보안 수정/기능 보존.
- **154/154 PASS 내역:** 실제 로그인 저장함수+토큰별 logout migration/rollback mock **77** + `restoreUpdateSessionHandoff` mock **16** + Realtime `startRealtime` subscription/callback mock **20** + 전체 JS/HTML/기존 함수 정적 검사 **41**. 원본 결함 재현 실패는 PASS 미포함. 실제 전체 앱 Chromium·분리된 두 계정 Supabase/Realtime/Web Locks·Android/iOS PWA 미검증.
- 운영 `main` HEAD **`6c784210e048426f18a486d5602652626d97574d` 불변**, 실제 직원 DB/지문 기록 접근·쓰기, RPC/SQL/운영 배포 **0**.
- **다음 3-8-36:** 늦은 구버전 legacy aggregate writer가 같은 token의 신규 로그인 후 기록을 다시 쓰는 경합, rollback 실패 보호, tab update handoff 소유 세대, Realtime 새 채널/구 채널 늦은 응답·catch-up. 반드시 QA-only.
- 연결 끊김/무응답/채팅방 길이 최소화, 사용자 보고 간략히. GitHub 직접 읽고 수정. ZIP 요청 금지.
