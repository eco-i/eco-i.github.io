# 근무모아 2차·깊이 8단계 종합검수 — 2-8-237 공식 완료

**판정:** 제품 결함 2종 실제 Chromium 재현·QA 브랜치 제품 수정·최종 연속 2회 회귀검사 PASS. 본 판정은 로컬 HTTP 기반 실제 headless Chromium과 실행 가능한 정적 검사의 범위에 한한다. 실 운영 Supabase/RLS, 실 Android 카메라/picker, 실 인증 서버, iOS, BFCache persisted=true는 포함하지 않는다.

## 1. 공식 연결·무결성
- 직전 완료 **2-8-236**, 이번 **2-8-237**, 다음 **2-8-238**. 연속 번호 유지.
- 공식 누적 제품 결함 **508 → 510종**, 이번 신규 제품 결함 **2종**(각각 고유 결함 계열).
- 237 시작본 `qa-handoff/index.before-2-8-237.html` SHA-256 `5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a`, **1,161,068 bytes**. 최종 `qa-handoff/index.working-2-8-237.html`, QA `index.html`, 238 시작본 SHA-256 `f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f`, **1,161,672 bytes**.
- `APP_VERSION=ver20260927-0944` 고정. SQL 변경 없음, 운영 `main` 수정·배포 없음.
- 공식 첫 237 CI 실행 기록 **2026-10-11 22:22:27 KST**, 고정본 최종 검증 및 인계 판단 **2026-10-11 22:46:22 KST**, 관찰 가능한 전체 QA 활동 구간 **23분 55초**. 이 구간에 재현·코드 수정·CI 반복실행·검증 로그 분석·테스트 환경 오류 구분이 기록되어 있다. 경과 시간만으로 순수 작업 시간을 산술적으로 증명하지는 않는다.

## 2. 신규 제품 결함과 수정
### 결함 1 — 다른 탭 localStorage.clear() 이후 공유 관리자 화면 잔류
- 원인: StorageEvent `key===null`(전체 clear)를 SESSION_KEY의 단일 키 변경과 별개로 처리하지 않아, 공유 토큰이 제거되었어도 기존 탭의 `state.me.is_admin`과 앱 화면이 남음.
- [실제 Chromium 재현 CI #38143116564](https://github.com/eco-i/eco-i.github.io/actions/runs/38143116564): `clearEvent=true`, `sharedToken=null`, `oldAdminVisible=true`.
- 수정: `handleSharedSessionStorageChange`에서 `key===null` 감지 시 현재 **공유 세션 소유권이 없어진 탭에만** 동기 로그아웃을 시작하고 관리자 UI를 폐기. PC의 독립 `sessionStorage` 전용 로그인은 유지.
- 회귀: 다른 탭이 전체 clear → 옛 공유 관리자 화면 폐기, PC 독립 세션 유지, 모바일 레거시 중복 토큰을 가진 탭도 관리자 화면 폐기. 확인된 Chrome 실행 결과 `oldAdminVisible=false`.

### 결함 2 — 모바일 레거시 sessionStorage 잔재로 공유 로그아웃 알림 무시
- 원인: `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY` storage 이벤트 처리에서 `sessionStorage`에 같은 token이 있으면 독립 PC 세션이라고 판단하여, **모바일** 레거시 탭도 잘못 제외됨.
- [실제 Chromium 재현 CI #38143572051](https://github.com/eco-i/eco-i.github.io/actions/runs/38143572051): `markerReceived=true`, `isMobile=true`, 관리자 `visible=true`.
- 수정: 공유 로그아웃 표식 수신 시 모바일은 sessionStorage 레거시 잔재에 관계없이 **일치하는 토큰**의 민감 UI를 종료. PC 탭 전용 로그인은 원래대로 면제.
- 회귀: 모바일 레거시 탭 관리자 화면 폐기 및 오래된 토큰 제거; 독립 PC sessionStorage 계정은 유지. 실제 Chromium 4탭에서 이전 토큰 계정의 권한화면 3개 종료, 서로 다른 최신 토큰의 계정 화면 정상 보존.

## 3. 깊이 8단계·회귀
1. **문서·구문·SHA:** HTML inline JS 파싱, DOM 중복 ID, 정적 플래그, QA 기준 SHA, 완료 SHA.
2. **4조·대정비:** 2026~2027 4조 2,920 근무일/조 비교, 10/1~15 주2·주말휴·C조 10/15 야간.
3. **연차·장기재직:** 500집합 구간 fuzz, 11h/8h/0h, 야간 자정 넘김, 5년 기념일.
4. **인사·계정·관리자:** 인사 정렬, 로그인 지속범위, 관리자 unlock, 임시·영구 로그인, 레거시 이관.
5. **RPC 계약·복원/장애:** timestamp·지문 응답 엄격 검증, localStorage 저장/삭제 실패 주입, 복구 구별.
6. **지문사진:** Chromium Canvas PNG→JPEG·서명·파일명 이모지, 비이미지 거부.
7. **동시성·보안:** 실제 Web Locks 2탭 150건·4탭 400건, 지연 로그인/로그아웃 경쟁, 모바일 no-WebLocks, sibling storage marker, 새로 추가한 전체 clear 및 4탭 fanout.
8. **UI·수명:** 320/360/390/430/768/1024/1440 폭 스크롤, 로그인/logout UI 즉시 차단, 뒤로가기 PIN 삭제. 실제 BFCache `persisted=true`는 확인되지 않음.

## 4. 실패 CI·테스트 하네스·운영 미검증의 구분
- 기존 결함 재현에 사용된 실패 CI는 **제품 결함**으로 반영(각 1종).
- `ERR_ABORTED`(테스트 중 자체 네비게이션 충돌), navigation에 의해 사라지는 일회성 이벤트 관찰 플래그, 새 로그인 토큰을 저장하지 않은 4탭 모의 fixture 및 재인증 중의 빈 UI를 '옛 토큰 유지'로 과판정한 조건은 **테스트/환경 문제**로 분리하여 하네스 수정 후 재검. 제품 결함으로 추가 산정하지 않음.
- 최종 고정 SHA의 독립적 실제 headless Chromium CI **2회 연속**, [#38144386221](https://github.com/eco-i/eco-i.github.io/actions/runs/38144386221), [#38144472284](https://github.com/eco-i/eco-i.github.io/actions/runs/38144472284): **각 116 PASS / 0 FAIL**, `f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f`, **1,161,672 bytes**.
- 운영 실제 DB/Supabase RLS, 실 인증 멀티유저, Android 기기 카메라/파일 선택, iOS Safari, BFCache persisted=true, 실백업 복원은 이번 검수에서 실행하지 않음. 서버 logout은 테스트 모의 RPC임.

## 5. 다음 블록
- **2-8-238**을 GitHub QA 브랜치 `qa-handoff/index.before-2-8-238.html`에서 시작.
- High·깊이8·최소20분 실제 검수·결함 즉시 수정/회귀·번호 연속. APP_VERSION/SQL/main/운영 배포 임의변경 금지. ZIP 불필요.
