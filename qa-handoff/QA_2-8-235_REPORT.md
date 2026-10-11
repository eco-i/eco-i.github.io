# 근무모아 2차·깊이 8단계 종합검수 — 2-8-235 공식 완료

**판정: 새 제품 결함 1종 수정·회귀 PASS (로컬 Chrome 및 정적검수 범위).** 실제 운영 Supabase/RLS·안드로이드 네이티브 파일선택/실제 계정 동시 로그인·BFCache는 미검증이며 그 범위를 통과한 것으로 간주하지 않는다.

## 공식 번호·시간·결함
- 전 마지막 공식 완료: **2-8-234**, 이번 유효 완료: **2-8-235**, 다음: **2-8-236**.
- 235 검수 진행: **2026-10-11 19:13:02 KST부터 최소 19:33:05 KST까지** 직접 GitHub 기준본 검사, 실제 브라우저 실행, 결함 재현·수정·회귀, 실패 원인 구분을 수행. **20분 3초 이상 실제 경과**. 시작 부분의 GitHub 확인은 이 시각보다 먼저 진행됨.
- 이번 신규 제품 결함 **1종**, 공식 누적 **505→506종**.
- 시작본 SHA-256 `a46a2d8d11f1eaecab8b42e461804bad70650c4da462324e370dd307a112cd63` / **1,157,156 bytes**.
- 최종·236 시작본 SHA-256 `f67887f5427da8331eaa134fbaeec73493815ac52e4c1cbcbbcaec1e42dbc50e` / **1,158,706 bytes**.
- `APP_VERSION='ver20260927-0944'` 유지. SQL 변경·운영 `main` 배포 없음.

## 결함 재현과 수정
**Web Locks 미지원·잠금 요청 거절 PC 브라우저에서, 탭 전용 임시 로그인/관리자 인증/로그아웃/기존 업데이트 인계까지 차단된 제품 결함 1종**.
- 수정 전 실제 Chromium의 `navigator.locks` 미지원 모의환경에서 탭 자체의 `storeLoginSession(token,false)`는 성공하지만 `storeLoginSessionForFreshLogin(token,false,...)`은 실패. [재현 #38131443139](https://github.com/eco-i/eco-i.github.io/actions/runs/38131443139).
- 추가로 PC 탭별 `sessionStorage`의 유효한 비영구 업데이트 handoff를 자동 부팅에서 복구하지 않는 현상 재현. [재현 #38132041574](https://github.com/eco-i/eco-i.github.io/actions/runs/38132041574). 같은 탭-전용 경로에 대한 공유잠금 과적용 원인으로 보고 **동일 결함 1종**으로 합산(이중 카운트하지 않음).
- `storeLoginSessionForFreshLogin` / `storeAdminUnlockForFreshLogin`은 PC 비영구 로그인에만 **동기 탭 전용 경로** 허용(잠금 불필요). 지속로그인·모바일 공유쓰기에는 계속 Web Locks 필수.
- `safelyClearStoredLoginSession`으로 PC 임시 logout/로그인 실패/로컬미리보기 실패의 탭 전용 키를 Web Locks 없이 정리하도록 변경. 원래 공유 로그인 token/관리자 표식은 잠금 밖에서 수정하지 않는다.
- `ensureAdminUnlockForRestoreWithScope`에서 PC 탭전용 복구만 별도 처리하고, 모바일·기억하는 로그인은 여전히 공유 잠금 안에서 검증.
- 자동 부팅의 `restoreUpdateSessionHandoff`는 공유 잠금 획득 실패 시 **실제 `sessionStorage`에 있는 `persistent:false` 탭 전용 handoff에 한해** 안전한 복구를 허용. 기존 공유 `localStorage` 기반 handoff는 우회 복구하지 않음.

## 깊이 8단계 검수
1. **원본·구문·버전:** 234 SHA/1,157,156 byte 시작본, 최종 SHA/1,158,706 byte, inline scripts Node 파싱, DOM 중복 ID, APP_VERSION 동일 유지.
2. **근무조·대정비:** A/B/C/D 2026~2027 **2,920개** 근무일 독립 패턴 비교, 10/1~15 평일 주2·휴일 휴·10/15 C조 야간.
3. **연차·장기재직:** 연차시간 구간 500개 무작위 집합 비교, 11h/8h/0h 근무, 자정 경과 시간제, 장기재직 5년 기념일.
4. **인사·권한·복구:** 정렬값 `0`, PC 기억 로그인/임시 로그인·Android 레거시 이관, 관리자 2차 인증 표식 보존·철회, 실제 `restoreSession()`을 원격 신원 응답만 모의해 직원/관리자 복구 확인.
5. **응답·저장소 실패:** 잘못된 RPC ISO timestamp·지문 metadata 차단, HTML 인젝션 escape, `Storage.setItem/removeItem` 권한/용량 오류 주입 후 이전 토큰·관리자 표식 회귀 보존.
6. **지문사진:** 실제 Chromium Canvas PNG→JPEG, JPEG 바이트 서명·이모지 파일명·비이미지 거부; 운영 업로드/네이티브 촬영은 미수행.
7. **실제 다중탭:** Chromium 2탭 보호 진입 **150회 충돌 0**, 4개 독립 탭 Web Locks **400회 동시 진입 0**, 구 토큰 늦은 로그아웃/관리자 unlock/작업 취소 후 저장 차단 확인. Web Locks 미지원·API request 거절에서 공유 세션 쓰기 fail-closed, PC 탭 전용 경로는 정상 PASS.
8. **반응형·세션수명:** 320/360/390/430/768/1024/1440px 폭 넘침, PC 임시 업데이트 handoff/관리자 proof 자동 부팅 회귀, 모바일 UA 모의 영구로그인·로그아웃. Android 물리기기와 BFCache는 미검증.

## 자동검사와 결과
- 첫 235 확대검수: CI [#38131263283](https://github.com/eco-i/eco-i.github.io/actions/runs/38131263283) **75 PASS** (수정 전 핵심 경계조건 테스트 추가 이전).
- 수정 후 235 확대검수 중간: CI [#38131605468](https://github.com/eco-i/eco-i.github.io/actions/runs/38131605468) **80 PASS**.
- 4탭 경합·저장소 오류·handoff 등 확대 후: CI [#38132131798](https://github.com/eco-i/eco-i.github.io/actions/runs/38132131798) **91 PASS**.
- 최종 공식 후보 SHA 고정 후 CI [#38132253855](https://github.com/eco-i/eco-i.github.io/actions/runs/38132253855) **92 PASS, 실패 0**.
- 동일 최종 HTML 재실행 CI [#38132323640](https://github.com/eco-i/eco-i.github.io/actions/runs/38132323640) **92 PASS, 실패 0**. 두 번의 최종 재검 모두 source SHA `f67887f5427da8331eaa134fbaeec73493815ac52e4c1cbcbbcaec1e42dbc50e` 일치.

## 구분과 제한
- 일부 CI 실패는 **결함 수정을 위한 의도적 재현**(임시 로그인 실패·handoff 실패). 초기에 test page가 session-change navigation으로 소멸한 하네스 오류는 별도 격리·수정, 제품 결함으로 산정하지 않음.
- 실제 Supabase/RLS/서버 데이터 경합·계정 권한 변경, iOS/Android 실기기, Android 시스템 카메라·파일 chooser, BFCache 및 운영 데이터 복구 검증은 미수행.
- Web Locks 지원하지 않는 환경에서 **영구 공유 로그인/모바일 공유 로그인**은 fail-closed 정책 유지. PC 비영구 탭 세션만 Web Locks 미지원 fallback 허용.
- `qa-2-8`에만 검수용 HTML 반영, 운영 `main` 수정/배포 없음. 구버전 열린 탭과의 Web Locks 혼재는 배포 시 별도 대응 필요.

## 다음 인계
- `qa-handoff/index.working-2-8-235.html`, QA 브랜치 `index.html`, `qa-handoff/index.before-2-8-236.html`은 **동일 Git blob**.
- 다음 **2-8-236**, High·깊이8·블록 최소20분 실제검수·기술결함 즉시 수정/회귀·운영 main 및 APP_VERSION 유지.
