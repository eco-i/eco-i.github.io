# 근무모아 3차·깊이8 공식 인수인계

- **3-8-30 공식 완료: HIGH 결함 1종 발견·QA 코드 수정·격리 회귀 102/102 PASS. 다음 3-8-31.** 3차 신규 누적 **19종**(2차 역사적 540종 별도).
- GitHub `eco-i/eco-i.github.io`; QA 브랜치 `qa-3-8`; 운영 `main`. 새 채팅에서 `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `qa-round3/QA_3-8-30_REPORT.md` 순서로 직접 읽을 것.
- **제품 결함 `3-8-30-001` HIGH:** `restoreSession()`의 관리자 unlock 비동기 대기 직후 current token/epoch 재검사가 없어 오래된 직원의 앱 진입/초기 PIN 게이트 실행 가능. 실제 원본 함수 격리에서 이전 계정이 잠금대기 중 새 로그인으로 바뀌는 **9가지 경합 재현**. 별도 이슈 `qa-round3/issues/3-8-30-001_RESTORE_UNLOCK_STALE_SESSION_ENTRY.md`.
- QA `index.html` blob `8645c90182b9160951dde13e7249ca92dc43e373` (이전 `d3e535031861bfdd372fc0b8d1f24ef6070cccdf`): 로컬/서버 restore 양쪽 `ensureAdminUnlockForRestoreWithScope` await 성공 직후 `if(!tokenStillCurrent())return;` 총 2곳 추가. **버전 `ver20261018-2313` 변경 없음.**
- 수정본 **102/102 유효 검사 PASS**: restore 함수 15 + PIN 변경 함수 26 + 모달 스택 20 + 정적/구문/diff 41. 이 수치는 실제 인증 서버/전체 앱 브라우저 검증이 아님.
- **운영 `main` 기준 SHA `6c784210e048426f18a486d5602652626d97574d` 보호**. 실제 직원 DB 읽기·쓰기, SQL 적용, 운영 배포 **0건**. GitHub QA 브랜치만 보고서/이슈/기준본 수정.
- 다음 **3-8-31:** 관리자 unlock 내부 토큰 저장/Browser Web Lock 경합, `enterApp` 부트스트랩 세션 소유권, PIN 팝업 지연 닫기/focus, 관리자 권한 복구 경계. 실서버·물리 모바일은 QA 전용 환경 없으므로 미검증 표시.
- 진행 보고 짧게, 연결 안정성 우선, 채팅 용량 최소화, ZIP 불요.
