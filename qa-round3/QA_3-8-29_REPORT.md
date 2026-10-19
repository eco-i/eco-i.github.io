# 근무모아 3차·깊이8 — 3-8-29 공식 검수 보고서

## 공식 판정
- **3-8-29 범위 한정 CLEAN**. 신규 확정 제품 결함 **0종**, 3차 누적 **18종 유지** (2차 역사적 540종 별도).
- 유효 **88/88 격리·정적 검사 PASS** = 연차 설정 실제 저장 함수 14 + 장기재직 실제 저장 함수 14 + PIN 게이트 재확인 9 + 초기 PIN 지연 안내 7 + 정적·구문·원격 무결성 44.
- `qa-3-8/index.html` 코드 **변경 없음**. 기존 blob `d3e535031861bfdd372fc0b8d1f24ef6070cccdf`, `APP_VERSION ver20261018-2313` 유지.
- `main` 운영 HEAD `6c784210e048426f18a486d5602652626d97574d` 기준선 일치. 운영 배포·SQL 실행·실제 직원 DB 조회/쓰기 **0건**.
- CLEAN은 명시된 함수 격리/정적 검사 범위만 뜻하며 전체 앱·실운영·실기기 검증을 의미하지 않는다.

## 깊이8 단계별 검수
1. **공식 기준선/소유권**: GitHub 공식 `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-28_REPORT.md`를 직접 조회. 28 완료/29 시작, 18종, main HEAD, QA `index.html` blob, JS 원본 참조 일치. 브랜치 변경 시 임의 main 커밋 금지.
2. **연차 저장 비동기 경계 14/14**: 실제 `saveAnnualLeaveSetting()` 본문을 추출해 격리 DOM·가짜 RPC로 테스트. 쓰기 후 네트워크 타임아웃(서버 적용/미적용), 504 게이트웨이, 쓰기 전 조회 실패/타 창 CAS 변경, 확정 stale 거절, 비정상 성공 응답/후속 재조회 실패, 정상 성공/후속 재조회 실패, preflight 세션 역전, mutation 후 세션 역전, readonly 권한 철회, lifecycle stale을 확인. 오입력 재전송·잘못된 성공 표시 없음.
3. **장기재직 저장 비동기 경계 14/14**: 실제 `saveLongServiceSetting()`에 동일 14개 경계조건 적용. 입사일/이전 사용분/제외기간 초안·CAS, 응답 불확실성, 권한/세션 경계 보호 확인. 성공한 저장 뒤 읽기 실패 시 안내 경로도 별도 검증.
4. **오류 분류/Realtime 중재**: 실제 `isTransientRpcError`, `userSafeServiceError`, `scheduleMutationOutcomeCatchup`을 함수 격리에서 호출. 네트워크/타임아웃/504 변경 RPC는 `rpcMutation` 메타데이터에 따라 '서버에 이미 반영되었을 수 있음'이라고 안내하고 freshness gap·catch-up을 1회 등록. 실패한 사전 조회는 변경 RPC 불확실로 오인하지 않음. 명확한 STALE, 세션 소유권 상실은 후속 오염 없이 중단.
5. **초기 PIN 게이트 재확인 9/9**: 실제 `recheckInitialPinGate()`로 PIN 변경 완료 여부, 여전히 강제변경, RPC 네트워크 실패, 만료 세션, 같은 토큰의 epoch 변경, 다른 로그인 토큰, 호출 도중 게이트 해제, 빈 토큰, 비활성 게이트 검증. 오래된 결과가 새 게이트를 닫지 않음.
6. **지연 초기 PIN 안내 7/7**: 실제 `maybeShowInitialPinNotice()`로 강제변경 감지, 비강제 응답, epoch/토큰 전환, 상태 RPC 오류와 재연결 예약, 이미 표시된 안내, 이미 켜진 강제 게이트를 검증. 가짜 `INITIAL_PIN_NOTICE_KEY_PREFIX` 누락으로 발생한 테스트 harness ReferenceError는 유효 검사에서 제외하고 보완 후 7/7 PASS.
7. **구문·DOM·기존 회귀 보호 44/44**: inline JS 2개 구문 검사, 중복 DOM id 0, 분리된 QA/main 브랜치, PIN 강제 닫기 차단 및 비밀 입력 정리, 로그인 시도 세대·세션 pending 초기화, RPC 전 read-only/토큰/epoch 가드, 연차/장기 CAS와 재조회, Realtime 중 pending/초안 보전, 중첩 팝업 aria-hidden·상단 focus·복귀 focus 정적 위치 확인. 단순 HTML 정규식은 `id="..."` 486개/중복 0개를 수집했으나 이전 보고의 '488개'는 집계 방식이 명시되지 않아 **488개 일치 여부**를 성립한 검사로 계산하지 않았다. 동적 브라우저 접근성 판정은 하지 않음.
8. **허위 양성 제거·판정·인계**: 최초 단순 모의 `Error`에 실제 공용 RPC의 `rpcMutation/isNetworkError`를 부여하지 않아 저장 오류 안내를 '확정 실패'처럼 관측한 의심 1건은 **테스트 fixture 결함**으로 분류해 제품 결함·검사 성공수에 포함하지 않음. 실제 에러 메타데이터 및 자동 catch-up 경로를 재검증해 수정 없이 CLEAN 판정. 검증한 QA 코드 자체의 변경 없이 보고서/인계 파일만 QA 브랜치에 기록.

## 미검증·안전 범위
- 실제 로그인한 전체 사이트 Chromium E2E, 물리 Android/iOS와 TalkBack/VoiceOver, PIN 실제 변경 및 관리자 역할 교체, Supabase 인증 세션 2개 동시 저장/충돌은 **미검증**.
- 실직원/근태/지문/감사 자료 조회·쓰기 0, 실제 DB SQL 실행 0, main 및 운영 배포 변경 0.
- 가짜 RPC 격리 검사는 브라우저·서버 원자성/현장 접속 품질의 증거가 아니다.

## 다음 3-8-30 권고
- QA 격리 범위에서 `restoreSession` 대기와 PIN 게이트/관리자 권한 복구의 세션 역전, `changeOwnPin` 응답 후 Realtime 소유권/중첩 모달 복귀를 더 깊게 검토.
- 실서버 인증·2세션 검증은 운영 직원 DB를 사용하지 않는 **별도 QA 계정/DB**가 마련되기 전에는 수행하지 않는다.

작성시각(KST): 2026-10-19T20:59:27+09:00
