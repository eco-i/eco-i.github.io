# 근무모아 ver20261018-2313 · 개인 메모 저장 후 닫기 미저장 경고 점검

- 확인일: 2026-10-22 (KST)
- 사용자 관찰: 메모 작성 → 저장 클릭 → 닫기 클릭 시 `저장하지 않은 내용이 있습니다. 닫을까요?` 표시
- 상태: **운영 서버 저장 RPC 누락 확인 / QA UI 오류 표시 보강 완료 / 운영 오류 해결 미완료**
- 배포 보호: 운영 `main`, 실제 직원 DB, RPC, 권한/SQL, 배포 변경 **0**

## 원인 판별

1. GitHub `main`·`qa-3-8` `version.json`은 `ver20261018-2313`. 운영 `main/index.html`의 `saveSelectedDateMemo()`는 `save_my_memo_v2(p_token,p_date,p_text,p_expected)`를 호출.
2. 사용자 서비스 운영 Supabase에 대해 **읽기 전용 `pg_catalog.pg_proc`** 함수 서명 조회: `list_my_memos`·기존 `save_my_memo(p_token,p_date,p_text)`는 있고 **`save_my_memo_v2`는 없음**. 실제 사용자 메모 행, 세션 토큰, 지문·근태·인증정보 조회 0. 운영 DDL/RPC 호출 0. 따라서 구성된 앱에서 최신 v2 저장을 호출하면 저장 불가. 원본 사용자가 실제 저장 성공 토스트를 보았는지는 미확인이라 '그 세션의 정확한 HTTP 원인'까지 단정할 수 없으나, 운영 코드/서버 계약 불일치라는 확정 결함은 존재.
3. `main`은 저장 실패 `catch`에서 `memoDetailError`를 쓰지만, 이후 `finally`의 `syncOpenDetailPermissionsPreservingDraft()`가 정상권한일 때 그 문구를 덮어 지우는 경로가 있음. QA에는 이전 깊이8 수정으로 이 정상권한 오류문구 보존이 이미 반영되어 있음.
4. `detailDraftBaseline.memo`는 정상 저장 이후 `loadMonthMemos()`로 재조회 성공 시 `renderMemoDetail()`/`captureDetailDraftBaseline('memo')`에 의해 지워짐. 저장 RPC가 실패하면 baseline을 지우지 않으므로 **닫기 경고는 작성 내용 보호를 위해 정당함**. 임의로 경고·dirty 값을 해제하면 메모가 사라질 수 있음.
5. 구버전 `save_my_memo`로 자동 폴백 금지: 신규 버전의 `p_expected` CAS/경합 안전 계약을 우회하고 동일 작성/삭제 충돌 보장을 깨뜨릴 수 있음.

## 이번 QA-only 패치

- `qa-3-8/index.html`의 **메모 저장 실패 `catch`에만** `isMissingRpcEndpointError(e)` 분기 추가: SQLSTATE/PGRST `PGRST202` 등 RPC 부재 시 **서버 기능 없음 · 실제 미저장 · 작성 초안 보존**을 한국어 본문과 토스트로 표시.
- 타 항목·운영 파일·미저장 확인창 자체·정상 저장 성공 path·서버 SQL 변경 없음.
- SHA/commit: [`ffd5bac9214bccd7a2e369366548c2124c678ab5`](https://github.com/eco-i/eco-i.github.io/commit/ffd5bac9214bccd7a2e369366548c2124c678ab5)
- 회귀시험 `qa-round3/tests/memo-save-missing-rpc.test.cjs` (synthetic VM DOM + stub RPC 3가지) 및 별도 qa-3-8 GitHub Actions workflow.
- [GitHub Actions Run 39731183694](https://github.com/eco-i/eco-i.github.io/actions/runs/39731183694), job `119666353415` **3/3 PASS**:
  - missing `PGRST202` 저장 호출→문구 표시/토스트, 사용자 텍스트·dirty baseline 보존, 성공 메시지 금지
  - 다른 저장 실패→초안 보존, 성공 메시지 금지
  - 명시적 true 저장 + 권한 있는 원본 재조회 성공→메모 화면 텍스트와 baseline 동일, 성공 메시지 표시
- 기존 live RPC 카탈로그 안전 게이트 [Run 39731183593](https://github.com/eco-i/eco-i.github.io/actions/runs/39731183593)는 `EXPECTED_RELEASE_BLOCK: 26 unresolved live-server RPC name gaps / 31 callsites; no deployment approval`로 **예상된 FAIL CLOSED**. 이를 '자동 테스트 전부 PASS'로 보고하지 않음.
- 실제 운영 사용자의 재현 스텝에 대한 real Supabase Auth/RLS/실브라우저 E2E는 미실시, 테스트는 합성 함수 내부/DOM 상태 테스트. 운영 버전 자체는 미수정.

## 다음 작업 및 우선순위

- 메모 저장 기능의 **실질 복구**는 공개 사이트에서 경고문구를 없애는 조치가 아니라 비공개 서버의 `save_my_memo_v2` **운영 정합성·보안·트랜잭션/CAS 검증**과 안전한 배포·롤백 승인이 필요.
- 비공개 메모 3종은 기존 합성 PostgreSQL/PostgREST/RLS 시험을 통과한 개발 후보이나 현재 서버에 설치된 것은 아님. 전용 검증 게이트와 최종 운영 반영 승인을 별도로 거쳐야 함. 미승인 상태에서 기존 `save_my_memo` fallback 및 서버 설치 금지.
- 사용자에게는 '저장'을 눌렀다고 완료된 것으로 보지 말고, 저장 성공·재조회 확정 전까지 메모 내용을 별도 복사해 안전하게 보관하도록 안내.
- 공식 블록 **3-8-53 마지막 완료 / 3-8-54 보류 / 결함 집계 37종 유지 / 전체 NOT CLEAN**. 이미 집계된 RPC 누락 건과 중복으로 신규 제품 결함 수를 임의 증가시키지 않음.
