# 근무모아 2차·깊이 8단계 종합검수 — 2-8-241 공식 완료 보고서

**판정:** High·깊이8 고정, 실제 headless Chromium에서 제품 보안 결함 1종을 재현하여 QA 브랜치의 단일 소스 위치 수정 후 검증. 최종 동일 HTML 후보에 대해 전체 회귀 194 PASS / 0 FAIL **2회 연속**. 제품·검수 환경·실제 운영 미검증을 구분한다.

## 1. 공식 연속성/범위
- 직전 공식 완료 **2-8-240**, 이번 완료 **2-8-241**, 다음 시작 **2-8-242**. 공식 누적 제품 결함 **516 → 517종**. 신규 실제 제품 결함 **1종**.
- 불변 시작본 `qa-handoff/index.before-2-8-241.html` SHA-256 `53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34`, **1,164,815 bytes**.
- 최종 `qa-handoff/index.working-2-8-241.html`, QA `index.html`, 다음 `qa-handoff/index.before-2-8-242.html`: SHA-256 `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`, **1,165,130 bytes**.
- APP_VERSION `ver20260927-0944` 유지, SQL 변경 없음, 운영 `main` 및 실제 배포 변경 없음.
- 실 QA 시작 2026-10-12 19:25:29 KST. 공식 완료 시각은 아래 manifest의 `completed_kst`에 기록. 20분 이상 실제 GitHub 조사·재현·수정·Chrome 회귀·다중 탭/저장 실패 경계·독립 소스 대조·인계 작업 기록이 있으며, 단순 시간 경과를 검수 범위의 증명으로 사용하지 않는다.

## 2. 신규 제품 결함 — 수신 누락된 공유 로그아웃 suppression 마커를 살아 있는 탭 권한 검사가 무시
- 조건: 모바일 Web Locks 미지원/스와이프 백그라운드 등에서 다른 탭의 로그인 토큰 A 로그아웃 마커 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY=A`가 남았으나, 공유 localStorage의 `SESSION_KEY=A`가 즉시 삭제되지 않고 이 탭은 StorageEvent를 수신하지 못함.
- 초기 로그인 복원 `storedSessionToken()`은 A를 거부함에도 기존 탭의 `adminUnlockMatches`, `sharedPersistentSessionMismatch`, `fingerprintCurrentSharedSessionMismatch`, `fingerprintBlockingPromptSessionSnapshot`, `sessionContextCurrent`가 A를 허용하여 사진 변경·민감 백업·일반 인증조회 RPC의 동기 사전 소유권 검사를 무력화함.
- [실 Chromium red 재현 #38236470791](https://github.com/eco-i/eco-i.github.io/actions/runs/38236470791): `stored='',shared=A,suppressed=A,activeAdmin=true,owner=false,sensitive=false,snapshot=shared,sessionContext=true,mutationDenied=false,backupDenied=false,readDenied=false`.
- **수정:** 기존 공통 `storedSessionTombstoned(token)` 보안 폐기 판정 초입에 **정확히 동일 토큰의 공유 로그아웃 suppression** 확인 추가. 기존 관리자 권한·세션 문맥·민감 RPC 선행 guard가 호출하는 공통 helper를 통해 모순 제거. 새 버전·SQL·사용자 UI/정책 변경 없음.
- 불변 240 HTML에 `qa-handoff/QA_241_PATCH.cjs`에서 지정한 **단 하나의 소스 치환** 적용 결과 완성본 전체가 GitHub 수정 HTML과 문자 단위까지 정확히 일치. 해당 보안 판정 외 소스 변경 없음.

## 3. 실제 Chromium 제품/정상 경로 근거
- 추가된 사건 판정: marker A가 있고 shared A가 남아도 기존 관리자 unlock false, owner mismatch true, 민감 guard mismatch true, RPC mutation/export/read 모두 사전 차단.
- 독립 **PC 탭 B**가 기존 shared A의 로그아웃 마커로 로그아웃되지 않음. 반대로 동일 **토큰 A**를 사용하는 기존 PC 영구/탭 세션은 폐기. 새 공유 로그인 **C**의 관리자 unlock·사진 사전조회/변경 문맥 유지.
- 실 모바일 **4탭** 가운데 기존 관리자 탭 3개가 marker StorageEvent를 실제로 수신, 3개 화면 모두 로그아웃/UI 폐기. A의 shared key 삭제가 실패해도 browser reload 후 관리자 재노출 차단. **navigator.locks 없음**까지 직접 재현.
- 고정 제품 SHA `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`로 수행한 최종 독립 전체회귀 [#38237417756](https://github.com/eco-i/eco-i.github.io/actions/runs/38237417756), [#38237595145](https://github.com/eco-i/eco-i.github.io/actions/runs/38237595145): 각각 **194 PASS / 0 FAIL**.

## 4. 8단계 회귀 유지
1. GitHub SHA·전체 HTML 바이트·JS 구문·중복 DOM ID·APP_VERSION.
2. 2026~27 4조 2교대 **2,920** 일·조 및 10/1~15 대정비 A/C/야간/주2·휴무.
3. 연차 **500**개 독립 구간 fuzz·11h/8h/0h·야간 익일·장기근속.
4. 계정/인사·관리자 PIN unlock·PC 독립/영구 로그인·모바일 공유·폐기 소유권.
5. 지문사진 변경·민감 백업 export·일반 인증 read RPC와 비동기/선행 가드.
6. 실제 Chromium 이미지 PNG→JPEG 압축·파일 서명·가짜 이미지 배제.
7. 실 Web Locks 2탭/4탭·스토리지 72 우선순위 조합·전체 clear·4탭 suppression fanout·navigator.locks 없음.
8. 2026년 10월 직원 달력 31일·320~1440px 7폭·뒤로가기 PIN 숨김·브라우저 복귀.

## 5. 결함 분류·미검증
- QA 수정 중 Synthetic new-session C 경로에서 비동기 앱 부팅이 검사 fixture의 `state.me`를 초기화하여 snapshot 'none'인 **검수 하네스 문제**를 수정하고 재검증. 제품 결함 추가 집계하지 않음.
- 운영 DB/Supabase RLS, 실제 사용자 인증 멀티유저 backend, 물리 Android 네이티브 camera/file picker, iOS Safari, BFCache persisted=true, 운영 백업·복원은 **이번 CI에서 직접 검증하지 않음**.

## 6. 다음 블록
- **2-8-242**. Github `qa-handoff/index.before-2-8-242.html` 사용, High·깊이8·블록당 최소20분 실제 검수, 결함 즉시 수정·회귀, 20분 이내 중간보고, 공식 번호 연속, 임의 버전·SQL·main·배포 변경 금지. ZIP 불필요.
