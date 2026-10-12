# 근무모아 2차·깊이 8단계 종합검수 — 2-8-243 공식 완료 보고

**판정:** High·깊이8 고정. 실제 headless Chromium에서 계정 세션/강제 PIN/조회전용 변경에 따른 서로 다른 클라이언트 보안 제품 결함 **3종**을 순차 RED 재현하고 `qa-2-8`에서 소스 수정·회귀. 최종 같은 SHA 후보에 대한 전체 Chrome 회귀 **201 PASS / 0 FAIL 2회 독립 성공**, 집중 모바일+PC 실검, 정확한 소스 변경 검증.

## 1. 공식 연속성/무결성
- 직전 공식 2-8-242, 이번 완료 2-8-243, 다음 2-8-244. 공식 제품 결함 누적 **519 → 522종**(신규 **3종**).
- 불변 시작본 `qa-handoff/index.before-2-8-243.html`, SHA-256 `c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082`, **1,165,913 bytes**.
- 최종 `qa-handoff/index.working-2-8-243.html`, 검수 `index.html`, 다음 `qa-handoff/index.before-2-8-244.html` SHA-256 `fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4`, **1,167,315 bytes**.
- 실제 검수 약 **22:51 ~ 23:11:47 KST** (20분 이상). GitHub 파일 직접 분석, RED/ GREEN Chromium 실행, 전체 8단계 반복 회귀, 독립 무결성 및 인수인계 포함. 시간 경과만으로 PASS 판단하지 않음.
- `APP_VERSION ver20260927-0944` 유지. SQL 수정 없음. 운영 `main` 커밋 `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로, 실배포 없음.

## 2. 신규 제품 결함 ①: 동일 로그인 토큰의 보안 세대(epoch)가 갱신돼도 대기 중 RPC가 전송
- 조건: 이미 호출된 보호 RPC가 242차에서 추가된 비동기 브라우저 task `setTimeout(0)`에 대기하는 동안 기존 사용자가 강제 초기 PIN 게이트로 전환. 로그아웃은 아니므로 `state.sessionToken`과 저장 토큰은 변하지 않지만 `invalidateSessionBoundLoads()`가 `sessionContextEpoch`를 갱신한다.
- 최초 실제 Chromium [RED #38259260719](https://github.com/eco-i/eco-i.github.io/actions/runs/38259260719): 모바일/PC 각각 **오래된 메모 저장 RPC 1건 전송**. 후속 응답에서 `SHARED_SESSION_CHANGED`로 폐기될 뿐 전송 자체가 발생.
- 수정: 보호 RPC의 task 양보 직후 `responseOwnerEpoch!==sessionContextEpoch`이면 인증된 fetch를 호출하기 전에 차단. 해당 요청의 token이 그대로여도 과거 보안 컨텍스트는 재사용 불가.
- 집중 GREEN: 모바일/PC에서 이전 메모 저장 **0건**. 게이트 이후 새로 실행한 `change_own_pin_v2`는 **1건 정상 전송**.

## 3. 신규 제품 결함 ②: 강제 초기 PIN 변경 중 새 비업무 RPC까지 차단되지 않음
- 조건: 서버가 강제 초기 PIN 게이트를 확정해 일반 앱 UI를 숨긴 뒤에도 보호된 `save_my_memo_v2`와 민감 `export_my_data_v1`의 공용 client RPC 가드는 해당 게이트를 검사하지 않음.
- 실제 Chromium [RED #38259767471](https://github.com/eco-i/eco-i.github.io/actions/runs/38259767471): 모바일/PC 각각 **비업무 저장 1건 + 민감 export 1건 전송**. UI가 가려져 있어도 공통 RPC를 직접 호출하는 잔여 비동기 경계에서 보안 일관성이 깨짐.
- 수정: `guardMandatoryInitialPinGateRpc(name)` 공통 helper를 도입해 protected mutation 및 sensitive data RPC의 **최초/전송 직전 사전가드** 양쪽에서 검사. 단 강제 PIN 변경의 실제 목적 RPC `change_own_pin_v2`는 허용.
- 집중 GREEN: 각 환경 저장/내보내기 전송 **0건**, PIN 변경 1건 정상 유지.

## 4. 신규 제품 결함 ③: 조회전용 계정 전환이 진행 중 쓰기 RPC의 전송을 중단시키지 않음
- 조건: 보호 쓰기 RPC가 비동기 전송 전 대기하는 동안 서버 응답이나 최신 계정 조회로 `state.me.is_read_only`가 확정되지만, 해당 RPC의 클라이언트 선행 ownership 가드는 계정 read-only를 확인하지 않음.
- 실제 Chromium [RED #38260485665](https://github.com/eco-i/eco-i.github.io/actions/runs/38260485665): 모바일/PC에서 read-only 전환 뒤 **메모 저장 RPC 각 1건 전송**.
- 수정: 공용 protected mutation guard에서 `accountReadOnly()`를 동기 재확인, 읽기전용 확정이면 `ACCOUNT_READ_ONLY`로 fetch 전에 차단. 본인 PIN 변경 `change_own_pin_v2` 예외 유지.
- 집중 GREEN [#38260657929](https://github.com/eco-i/eco-i.github.io/actions/runs/38260657929): 모바일/PC에 대해 read-only 저장 **0건**, 오류 `ACCOUNT_READ_ONLY`; 기존 강제 PIN·epoch 테스트도 전부 통과.
- 이 3종은 각각 epoch 전환, 이미 열린 PIN 게이트, 권한 상태 read-only라는 **별도 원인**으로 집계. 같은 재현 검사 내 다수 assertion 실패는 별도 결함으로 중복 집계하지 않음.

## 5. 실제 Chromium 깊이8 전체 회귀
- **독립 1회** [#38260776545](https://github.com/eco-i/eco-i.github.io/actions/runs/38260776545): **201 PASS / 0 FAIL**.
- **독립 2회** [#38260978433](https://github.com/eco-i/eco-i.github.io/actions/runs/38260978433): **201 PASS / 0 FAIL**.
- 두 회차 모두 동일 `fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4`, **1,167,315 bytes**. 기존 전체 검수 8계층(HTML/JS/DOM·2026~27 4조2교대/대정비·연차 500 fuzz·로그인/직원관리·지문사진/백업/RPC·Chromium 이미지·Web Locks 실제 2/4탭·캘린더 31일과 7개 viewport)에 새로운 243 보호 가드 체크 포함.
- 독립 원본 대비 source delta 무결성 [#38260859071](https://github.com/eco-i/eco-i.github.io/actions/runs/38260859071): **PASS**. 원본/최종 SHA, 바이트, 정확히 **3개 source anchor**(epoch, PIN, read-only)의 대조, inline JS 2개 구문, DOM ID 457개 중복 없음.
- 집중 테스트 [#38260657929](https://github.com/eco-i/eco-i.github.io/actions/runs/38260657929): 실제 모바일 Chromium + PC Chromium **2 PASS / 0 FAIL**, 세 보안 결함의 요청 전송 수 및 정상 본인 PIN 변경 보존.

## 6. 현실 검증 한계 / 다음 단계
- 운영 Supabase/RLS 실제 실행, 실제 backend 멀티유저 인증, 물리 Android 네이티브 카메라/파일 picker, iOS Safari, persisted BFCache, 운영 백업/복원은 **직접 검증하지 않음**. 브라우저 fetch stub은 UI/클라이언트 경계 확인용이며 서버 실권한 판단 증거로 부르지 않음.
- 243 블록에서 실제 RED를 판정한 3종만 제품 결함에 집계. 이전 소스 SHA를 기대하던 테스트 스크립트의 실패는 제품 결함 아님; 테스트를 최신 후보 SHA에 맞춰 갱신하고 재수행.
- 다음 2-8-244는 `qa-handoff/index.before-2-8-244.html`로 시작. High·깊이8 유지, 블록당 실제 20분 이상 검수와 20분 이내 중간보고, 기술 오류 즉시 수정·실 Chromium 회귀, 번호 연속. ZIP 불필요; GitHub 직접 사용. 새 버전, SQL, main 및 운영 배포 임의 변경 없음.
