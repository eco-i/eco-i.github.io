# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 252 완료

- 마지막 유효 완료 **2-8-252**, 다음 시작 **2-8-253**, 누적 독립 제품 결함 **536종** (252 신규 1종).
- GitHub `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`, 운영 `main`. `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변.
- SQL/실배포/APP_VERSION 변경 없음. APP_VERSION 및 `version.json` **ver20260927-0944**.
- QA `index.html` / `qa-handoff/index.working-2-8-252.html` / 다음 불변 `qa-handoff/index.before-2-8-253.html` SHA-256 `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`, **1,174,027 bytes**, Git blob `f530e495859f46f0eaa669acdbc8e7a3f6907bdf`.
- 이전 불변 기준 `qa-handoff/index.before-2-8-252.html` SHA-256 `90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e`, **1,173,752 bytes**, Git blob `db7b1904ad620ac7fc630ff4c13ac57487983227`.
- 신규 독립 제품 결함 **1종**: 네이티브 확인창 이후 다른 탭 로그아웃 반영이 지연되어 철회된 토큰의 보호 RPC 전송 가능. 11개 직접 `confirm()` 호출 직후 `markNativeDialogReturn()` 추가. 기존 pre/post guard 유지.
- 실제 Chrome RED [#38558453478](https://github.com/eco-i/eco-i.github.io/actions/runs/38558453478) **10 PASS/2 FAIL**, GREEN [#38558725521](https://github.com/eco-i/eco-i.github.io/actions/runs/38558725521) **12/0**, 모바일 [#38559156586](https://github.com/eco-i/eco-i.github.io/actions/runs/38559156586) **12/0**, 18컨텍스트 스트레스 [#38559348314](https://github.com/eco-i/eco-i.github.io/actions/runs/38559348314) **72/0**.
- 동일 최종 SHA 전체 깊이8 Chromium **214 PASS/0 FAIL ×3**: [#38558897297](https://github.com/eco-i/eco-i.github.io/actions/runs/38558897297), [#38559179238](https://github.com/eco-i/eco-i.github.io/actions/runs/38559179238), [#38559178870](https://github.com/eco-i/eco-i.github.io/actions/runs/38559178870).
- PC/모바일 세션 648 상태 검사 [#38559555387](https://github.com/eco-i/eco-i.github.io/actions/runs/38559555387) PASS; HTML 해시·바이트·인라인JS2·DOM457·11hunk/22 changed lines·pre/post 가드·3파일 바이트 일치 [#38559795074](https://github.com/eco-i/eco-i.github.io/actions/runs/38559795074) PASS.
- 하네스 SHA/바이트 기대값 미갱신에 따른 중간 실패는 제품 결함에서 제외. 공식 실제 20분 이상 검수 **2026-10-14 20:35경~20:56 KST**. 중간보고 20:43, 20:47, 20:52 KST.
- 실 Chrome headless 데스크톱·모바일 에뮬레이션/공유 origin 두 탭/Web Locks; 네트워크 RPC stub. 운영 Supabase/RLS/인증 다중사용자, 물리 Android 카메라/피커, iOS Safari, persisted BFCache, 운영 백업/복원 미검증.
- 공식 기록 `qa-handoff/QA_2-8-252_REPORT.md`, `QA_252_EVIDENCE_AUDIT.json`, `QA_2-8-252_SHA_MANIFEST.json`, `START_2-8-253_AFTER_252.txt` 참고.

## 필수 검수 규칙

- **다음은 2-8-253**. 이전 메시지보다 GitHub `qa-handoff/CURRENT_STATE.json`과 최신 보고서를 우선하여 마지막 유효 완료 다음 번호만 순서대로 진행.
- **High 수준·깊이8 고정**, 블록별 **최소 20분 실제 심층검수**. 검수 범위, 반복 테스트 수, 정확성을 줄이지 않음.
- 20분 이내 **KST 시각이 표시된 중간보고**, 제품 오류 즉시 수정+실 Chromium RED→GREEN→독립 전체 회귀 및 SHA 증거 검증. 하네스 오류와 제품 결함 구분.
- main·SQL·APP_VERSION·운영 실배포 임의 변경 금지, ZIP 다운로드/제안 금지.

## 새 채팅방 길이·토큰 절약 규칙

- **소스·로그 1MB 원문·거대한 JSON·코드 diff·Actions 전체 로그는 GitHub에서 처리**. 대화에는 블록/신규·누적 결함/최종 SHA/테스트 건수·결과/워크플로 링크 및 KST 시각만 간결하게 출력.
- GitHub 도구 호출 안에서 큰 원문을 받아 처리하되 출력 크기만 억제. 반복 재조회와 불필요한 전체 출력 방지. 검증 독립성과 필수 3회 반복·깊이·실제 20분은 유지.
- 공식 보고서·증거·SHA 목록을 GitHub에 기록하고 후속 채팅은 `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `index.before-2-8-253.html`부터 확인.
- ChatGPT 채팅 길이 한도 자체를 없애거나 길이 경고가 재발하지 않는다고 보장하는 규칙은 아님.
