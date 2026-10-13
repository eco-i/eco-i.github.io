# 근무모아 2차·깊이 8단계 종합검수 — 2-8-247 공식 완료 보고

**최종 판정: 공식 완료(High·깊이8).** 새 클라이언트 보안 제품 결함 1종을 실제 Chrome에서 RED 재현하고 QA 전용 브랜치에 수정. 실제 Chrome 기반 전체 깊이8 **210 PASS / 0 FAIL, 최종 동일 SHA 3회 독립 성공**. 1개 함수의 제한된 소스 수정과 SHA/DOM/구문 무결성 검증, 관리자 민감 UI 삭제·두 탭 native confirm 및 인증 범위 조합 회귀 통과.

## 1. 공식 연속성 및 기준본
- 공식 완료 순서: **2-8-246 → 2-8-247 완료 → 다음 2-8-248**. 제품 결함 누적 **528 → 529종**(신규 1종).
- 실제 정밀검수 시간: **2026-10-13 17:41 KST 시작 ~ 2026-10-13T18:03:02.054+09:00 완료**, 실제 20분 이상 GitHub 소스 확인, 브라우저 RED 재현/수정/GREEN, Android 모바일 에뮬레이션·PC, native confirm·실제 두 탭, 8계층 전체 재검, 정확한 바이트 및 diff 비교.
- 불변 시작: `qa-handoff/index.before-2-8-247.html`, SHA-256 `8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d`, **1,169,644 bytes**.
- 최종 동일 바이트: QA 브랜치 `index.html`, `qa-handoff/index.working-2-8-247.html`, 다음 `qa-handoff/index.before-2-8-248.html`: SHA-256 `2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776`, **1,170,255 bytes**.
- `APP_VERSION ver20260927-0944` 및 `version.json` 유지. SQL·운영 `main`·실배포 불변(운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0`).

## 2. 신규 제품 결함: 오래된 탭 관리자 인증 표식이 공유 관리자 인증 해제를 무효화
- 조건: 모바일 공유 로그인 또는 PC 로그인 유지처럼 **로컬 스토리지 공유 세션 토큰이 권한 기준**인데, 옛 로그인/이관·일부 정리 실패에서 동일한 `sessionStorage` 관리자 해제 표식이 남아 있는 경우.
- 기존 `adminUnlockMatches(token)`은 `localStorage`와 `sessionStorage` 중 **어느 한 곳**에 관리자 표식이 있으면 성공 처리. 다른 탭에서 공유 관리자 잠금 해제 표식을 철회해도 옛 탭의 유령 표식 때문에 `activeAdminMode()`가 true로 남고 관리자 전용 `list_recent_audit_page` 읽기 RPC가 전송될 수 있었음.
- 실제 Chrome **RED** [#38371591963](https://github.com/eco-i/eco-i.github.io/actions/runs/38371591963): 모바일 공유 로그인과 PC 로그인 유지에서 각각 **관리자 요청 1건 송신**, PC 탭 전용 임시 로그인은 독립성 유지.
- **수정:** `adminUnlockMatches`에서 `storedSessionTombstoned` 및 실제 세션 소유 저장소(`SESSION_KEY`)를 먼저 확인. 모바일 공유/PC 로그인 유지에는 **공유 관리자 해제 표식만** 인정. PC 독립 임시 로그인에는 **탭 전용 관리자 해제 표식만** 인정. 모바일의 공유 로그인 값이 완전히 없는 이전 임시 세션 이관 경로에 한해 탭 전용 표식도 검사. 다른 저장소의 stale 표식으로 현재 권한을 되살리지 못하게 방지.
- 실제 Chrome **GREEN** [#38371810438](https://github.com/eco-i/eco-i.github.io/actions/runs/38371810438) 기본 3/0, 확장 [#38372273058](https://github.com/eco-i/eco-i.github.io/actions/runs/38372273058) 5/0. 모바일 공유, PC 로그인 유지, PC 중복 legacy 표식, PC 임시 탭, 모바일 legacy 이관 범위에서 정상 동작을 구분.
- 진짜 두 탭 native `confirm()` 중 다른 탭에서 공유 관리자 해제: [#38372173867](https://github.com/eco-i/eco-i.github.io/actions/runs/38372173867) **모바일+PC 2 PASS/0 FAIL**, 관리자 RPC 전송 **0건**.
- 독립 확장 Chrome 진리표 [#38372770118](https://github.com/eco-i/eco-i.github.io/actions/runs/38372770118): 모바일/PC 세션·관리자 토큰·로그인 유지 조합 각 **162개**, 총 **324개**; 같은 각 조합의 정확한 로그아웃 tombstone 324개 추가 확인: 총 **648개 상태 검증, 위반 0건**.
- 이는 **원인 1개**인 혼합 저장소 권한 허용식으로 집계하며 모바일·PC 실패 건수를 각각 결함으로 중복 계상하지 않음.

## 3. 실 Chromium 깊이8 회귀
- 최종 SHA 고정 전체 1차 [#38372546876](https://github.com/eco-i/eco-i.github.io/actions/runs/38372546876): **210 PASS / 0 FAIL**.
- 동일 SHA 독립 2차 [#38372823590](https://github.com/eco-i/eco-i.github.io/actions/runs/38372823590): **210 PASS / 0 FAIL**.
- 동일 SHA 독립 3차 [#38372992035](https://github.com/eco-i/eco-i.github.io/actions/runs/38372992035): **210 PASS / 0 FAIL**.
- 검사 항목: 2026~2027 4조2교대·대정비, 연차 다중 기간·자정 경계, 동시 탭 Web Locks/저장소, 본인 PIN/관리자 권한, 지문사진 원본 데이터 및 이미지, 백업/메모, 휴무·휴일 및 7개 UI 화면폭 등 기존 깊이8 전체 + 이번 관리자 scope 검사.
- 실제 두 탭에서 관리자 권한 철회 시 audit/PIN/백업 용량 등 민감 UI 캐시·문구 삭제 및 native Chrome 확인창 시나리오: [#38373143028](https://github.com/eco-i/eco-i.github.io/actions/runs/38373143028), [#38373155719](https://github.com/eco-i/eco-i.github.io/actions/runs/38373155719), 각 CI에서 **일반 두 탭 18 PASS/0 FAIL + native dialog 18 PASS/0 FAIL**. 표식이 살아 있는 구형 탭 상황까지 명시적으로 주입해 검증.
- 독립 소스 무결성 [#38372576639](https://github.com/eco-i/eco-i.github.io/actions/runs/38372576639), [#38373060134](https://github.com/eco-i/eco-i.github.io/actions/runs/38373060134) PASS: **원본 대비 오직 `adminUnlockMatches()` 함수 하나의 source diff hunk**, 불변/최종 SHA·바이트, JS inline 2개 구문, DOM ID 457개 고유성.

## 4. 검증 한계 및 다음 블록
- 실제 네트워크 테스트는 Chrome에서 stubbed RPC. **운영 Supabase 인증/SQL/RLS·진짜 백엔드 다중사용자 권한·물리 Android 카메라/파일 선택기·iOS Safari·persisted BFCache·운영 백업/복원은 직접 시험하지 않음**. Client 전송 차단 성공을 서버 RLS까지 보안성이 증명됐다고 주장하지 않는다.
- 초기에 구 코드 문자열을 기대한 전체 회귀 스크립트가 실패한 것은 **테스트 스크립트 기준 불일치**로 수정한 뒤 같은 후보에 3회 최종 전체 PASS. 공식 제품 결함 1종에 포함하지 않음.
- 다음 공식 시작 **2-8-248** 기준 `qa-handoff/index.before-2-8-248.html`. High·깊이8, 블록당 20분 이상 실제 검수, 20분 이내 중간 보고, 기술 결함 즉시 수정·Chromium 회귀, 번호 연속. APP_VERSION/SQL/main/운영 실배포 변경 금지, ZIP 요청 금지.
