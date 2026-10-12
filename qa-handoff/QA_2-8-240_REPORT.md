# 근무모아 2차·깊이 8단계 종합검수 — 2-8-240 공식 완료 보고서

**판정:** High·깊이8 유지. 브라우저에서 확인한 신규 제품 보안 결함 **1종**을 재현, QA 브랜치 소스 6곳에 한정하여 수정·회귀검사. 독립 고정 후보 실 Chromium 전체회귀 **180 PASS / 0 FAIL 2회 연속**.

## 공식 상태·변경 통제
- 공식 직전 완료 **2-8-239**, 이번 **2-8-240**, 다음 시작 **2-8-241**, 결함 누적 **515 → 516종**. 이번 신규 제품 결함 **1종**, 하네스 오류는 별도.
- 시작 불변 `qa-handoff/index.before-2-8-240.html`, SHA-256 `afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5`, 1,164,059 bytes.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-240.html`, 다음 `qa-handoff/index.before-2-8-241.html` SHA-256 `53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34`, 1,164,815 bytes.
- APP_VERSION `ver20260927-0944` 고정. SQL·운영 `main`·배포 변경 없음.
- 첫 검수 작업 CI 2026-10-12 15:41 KST부터 20분 이상 실제 소스 조사·red 재현·수정·Chrome 회귀·검증 범위 확장·독립 전체 바이트 대조·보고서 정리. 단순 경과시간과 실제 수행 항목은 구분 기록.

## 이번 제품 신규 결함 1종: tombstone 로그아웃 기록의 열린 문서 보안 검사 누락
- 초기 부팅 시 `storedSessionToken`은 토큰 A의 정확한 로그아웃 tombstone을 인식했으나, **이미 열린 탭**에서는 `fingerprintCurrentSharedSessionMismatch`, `fingerprintBlockingPromptSessionSnapshot`, `sharedPersistentSessionMismatch`, `sessionContextCurrent`, `adminUnlockMatches`가 같은 tombstone을 사용하지 않아 권한·RPC 경계가 느슨했음.
- [실제 Chromium red 38214017941](https://github.com/eco-i/eco-i.github.io/actions/runs/38214017941): `revoked=true,current=A,local=A,mismatch=false,sharedMismatch=false,mode=shared,mutationBlocked=false,exportBlocked=false`. 원격 브라우저 이벤트가 늦거나 공유 저장소 SESSION_KEY가 아직 그대로인 시점의 동기 guard 취약점.
- 수정: 기존 소유권·민감 RPC snapshot/guard·admin 2차 unlock에 정확한 토큰 tombstone 판정 추가. `sessionContextCurrent`도 폐기된 토큰의 비동기 작업 유효성을 거부. 다른 탭에서 생긴 per-token logout 키 및 이전 형식 aggregate logout 키의 storage 이벤트를 관찰하여 해당 세션의 관리자 화면 즉시 종료.
- 결과: 지문사진 변경, 민감 백업 export 및 세션 소유권 guard에 대해 이전 토큰 차단. 기존 관리자 unlock A 재사용 불가.
- **정상 경로 보호:** 다른 PC 탭의 유효 토큰 B와 독립 관리자 2차 unlock 유지, 늦은 A 로그아웃이 새 모바일 공유 B/관리자 unlock을 건드리지 않음, 모바일 4탭 테스트의 기존 관리자 3화면 전원 종료.

## 실제 Chromium 증거
- 첫 수정 후보 [38214283455](https://github.com/eco-i/eco-i.github.io/actions/runs/38214283455) **171 PASS / 0 FAIL**.
- 독립 PC 탭 관리자 검증 [38214421237](https://github.com/eco-i/eco-i.github.io/actions/runs/38214421237) **174 PASS / 0 FAIL**.
- 구 A 로그아웃과 신규 공유 B 경쟁 [38214548855](https://github.com/eco-i/eco-i.github.io/actions/runs/38214548855) **176 PASS / 0 FAIL**.
- **최종 동일 후보 SHA** [38215309353](https://github.com/eco-i/eco-i.github.io/actions/runs/38215309353) 및 [38215415673](https://github.com/eco-i/eco-i.github.io/actions/runs/38215415673): **각 180 PASS / 0 FAIL**. 세 모바일 관리자 탭 모두 실제 per-token logout storage 이벤트 수신 및 관리자 UI 폐기. 이전 aggregate-format logout storage 이벤트를 실제 모바일 기존 관리자 탭에서 수신한 뒤 즉시 폐기까지 추가 검증.
- 실제 baseline과 수정본 GitHub blob을 직접 대조하여 `qa-handoff/QA_240_PATCH.cjs`에 명시한 **6개 제한된 소스 치환을 정확히 적용한 결과 수정본 전체와 바이트 동일** 확인. 기타 제품 코드 변경 없음.

## 깊이 8단계 회귀
1. 시작/완료 SHA·바이트·JS 구문·중복 DOM ID·APP_VERSION.
2. 2026~2027 4조 2교대 2,920 독립 근무일·조, 2026-10-01~15 대정비·주2·휴무·C조 10/15 야간.
3. 500개 연차·분할/병합 interval fuzz, 11h/8h/0h·익일 야간·장기근속 5년.
4. 인사·관리자 unlock·PC 독립 탭/모바일 공유 로그인 및 개별 토큰 폐기.
5. 변경/민감/일반 인증 RPC 선행 fence, 늦은 로그아웃·새 로그인 경쟁, 저장 실패 주입.
6. 지문 사진/파일 검증, 실제 Chromium Canvas PNG→JPEG·JPEG signature.
7. 실 Web Locks 2탭/4탭·전체 localStorage clear·72개 토큰 우선순위·실 4탭 로그아웃 fanout.
8. 실 2026년 10월 직원 달력 31일·320~1440px 7폭·브라우저 뒤로가기 PIN 비노출·모바일 재진입.

## 범위·결함 구분
- 첫 cross-tab 비동기 재현에서 자동 로그아웃 완료로 `state.sessionToken` 자체가 비어 있는데도 ownership mismatch가 true이어야 한다고 판정한 것은 **검수 하네스의 잘못된 기대값**으로 분리. 동일 작업 턴에서 토큰 A가 실제로 남은 채 tombstone만 존재하도록 시나리오를 독립 재현하여 제품 결함 확인.
- 실제 Chromium은 로컬 HTTP·모바일 UA/뷰포트 및 모의 인증/RPC 기반. **실 운영 Supabase/RLS·실 서버 인증 멀티유저·물리 Android 카메라/내 파일·iOS Safari·confirmed BFCache persisted=true·운영 백업 복원은 미검증**, 검증했다고 주장하지 않는다.

## 다음 블록
- **2-8-241**, GitHub `qa-handoff/index.before-2-8-241.html`. High·깊이8·각 블록 최소20분 실제검수, 문제 발견 시 즉시 기술적 수정·관련 회귀, 중간 보고 20분 이내, 공식 번호 연속. APP_VERSION·SQL·운영 main·실배포 임의변경 금지, ZIP 요구 금지.
