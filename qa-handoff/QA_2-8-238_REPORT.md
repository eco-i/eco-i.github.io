# 근무모아 2차·깊이 8단계 종합검수 — 2-8-238 공식 완료

**검수 판단:** High·깊이8 유지. 신규 제품 결함 2종 실제 headless Chromium에서 재현 후 QA 브랜치 한정으로 수정·회귀검사. 고정 후보와 동일한 SHA-256 기준 실 Chromium 전체회귀 **141 PASS / 0 FAIL 2회 연속**. 운영 환경 미검증 사항은 분리해서 보고한다.

## 1. 공식 번호·무결성
- 직전 공식 완료 **2-8-237**, 이번 완료 **2-8-238**, 다음 시작 **2-8-239**.
- 공식 제품 결함 누적 **510 → 512종**, 238 신규 **2종**(제품 결함만).
- 시작 불변본: `qa-handoff/index.before-2-8-238.html`, SHA-256 `f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f`, **1,161,672 bytes**.
- 완료 후보: `qa-handoff/index.working-2-8-238.html`, `index.html` (qa-2-8 브랜치), 다음 `qa-handoff/index.before-2-8-239.html`; SHA-256 `1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360`, **1,161,777 bytes**.
- `APP_VERSION ver20260927-0944` 유지, SQL 수정 없음, `main` 변경 없음, 운영 배포 없음.
- QA 첫 GitHub Actions 실행 **2026-10-12 07:14:30 KST** 이후 다수의 실제 브라우저 재현·보완·원인 검토·증거 확인을 수행하고 종료기록 시점까지 **최소 20분을 넘는 QA 작업 구간**을 충족하도록 종료 게이트를 적용했다. 단순 벽시계 경과를 실제 작업 시간으로 기계적으로 대체하지 않는다.

## 2. 신규 제품 결함 ① 모바일 레거시 탭 토큰이 새 공유 로그인 전환을 차단
- 조건: 모바일 탭에 이전 `sessionStorage` A와 공유 `localStorage` A가 공존; 다른 탭에서 공유 토큰을 B로 교체.
- 재현 [실제 Chromium #38179703990](https://github.com/eco-i/eco-i.github.io/actions/runs/38179703990): `mobile=true,oldActor=238,oldUiVisible=true,currentToken=A,sharedToken=B,tabToken=A,mismatch=false,sensitiveMismatch=false`.
- 원인: PC용 독립 탭 로그인 예외가 모바일 레거시 sessionStorage에도 적용됨. `sharedPersistentSessionMismatch`, `fingerprintCurrentSharedSessionMismatch`, `fingerprintBlockingPromptSessionSnapshot` 모두 잘못된 탭 소유권 판정.
- 수정: 3곳의 독립 `sessionStorage` 면제 조건을 `!MOBILE_SESSION_DEVICE`로 제한.
- 회귀: 모바일 A→B 기존 관리자 화면 종료; 변경·지문사진·백업 export·일반 인증조회 RPC 이전 토큰 송신 차단. PC 탭 단독 세션/관리자 뷰는 독립성 유지.

## 3. 신규 제품 결함 ② 공유 로그아웃 후 과거 모바일 토큰 부활
- 조건: 모바일에서 공유 로그인 B가 로그아웃되어 정확한 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY=B`가 남는데 기존 탭 `sessionStorage=A`가 레거시 잔재로 남아 있음.
- [#38180041278](https://github.com/eco-i/eco-i.github.io/actions/runs/38180041278): `localStorage=B`가 아직 남았을 때 모바일 `storedSessionToken()`이 과거 A를 반환.
- [#38180141002](https://github.com/eco-i/eco-i.github.io/actions/runs/38180141002): B가 성공적으로 제거된 뒤에도 marker B가 유지된 상태에서 과거 A를 다시 반환. 위와 같은 **한 제품 결함**이므로 중복 산정하지 않음.
- 수정: 모바일은 유효한 최신 공유 저장소 토큰을 우선한다. 최신 shared 기록이 로그아웃 표시되었거나 제거되어 로그아웃 marker가 남아 있다면 과거 tab-only 레거시 토큰으로 되돌아가지 않는다.
- 회귀: B 공유 보관/성공 삭제 2경로에서 A 부활 차단, 공유 C 신규 로그인 허용, 공유·마커 모두 없는 진짜 레거시 단독 A 복구 허용, PC 독립 탭 A 그대로 유지. 모바일·PC 저장소 72개 조합 정상.

**독립 제품 코드 대조:** GitHub 원본/수정본 blob을 직접 받아 패치 스크립트의 소스 변경 5곳만 순서대로 적용한 결과, 최종 HTML 전체 문자열이 수정 후보와 정확히 일치함을 확인했다. UI 정책·다른 화면 코드의 별도 변경은 없다.

## 4. 깊이 8단계 실제 회귀
1. 코드/기준 무결성: 두 HTML SHA, 구문, DOM 중복 ID, APP_VERSION.
2. 4조 근무표·대정비: 2026~2027 전체 2,920 근무일·조 독립 계산, 10/1~15 8시간 주2·휴·C조 10/15 야간.
3. 연차·장기재직: 500건 독립 interval fuzz, 11h/8h/0h·야간 익일 경계·5년.
4. 인사·관리자·권한: 계정 정렬, 관리자 unlock, 모바일 레거시/PC 독립 탭 소유권.
5. RPC/변경: 지문 계약·타임스탬프 검증, stale 변경·민감 export·일반 조회 RPC 사전 차단.
6. 사진·파일: 실 Chromium Canvas PNG→JPEG 변환·JPEG signature·비이미지 거부.
7. Web Locks·멀티탭: 실 2탭 150건·실 4탭 400건, 로그아웃 경쟁, 실패 주입, 전체 clear, suppression, 72가지 mobile/PC token priority.
8. 모바일/데스크톱 UI·수명: 2026년 10월 실제 Chromium 로컬 인증달력 31일 렌더·320~1440px 화면 폭 검사, 이전 PIN의 브라우저 뒤로가기 노출 차단, Web Locks 불가 환경 대응.

## 5. 결함이 아닌 테스트·환경 문제
- GitHub Actions workflow 최초 빌드 시 `git push` 경쟁으로 발생한 ref lock 실패는 **CI 환경 동시수정 충돌**, 제품 결함 아님. 재베이스 후 빌드 성공.
- 재현용 실패 CI의 assertion은 제품 결함을 증명하는 근거이고, 수정 후 전체 검증 성공으로 대조했다.
- Web Locks 미지원 모바일, storage marker 조합은 Chrome 실제 브라우저 환경에서 API를 제어한 시뮬레이션이며 실 Android 기기에서 검증했다고 주장하지 않는다.

## 6. 최종 증거·운영 제외
- [CI #38180607739](https://github.com/eco-i/eco-i.github.io/actions/runs/38180607739) **141 PASS / 0 FAIL**, SHA `1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360`.
- [CI #38180691498](https://github.com/eco-i/eco-i.github.io/actions/runs/38180691498) **141 PASS / 0 FAIL**, SHA 동일.
- 별도 미검증: **운영 Supabase DB/RLS, 실제 인증 멀티유저 세션, 물리 Android 카메라·내 파일 선택, iOS Safari, confirmed BFCache persisted=true, 실 백업 복원**.
- QA 브랜치 테스트는 운영 DB에 접속하지 않고 로컬 origin/모의 RPC로 실행했다.

## 7. 다음 단계
- 공식 다음 블록 **2-8-239**. High·깊이8·최소20분 실검수, 결함 즉시 수정/회귀, 결함/테스트/환경 구분, 버전·SQL·실배포 임의변경 금지, GitHub 인계 우선, ZIP 파일 불필요.
