# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-31 완료: 신규 2종(MEDIUM 1, LOW 1) QA 수정·격리 회귀 105/105 PASS. 다음 3-8-32.** 3차 누적 **21종**(2차 과거 540종 별도). 전체 앱 CLEAN 아님.
- 저장소 `eco-i/eco-i.github.io`; QA `qa-3-8`, 운영 `main`. 다음 채팅에서는 `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-31_REPORT.md` 직접 확인.
- **31-001 MEDIUM:** 관리자 unlock Web Lock 대기 이후 구 계정의 인증정리 콜백이 새 로그인 탭의 관리자 표시를 지울 수 있음. `ensureAdminUnlockForRestoreWithScope`의 lock callback 내부까지 token/epoch 및 storage mismatch 소유권 검사 추가.
- **31-002 LOW:** `openSelfPin` 50ms/`enterInitialPinGate` 40ms 자체 초점 타이머가 상단 모달을 무시하고 숨겨진 PIN 창으로 포커스 탈취. 상단 확인, 수동 PIN 입력 필드 포커스 보존, 최초 PIN 입력/변경 버튼 자동 포커스 유지.
- 기존 **3-8-30-001** `restoreSession` 2개 가드 그대로 유지. QA 최신 `index.html` blob **`a6cc643cc1c7a39c0afdfa8b1790e116d324ff03`**, APP_VERSION **ver20261018-2313 유지**.
- 실 검증 범위: 관리자 unlock·스토리지 모의 8, `restoreSession` 15, `enterApp` 14, PIN 포커스 18, 정적/구문/무결성 50 = **105/105 PASS**. 원본 결함 재현과 fixture 보정 실패는 집계 제외.
- 운영 `main` 기준 HEAD `6c784210e048426f18a486d5602652626d97574d` 무변경. 실제 직원/근태 DB 읽기·쓰기, SQL 적용, 운영 배포 **0건**. 실제 앱 Chromium 로그인 E2E, Web Locks 브라우저/2계정, Android/iOS/TalkBack/VoiceOver는 별도 격리 QA 환경 필요.
- **다음 3-8-32:** 관리자 표식 삭제 다른 호출 경로, 같은 토큰 재로그인/로그아웃 tombstone, PIN/Realtime/모달 전환 추가 격리 검수.
- 짧은 사용자 보고·채팅 용량 절약·연결 안정성·QA 전용 GitHub 파일 기록·ZIP 불요.
