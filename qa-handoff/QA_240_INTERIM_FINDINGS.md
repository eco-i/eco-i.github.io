# 근무모아 2차·깊이 8단계 — 2-8-240 검수 중간 기록

**상태: 240 진행 중, 공식 완료 불가/미기록.** 마지막 공식 완료 2-8-239, 다음 작업 2-8-240, 공식 누적 제품 결함 515종 유지.

## 공식 시작 무결성
- 저장소 `eco-i/eco-i.github.io`, QA `qa-2-8`, 운영 `main` 절대 변경/배포 안 함.
- 시작본 `qa-handoff/index.before-2-8-240.html`: SHA-256 `afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5`, 1,164,059 bytes.
- 현재 수정 후보 QA `index.html` 및 `qa-handoff/index.working-2-8-240.html`: SHA-256 `53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34`, 1,164,815 bytes, 두 파일 일치.
- APP_VERSION `ver20260927-0944`; SQL·운영 main·배포 변경 없음.
- 실제 Chromium 검수 첫 액션 CI 2026-10-12 15:41 KST. 각 블록의 20분 이상 실제 검수는 종료 전 판단하고 이 시간을 단순 경과로 대체하지 않는다.

## 이번 240 신규 제품 결함 (현재 1종)
- **정확한 로그아웃 토큰 tombstone이 존재해도, 이미 열린 문서의 관리자 unlock, sessionContextCurrent, fingerprintCurrentSharedSessionMismatch, fingerprintBlockingPromptSessionSnapshot 및 사전 RPC guard에서 이를 무시해 오래된 토큰의 지문변경/민감 export 요청이 차단되지 않음.**
- 실제 Chromium red [38214017941](https://github.com/eco-i/eco-i.github.io/actions/runs/38214017941): `revoked=true, current=A, local=A, mismatch=false, sharedMismatch=false, mode=shared, mutationBlocked=false, exportBlocked=false`. 공유 SESSION_KEY 변화 또는 storage-event delivery 전에도 직접 RPC를 막아야 한다.
- 6곳 최소한의 소스 수정: 관리자 unlock에 tombstone 확인, fingerprint snapshot/mismatch에 tombstone 확인, shared session mismatch에 tombstone 확인, remote per-token/aggregate `storage` 이벤트에서 해당 세션 즉시 종료, `sessionContextCurrent`에서 tombstone 배제.
- `qa-handoff/QA_240_PATCH.cjs` 6개 원본 문자열 수정만 적용한 결과, 공식 239 완료본 전체 HTML과 현재 제품 수정본이 정확히 동일해져 비관련 소스 변경 없음.
- 제품 결함 중복 추가 산정 없음. 初회 cross-tab fixture에서 브라우저 자동 정리가 발생한 뒤 이미 비어 있는 state를 보고 ownership mismatch를 기대한 하네스 문제는 제품 결함으로 세지 않았다.

## 실제 브라우저 회귀
- [38214283455](https://github.com/eco-i/eco-i.github.io/actions/runs/38214283455): 171 PASS / 0 FAIL.
- [38214421237](https://github.com/eco-i/eco-i.github.io/actions/runs/38214421237): 174 PASS / 0 FAIL, 다른 PC 탭의 정상 계정 B 보존/2차 관리자 인증 정상, 폐기된 A는 관리자 unlock 금지.
- [38214548855](https://github.com/eco-i/eco-i.github.io/actions/runs/38214548855): 176 PASS / 0 FAIL, A의 늦은 로그아웃이 새로운 공유 B·관리자 unlock B를 제거하지 않음.
- [38214711551](https://github.com/eco-i/eco-i.github.io/actions/runs/38214711551): 178 PASS / 0 FAIL, **실제 4탭 중 세 모바일 관리자 탭에 exact-token logout event 도달, 세 화면 모두 폐기**, 이전 8단계 종합회귀 통과.
- 기존 2,920건 4조 근무표·대정비, 500건 연차 fuzz, 업무/인사·지문사진 변환, 2/4탭 Web Locks, 72종 저장소 우선순위, 실제 직원 로컬 인증 10월 31일 달력, 320~1440px 7개 폭, 브라우저 뒤로가기 PIN도 기존 suite에 포함.
- 운영 **실 Supabase RLS/실 인증 서버/실 Android 카메라·내 파일/실 iOS Safari/BFCache persisted/실 DB 백업복원 검증 안 함**. 로컬 HTTP 원본과 모의 RPC/모바일 기기 흉내를 사용한 Chromium 범위만 PASS.

## 다음 절차
- 제품 후보 SHA 동일 상태에서 추가 독립 재검/깊이8 확인.
- 종료 블록의 실제 QA 최소 20분 충족한 뒤에만 공식 결함 515→516, 240 완료→241 시작본 인계.
- ZIP 불필요. GitHub QA 브랜치 공식 상태 파일과 보고/무결성 문서만 업데이트.
