# 근무모아 3차·깊이8 공식 인수인계

- **3-8-34 공식 완료: 신규 MEDIUM 결함 1종 발견·QA 수정, 유효 격리·정적 검사 131/131 PASS. 다음 3-8-35.** 3차 누적 **26종**(2차 별도 540종). CLEAN 아님.
- GitHub `eco-i/eco-i.github.io` 검수 `qa-3-8`, 운영 `main`. 다음 채팅에서 `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-34_REPORT.md` 직접 확인.
- **3-8-34-001 MEDIUM:** 오래된 로그아웃 aggregate를 token별 키로 이관할 때 localStorage 쓰기가 실패해도 aggregate를 삭제하는 문제. 원본 코드에서 유효 OLD 로그아웃이 false가 되는 실패 재현. 모든 기록의 이관이 성공할 때만 원본 삭제, 실패 시 동일 token의 레거시 표식을 조회하도록 `index.html` 2개 함수 최소 수정.
- 이슈 `qa-round3/issues/3-8-34-001_LEGACY_LOGOUT_TOMBSTONE_MIGRATION_LOSS.md`; 완료 보고서 `qa-round3/QA_3-8-34_REPORT.md`.
- QA HTML 최종 blob **`c754f9ff2be9e82768b550eb7ea3852f9b82d687`**, 코드 커밋 **`47b6bb57dc042e5eed254bf02de5c62852683939`**. 이전 blob `d55a32fcbcad3110db76c8725b4b088fca7362d1`. APP_VERSION **`ver20261018-2313` 그대로**. 3-8-30~33 보안/인계 수정 유지.
- **131 PASS 세부:** migration+handoff actual source fixture 78 + `restoreUpdateSessionHandoff` 12 + `scheduleRealtimeReconnect` 16 + 최종 JS 구문/HTML ID/기존 가드 정적 25. 실행은 JS 함수 추출 + 가짜 storage/타이머/DOM/비동기 Promise에 한정. 실제 Chromium 전체 로그인·physical Android/iOS·Supabase/멀티탭 Web Locks E2E 아님.
- 운영 `main` HEAD **`6c784210e048426f18a486d5602652626d97574d` 유지**, 실제 직원 DB/Supabase RPC/SQL/지문기록 조회·변경 및 운영 배포 **0**.
- **다음 3-8-35:** 같은 token 새 로그인·구버전 aggregate 동시쓰기, storage 완전 실패 시 안전한 복구, 새 업데이트 handoff 세대 소유권, Realtime SUBSCRIBED 후 catch-up 완료 레이스. QA 전용으로 수행.
- 연결·응답 안정성 우선, 사용자 보고 극도로 짧게, 상세 기록 GitHub 저장, ZIP 불필요.
