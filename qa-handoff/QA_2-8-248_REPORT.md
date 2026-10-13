# 근무모아 2차·깊이8 — 2-8-248 공식 완료 보고

**판정:** High·깊이8. 검수 GitHub 브랜치 `qa-2-8`에서 클라이언트 보안 제품 결함 **2종** 각각 독립 RED 재현 → 최소 수정 → 실제 Chromium GREEN, UI 민감정보 제거 및 최종 동일 SHA 전체 회귀 **212 PASS/0 FAIL 3회 독립**, 소스/바이트/DOM 무결성 검증.

## 공식 상태와 불변성
- 마지막 완료 **2-8-248**, 다음 **2-8-249**. 공식 누적 제품 결함 **529 → 531종** (+2).
- 실제 QA 작업 시작은 2026-10-13 **21:23 KST**부터 GitHub 커밋·Chrome 검증 활동으로 확인되며, 공식 정리 2026-10-13T21:47:19.413+09:00; 20분 이상 실제 분석·RED/수정/GREEN·전체 회귀 및 기록.
- 248 불변 시작본 `qa-handoff/index.before-2-8-248.html`, SHA-256 `2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776`, **1,170,255 bytes**.
- 최종 `qa-handoff/index.working-2-8-248.html`, QA 브랜치 `index.html`, 다음 `qa-handoff/index.before-2-8-249.html`: SHA-256 `9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0`, **1,171,231 bytes**.
- `APP_VERSION ver20260927-0944` 및 `version.json` 불변. 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지. SQL 수정 없음, 운영 배포 없음.

## 신규 제품 결함 ①: 모호한 PC 관리자 세션 범위에서 2차 인증 폐기 후 재승인
- PC 로그인 유지 표식 `PC_REMEMBER_KEY`이 사라진 과도기에 동일한 토큰이 공유 `localStorage`와 탭 `sessionStorage` 양쪽 로그인 저장소에 남으면, 양쪽의 오래된 관리자 unlock 표식을 OR/한쪽만으로 승인할 수 있던 경계.
- Chrome RED [#38397092669](https://github.com/eco-i/eco-i.github.io/actions/runs/38397092669): 관리자 2차 잠금 철회 후 보호 요청이 부적절하게 통과하는 PC 과도기 재현.
- 수정: `adminUnlockMatches(token)` 내부, 동일 토큰이 두 저장소에 있으면서 로그인 유지가 false인 모호한 범위에서는 **양쪽 관리자 표식 일치 모두 요구**하여 한쪽 오래된 값의 재승인을 차단. 모바일 공유·PC 임시 탭 독립 세션은 원래 범위 규칙 보존.
- 실제 Chrome GREEN [#38397375409](https://github.com/eco-i/eco-i.github.io/actions/runs/38397375409), [#38398920753](https://github.com/eco-i/eco-i.github.io/actions/runs/38398920753); 모바일/PC 각 162개 세션 조합 + 각 162개 tombstone, 총 **648개 상태 검증 PASS** [#38398920563](https://github.com/eco-i/eco-i.github.io/actions/runs/38398920563).
- 실제 두 탭 native confirm 동시 인증 해제 [#38398920581](https://github.com/eco-i/eco-i.github.io/actions/runs/38398920581): **2 PASS/0 FAIL**.

## 신규 제품 결함 ②: 로그인 유지 표식 이벤트로 관리자 권한이 사라져도 DOM·PIN 캐시가 남음
- 별도 `ADMIN_UNLOCK_KEY` 변경 이벤트 없이 `PC_REMEMBER_KEY`가 삭제되면, 권한 계산은 이미 잠금으로 바뀌었어도 `handleSharedSessionStorageChange()`가 해당 변경 키를 처리하지 않아 이미 표시된 감사/PIN/백업/용량 등의 관리자 전용 민감 콘텐츠가 DOM 및 캐시에 남음.
- 실제 Chrome RED [#38398742914](https://github.com/eco-i/eco-i.github.io/actions/runs/38398742914): DOM에 이전 민감정보 잔존 및 PIN 상태 캐시 미삭제.
- 수정: `handleSharedSessionStorageChange`에서 PC 로그인 유지 키의 cross-tab `storage` 이벤트를 명시적으로 다룸. 권한이 철회됐으면 `clearDeferredAdminDraftUnlockProof()` 및 `applyAccountModeUI` 경로로 관리자 민감 UI·캐시 삭제, 사용자 로그인 토큰 자체는 유지.
- 실제 Chrome GREEN [#38398920657](https://github.com/eco-i/eco-i.github.io/actions/runs/38398920657): **9 PASS/0 FAIL**. 기존 두 탭 민감 화면·네이티브 확인창 회귀 [#38398920653](https://github.com/eco-i/eco-i.github.io/actions/runs/38398920653): **18+18 PASS/0 FAIL**.
- 두 신규 결함은 서로 다른 원인인 **권한 판정(①)** 과 **렌더된 민감 UI 갱신 누락(②)** 으로 각각 1종씩 집계. 여러 Chrome assertion 실패나 수정 뒤 과거 SHA를 요구한 테스트 도구 실패를 별도 제품 결함에 더하지 않음.

## High·깊이8 회귀 및 무결성
- 동일한 최종 SHA `9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0` 실제 Chromium 전체 8계층 **212 PASS / 0 FAIL × 3회**:
  - [#38399063267](https://github.com/eco-i/eco-i.github.io/actions/runs/38399063267)
  - [#38399397943](https://github.com/eco-i/eco-i.github.io/actions/runs/38399397943)
  - [#38399407162](https://github.com/eco-i/eco-i.github.io/actions/runs/38399407162) (별도 독립 워크플로에서 소스 무결성 + 전체 Chrome 반복)
- 기존 4조2교대 2,920개 날짜 조합, 2026년 대정비, 연차 500 fuzz·자정 경계, Web Locks 실제 다중 탭, 지문사진·메모·백업 검증, PIN·세션/관리자 권한, 31일 캘린더·320~1440px 화면폭 포함.
- 독립 원본 대비 소스 변경 정확히 **2 diff hunks**, SHA/바이트 고정, inline JS 2개 파싱, 고유 DOM ID 457개 [#38399075837](https://github.com/eco-i/eco-i.github.io/actions/runs/38399075837), [#38399407162](https://github.com/eco-i/eco-i.github.io/actions/runs/38399407162).

## 한계와 다음
- 실제 Supabase 인증/SQL/RLS/운영 다중 사용자, 실제 Android 카메라/파일 선택기, iOS Safari, persisted BFCache, 운영 백업/복원은 이번 블록에서 검증하지 않음. 네트워크 RPC는 Chrome stub이고, 클라이언트 차단은 서버측 권한 검증의 대체가 아님.
- 다음 시작 **2-8-249**, `qa-handoff/index.before-2-8-249.html`. High·깊이8·블록당 20분 이상 실제 검수·20분 내 중간 보고·오류 즉시 수정 및 Chrome 회귀·순번 연속. 사용자 승인 없이 APP_VERSION/SQL/main/운영 배포 변경하지 말 것. ZIP 불필요, GitHub 직접 사용.
