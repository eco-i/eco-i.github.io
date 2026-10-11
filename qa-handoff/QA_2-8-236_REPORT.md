# 근무모아 2차·깊이 8단계 종합검수 — 2-8-236 공식 완료

**판정: 신규 제품 결함 2종 재현·수정·관련 회귀검사 PASS (실제 headless Chromium 및 실행 가능한 정적 검사 범위).** 서버 DB/RLS·물리 Android/PWA 카메라/파일선택·실제 운영 계정 및 BFCache persisted 실행은 이번 완료 판정에 포함하지 않는다.

## 1. 연속성·실제 검수 시간·무결성
- 이전 마지막 유효 완료 **2-8-235**, 이번 완료 **2-8-236**, 다음 **2-8-237**. 블록 건너뛰기 없음.
- GitHub qa-2-8 공식 시작본 검증 시작 **2026-10-11 19:43:23 KST**, 완료 판단 **2026-10-11 20:04:07 KST**. **최소 20분 44초** 동안 실제 GitHub 원본 분석·실 Chrome 테스트 작성/실행·재현·수정·반복회귀·파일 해시 및 브랜치 대조. 단순 비작업 대기 시간을 검사라고 주장하지 않음.
- 공식 누적 제품 결함 **506 → 508종**, 이번 **신규 2종**. 하네스 404/URL 오류는 제품 결함 제외.
- 시작 HTML SHA-256 `f67887f5427da8331eaa134fbaeec73493815ac52e4c1cbcbbcaec1e42dbc50e` (**1,158,706 bytes**), 최종/237 시작 SHA-256 `5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a` (**1,161,068 bytes**). `APP_VERSION=ver20260927-0944` 고정. SQL·운영 main·운영 배포 변경 없음.

## 2. 제품 결함 2종 및 수정
### 결함 1 — 지연 Web Lock 때문에 로그아웃 후 관리자 화면이 보이는 문제
- 실제 Chromium 2탭 중 한 탭이 공유 Web Lock을 유지하는 동안 다른 탭의 `logout(false)` 호출.
- 수정 전: `state.sessionToken`만 즉시 지워지고 `state.me.is_admin=true`, 민감 앱 화면이 **잠금 대기 120ms 이상 그대로 유지**됨. [재현 CI #38133117909](https://github.com/eco-i/eco-i.github.io/actions/runs/38133117909).
- 원인: `await safelyClearStoredLoginSession(logoutToken)`가 관리자/직원 상태·UI 초기화 **이전**에 배치.
- 수정: 기존 로그아웃 token을 먼저 캡처한 후 공유 저장소 정리는 Promise로 시작만 하고, **역할·민감 입력·UI·각 기능 상태를 동기적으로 즉시 폐기**한다. 로컬 저장소 잠금을 기다리기 전에 old token의 서버 로그아웃 RPC도 독립 전송한다.
- 회귀: 다른 탭의 lock을 점유한 실제 Chromium에서 즉시 관리자 상태 null 및 app 화면 숨김/로그인 화면 표시, 이후 잠금 해제 뒤 정상 정리. 옛 로그아웃이 대기 중 새 로그인 상태를 지우지 않는지 확인. 서버 logout은 **모의 RPC**로 이전 token과 keepalive, 호출 횟수를 확인(운영 서버 호출 아님).

### 결함 2 — Web Locks 미지원 모바일 로그아웃의 토큰 부활·다른 탭 권한화면 잔류
- 모바일 Chrome UA 모의환경에서 Web Locks를 제거한 뒤 기존 shared token으로 `logout(false)` 호출.
- 수정 전: 민감 앱 화면은 닫히나 공유 `localStorage` token은 남고 `storedSessionToken()`은 그대로 이를 반환. 기존 logout tombstone조차 저장되지 않아 다음 접속에 **세션 부활 가능**. [재현 CI #38133356294](https://github.com/eco-i/eco-i.github.io/actions/runs/38133356294).
- 후속 두 모바일 탭 실제 storage-event 검수에서, token-specific 막음 표식만 변경될 때 다른 탭의 관리자가 **여전히 앱 화면을 보는** 현상 재현. [재현 CI #38133712966](https://github.com/eco-i/eco-i.github.io/actions/runs/38133712966).
- 두 현상은 동일한 미지원 Web Locks 로그아웃 공유상태 반영 결함 계열로 **1종만 산정**.
- 수정: old token과만 일치하는 영구 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY`을 동기 기록하여 현재 token의 재사용을 거부. 다른 token은 차단하지 않으며 **성공한 같은 token의 새 로그인은 마커를 해제**. 다른 탭에 suppression-marker storage event가 오면 같은 old token을 사용하는 공유 세션만 즉시 안전 로그아웃, PC의 탭 전용 세션이나 서로 다른 새 token은 건드리지 않는다.
- 회귀: no-WebLocks Android UA 모의 logout→페이지 새로고침에도 token 복원 0; 정상 새 로그인은 marker 해제; 두 탭 실제 storage event 이후 sibling 관리자/앱 UI 즉시 종료, 관련 없는 새 로그인 보존.

## 3. 깊이 8단계 검수와 회귀 범위
1. **정합성·구문·SHA:** 공식 235 완료본과 236 시작 HTML 및 SHA 일치, inline JS 파싱, 기본 DOM ID 중복, 고정 APP_VERSION, 최종 HTML 고정 SHA.
2. **4조 근무/대정비:** 2026~2027 A/B/C/D 독립 패턴 **2,920건** 비교, 10/1~15 주2/주말휴무/10/15 C 야간.
3. **연차/장기재직:** 연차 구간 500개 랜덤 집합 병합, 11h·8h·0h 및 자정 넘김, 장기재직 5년 인식.
4. **인사·계정·관리자:** sort_order 0, 관리자 unlock·권한 표시, PC 탭 전용 비영구 로그인/복구와 모바일 shared login 분리, legacy 이관.
5. **복구·응답 계약:** SQL/RPC 형식의 날짜/시각/지문 metadata 거부 테스트, 저장소 quota 및 remove 예외 시 이전 token·관리자 표식 보존. 실제 Supabase RLS 검사는 하지 않음.
6. **지문사진:** 실제 Chrome Canvas PNG→JPEG 압축·서명·파일명/이모지·비이미지 거부. 실제 Android 네이티브 카메라/파일 선택 없음.
7. **동시성·보안:** Chrome 두 탭 **150회**, 네 탭 **400회** Web Lock protected critical section 충돌 0; old logout/new login 역할 소유권, 서버 RPC 모의, Web Locks 미지원/거절, 모바일 sibling storage marker 전파 실검증.
8. **UI·페이지 수명:** 320/360/390/430/768/1024/1440px 가로 넘침, 로그인/logout UI 즉시 반영; 실제 Chrome 뒤로 가기 후 PIN 값 비움. **BFCache persisted 여부는 'unknown'으로 반환되어 BFCache 실행 검증을 주장하지 않는다**.

## 4. 최종 재검·미검증
- 첫 수정 후 95 PASS (CI #38133198446); 모바일 방어 추가 99 PASS (CI #38133500375); 독립 서버 무효화 101 PASS (CI #38133615404); 실 모바일 sibling 탭 보호 103 PASS (CI #38133814904).
- **최종 고정 SHA 재검 2회 연속: [#38134099849](https://github.com/eco-i/eco-i.github.io/actions/runs/38134099849) 및 [#38134173052](https://github.com/eco-i/eco-i.github.io/actions/runs/38134173052) — 각 105개 상위 검사 PASS, 0 FAIL.** 둘 다 동일한 SHA `5cd92191f2fd61e31b5c1effcf36a92847051e6d7dcf7b6c9fe32153a8b9e32a`, 1,161,068 bytes 확인.
- 테스트 하네스에서 원격 페이지 주소 `/away`에 404를 반환해 Playwright 이동 검사가 중단된 사례(CI #38134034158)는 실 제품 결함 아님; 테스트용 200 페이지를 서빙하도록 수정 후 실제 PIN cleared PASS. BFCache cache restoration persisted는 검증되지 않음.
- 운영 Supabase 실제 DB·RLS/권한, 휴대폰 실기기 사진 카메라 및 native picker, 로그인 토큰이 실제 서버에 남아 있는 상태의 다중탭, 물리 iOS Safari, BFCache 복구 모드, 실백업·복원은 미검증.
- GitHub `qa-2-8`만 변경, `main` 수정/배포 없음. 구버전 열린 탭은 새 suppression/Web Locks 계약을 이해하지 못할 수 있으므로 배포 시 모두 새로고침 등 별도 처리 필요.

## 5. 인계
- 최종 `qa-handoff/index.working-2-8-236.html`, QA `index.html`, `qa-handoff/index.before-2-8-237.html`은 동일 Git blob 및 SHA.
- 다음 검수 2-8-237, High·깊이8·최소20분·문제 즉시 수정 및 반복 회귀. APP_VERSION/운영 배포 변경 금지.
