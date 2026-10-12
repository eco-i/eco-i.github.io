# 근무모아 2차·깊이 8단계 종합검수 — 2-8-242 공식 완료 보고서

**판정:** High·깊이8, 실제 Chromium에서 서로 구분되는 보안 제품 결함 **2종** 재현·수정. 동일 최종 후보 SHA에서 전체 회귀 **198 PASS / 0 FAIL, 2회 연속**. 별도 실제 두 탭/native JS confirm 경쟁검증도 RED/ GREEN 성공. 실제 운영 DB 및 물리 모바일 네이티브 동작은 직접 검증하지 않았음.

## 1. 공식 연속성·시간·무결성
- 직전 공식 **2-8-241**, 이번 **2-8-242**, 다음 **2-8-243**. 누적 제품 결함 **517 → 519종**(신규 2종).
- 실제 검수 시작 2026-10-12 **19:57 KST** 전후, 완료 **20:20:25 KST**. 실제 GitHub 소스 분석, 결함 RED→패치→Chromium 실회귀, 후속 독립 두 탭/Native dialog 연구, 독립 반복·소스 대조·인계 작업 **20분 초과**.
- 불변 시작본 `qa-handoff/index.before-2-8-242.html`: SHA-256 `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`, 1,165,130 bytes.
- 최종 후보 `qa-handoff/index.working-2-8-242.html`, QA `index.html`, 다음 `qa-handoff/index.before-2-8-243.html`: SHA-256 `c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082`, **1,165,913 bytes**.
- `APP_VERSION ver20260927-0944` 유지. SQL·`main`·실배포 변경 없음.

## 2. 신규 제품 결함 ① — confirm/prompt 직후 토큰 폐기를 이전 snapshot 검사에서 누락
- 조건: 사용자가 이미 연 native confirm/prompt 안에서 다른 탭이 이전 토큰 A의 공유 로그아웃 suppression 마커를 기록하고, 기존 shared token A가 남아있는 경우.
- 기존 `fingerprintBlockingPromptSessionChanged(snapshot)`은 `snapshot.mode=shared/tab` 이후 저장소 변화만 확인하고 현재 정확히 A가 tombstoned 되었다는 사실을 확인하지 않아, 모달 결과를 승인함.
- 실제 Chrome 최초 RED [#38239978347](https://github.com/eco-i/eco-i.github.io/actions/runs/38239978347): **12 PASS / 6 FAIL**(모바일·PC의 동일 결함 경로 6개; 신규 결함 6종 아님).
- 수정 ①: `fingerprintBlockingPromptSessionChanged(snapshot)` 내 기존 현재-token 비교 직후 `storedSessionTombstoned(snapshot.current)` 재확인 후 reconciliation 예약 및 false-safe 결과.
- Chrome GREEN [#38241846303](https://github.com/eco-i/eco-i.github.io/actions/runs/38241846303): **18 PASS / 0 FAIL**. 독립 새 PC·모바일 토큰 B 유지.

## 3. 신규 제품 결함 ② — 실제 cross-renderer native dialog에서 localStorage 갱신 지연 중 이전 토큰의 RPC 발송
- 추가 현실 브라우저 검증: Chrome **서로 다른 실제 두 탭**에서 A 탭이 native confirm()을 띄운 사이 B 탭이 로그아웃 마커 A를 기록. 모달이 반환된 바로 그 synchronous task에서 A 탭의 localStorage는 일시적으로 이전 값을 반환하고 StorageEvent 처리는 아직 이루어지지 않음.
- 따라서 수정 ①만으로도 `confirmMutationWithSessionGuard`가 true를 반환할 수 있었고, `rpc('save_my_fingerprint_photo', {p_token:A})` 변경 요청 **1건이 fetch로 송신**됨. 이후 응답에서 `SHARED_SESSION_CHANGED`로 차단하더라도 변경 RPC 전송 자체가 일어난다는 제품 결함.
- 수정 ②: 일반 인증조회/변경/민감조회 RPC를 fetch하기 전에 **브라우저 task 1회 양보**(`setTimeout(...,0)`)하고, `guardSensitiveDataRpcSession`, `guardMutationRpcSession`, `guardOrdinaryAuthenticatedReadRpcSession`를 재실행하여 폐기된 토큰의 네트워크 전송을 차단.
- 실제 native Chrome dialog RED/GREEN 비교 [#38241625619](https://github.com/eco-i/eco-i.github.io/actions/runs/38241625619): 원본 fetch **1건**, 최종후보 fetch **0건**. 확인창 UI의 transient true 반환 자체가 발생할 수 있지만 **인증된 변경 RPC는 보내지 않음**. 서버 측 Supabase/RLS는 별도 미검증.

## 4. 깊이 8단계, 최종 후보의 독립 전체 Chrome 회귀
- [독립 1회 #38241742880](https://github.com/eco-i/eco-i.github.io/actions/runs/38241742880): **198 PASS / 0 FAIL**.
- [독립 2회 #38241882963](https://github.com/eco-i/eco-i.github.io/actions/runs/38241882963): **198 PASS / 0 FAIL**.
- 두 실행 모두 `c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082`, 1,165,913 bytes. 2,920개 근무일·조, 10월 대정비 4조 구분, 500구간 연차 fuzz, 4조2교대·휴무, 직원/관리자 세션, 사진/민감 백업/일반 read RPC, Chrome Canvas 이미지 검증, 실제 Web Locks 2/4탭·storage, 320~1440px 7폭, 31일 달력 및 보안 복귀 재검.
- [독립 소스 무결성 #38241809337](https://github.com/eco-i/eco-i.github.io/actions/runs/38241809337): **시작 SHA/byte 고정, 정확히 2개 원인 위치의 소스 치환만 발생**, 2개 inline script 구문, 고유 DOM ID 457개, 최종 SHA 확인.

## 5. 분류·한계
- **제품 결함 신규 2종**; RED의 개별 6개 assertion과 중간 후보의 SHA 핀 검사 실패는 별도 제품 결함으로 세지 않음.
- Native dialog 초기 실험에서 마커가 B 탭에서는 기록되었으나 A 탭의 같은 synchronous task에서 아직 반영되지 않는 것은 **실제 Chrome 이벤트 전달 경계**. 후속 실험에서 네트워크 전송까지 재현했으므로 제품 결함 ②로 집계하여 고침.
- 생산 Supabase/RLS, 실제 인증된 backend 멀티유저, 물리 Android 기본 카메라/파일 picker, iOS Safari, confirmed BFCache persisted, 실제 백업/복원 **직접 미검증**.
- 20분 경과나 인위적 대기만으로 완료로 간주하지 않고 실제 결함 재현, 정확한 소스 수정, 전체 반복 회귀와 인계 무결성을 확인함.

## 6. 다음 블록
- **2-8-243**은 반드시 `qa-handoff/index.before-2-8-243.html` 기준 시작, High·깊이8, 블록당 최소20분 실제 심층검수와 20분 이내 진행보고, 기술 결함 즉시 수정·Chromium 회귀, 번호 연속, APP_VERSION/SQL/main/배포 임의 변경 금지. ZIP 불필요.
