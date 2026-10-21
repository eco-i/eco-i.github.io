# 근무모아 — 실제 Chromium 메모 저장 버튼 ↔ 누락 RPC 실패경로 검수 (2026-10-21)

> **후속 해결 정정 (2026-10-21):** 이 문서는 *당시 실패했던 검수 시점*의 기록이다. 이후 Playwright 요청 처리 대기 루프의 `time.sleep()` 블로킹 문제를 수정하자 버튼에서 실제 RPC 호출이 확인됐고, 앱의 `finally` 권한 UI 갱신이 서버 오류 안내를 지우는 별도 결함을 찾아 `qa-3-8`에서만 수정했다. [후속 PASS 증빙](MEMO_MISSING_RPC_ERROR_DISPLAY_FIX_VERIFIED_20261021.md) / [최신 확장 브라우저 PASS](https://github.com/eco-i/eco-i.github.io/actions/runs/39562765829). 운영 `main`·실제 DB 무변경이며 전체 E2E NOT CLEAN. 본문 이하의 'BLOCKED'는 이력을 설명할 뿐 현재 메모 음성 UI 검수 상태가 아니다.

> **최종 판정: FAIL / BLOCKED (실 UI → 누락 RPC 오류 수신 E2E 미완성).**
> 원인 확정 전 운영 사이트 결함이라고 단정하지 않는다. 테스트는 사용자 승인과 무관한 **운영 DB 액세스 0**, GitHub Actions의 일회용 가짜 DB와 가상 직원 UI만 활용했다.

## 이번에 실제 수행한 것
- `qa-3-8`에서 실제 근무모아 HTML/CSS/JS를 그대로 임시 로컬 QA 주소에 올리고, GitHub Actions Chromium으로 가상 직원 로그인.
- 로그인 후 실제 사용 안내창을 닫고 개인 메모 날짜를 열었으며, 빈 날짜의 자동 접힘 상태를 실제 토글 버튼으로 펼침.
- 실 UI의 개인 메모 textarea에 테스트용 문자열을 작성하고 실제 `저장` 버튼을 Chromium에서 클릭.
- 유일하게 허용한 네트워크: 일회용 루프백 `127.0.0.1`. DB는 일회용 PostgreSQL 16의 가상 `qa_memo_entries` 테이블. 직원 DB/운영 로그인/사진/실 Supabase·PostgREST·실 RLS·서비스 키·사용자 작업 데이터 접근 없음.
- QA 게이트웨이는 서버에 존재하지 않는 `save_my_memo_v2` 요청을 받으면 PostgREST형 **합성 PGRST202 404**를 반환하도록 만들었으며, PostgreSQL 합성 테이블 0건 조건을 시험 준비단계에서 확인했다.
- [작업용 CI](https://github.com/eco-i/eco-i.github.io/blob/qa-3-8/.github/workflows/workmoa-qa-missing-rpc-ui.yml) / [브라우저 검수 구현](https://github.com/eco-i/eco-i.github.io/blob/qa-3-8/qa-round3/e2e/ci/browser-missing-rpc-memo.py).

## GitHub Actions 실제 검수 이력 (재실행 결과 구분)
- [첫 시행 39545020444](https://github.com/eco-i/eco-i.github.io/actions/runs/39545020444): 가상 로그인과 DB 초기화 성공. 메모 섹션이 빈 날짜에는 **자동 접힘** 상태라서 버튼 노출·활성 검사가 실패. 테스트에서 토글로 실제 펼치도록 수정.
- [추가 검수 39545283512](https://github.com/eco-i/eco-i.github.io/actions/runs/39545283512): 버튼 활성/빈 합성 DB 확인까지 통과. **버튼 클릭으로 이어지는 서버 RPC가 발생하지 않음**. 메모 텍스트·편집창은 남아 있었으나 최종 저장 실패 UI 확인까지 진행하지 못함.
- [진단 39545678183](https://github.com/eco-i/eco-i.github.io/actions/runs/39545678183): 버튼 클릭 이벤트 자체는 1건 기록; 이후 별도 직접 함수 호출 시에는 합성 `save_my_memo_v2` RPC가 발생. **직접 함수 호출을 실제 버튼 E2E 성공으로 오인해선 안 됨**.
- [리스너 검증 39545925841](https://github.com/eco-i/eco-i.github.io/actions/runs/39545925841): Chromium CDP에서 버튼 `click` 리스너 설치 1개 확인, 실제 클릭 이벤트 1개 확인. 클릭 직후 업무 RPC 0, 12초 후 별도 함수 직접 호출 시만 요청 발생. 저장 대기·중간 계정/세션 리컨실리에이션 또는 UI 이벤트 실행 경로 문제를 **분리 진단해야 함**.
- 이후 검수 스크립트에서 **직접 함수 호출 진단을 제거하고 실제 버튼의 RPC 무호출을 명시적으로 `MISSING_RPC_UI_BUTTON_NOT_DISPATCHED` 실패로 처리**해 거짓 PASS를 차단. 이후 자동화 재실행에서 이 기준을 확인한다.

## 정확한 결론
- 확인 가능: 가상 직원 로그인 OK, 실제 메모 textarea 입력 OK, 저장 버튼 실제 click event OK, CDP click listener 설치 OK; 동일 테스트 시점의 브라우저 로그인 상태·메모 서버 준비상태·직원 인사/계정 쓰기가능 상태는 준비 완료로 보였음.
- 미확인: 실제 클릭 핸들러 미진행 원인이 소스 결함인지, 합성 QA 브리지·세션 복구/인사 변동 보호 흐름 특성인지. **따라서 운영 제품 신규 결함으로 바로 집계하지 않음**.
- 별도의 직접 함수 실행에서 가짜 RPC 404를 생성해본 것은 **진단에 불과**, 실제 버튼 E2E 성공 아님.
- 실제 운영 서버의 26개 함수 이름 불일치 및 31개 `rpc(...)` 소스 호출 사실은 **앞선 읽기 전용 실측과 독립적으로 계속 유효**.
- **최신 RPC 26개 서버 원본 미확보**. 운영에 구버전 함수 fallback 추가나 임의 SQL 구현/설치 금지.
- 이 작업은 3-8-54 공식 종료 실증을 대신하지 않는다. 실 직원/운영 DB/PIN/지문데이터 접근·수정 0, `main` 변경 0, 3차 결함 **37종 유지**, 공식 마지막 완료 `3-8-53`, 전체 NOT CLEAN.

## 다음 실질 진전 조건
1. 가짜 로그인/서버 상태와 실제 이벤트 핸들러 첫 실행 지점을 **동일한 순간에** 비교하여 click-handler guard의 조기 복귀 원인 분리. 검수 스크립트만 수정할 수 있고 제품 코드/정식 DB 조작은 금지.
2. 실 UI 이벤트 라우팅 문제와 별개로, 26종의 최신 SQL 원본/함수 시그니처·CAS 구현 정본을 안전한 비공개 경로에 확보한 다음 독립 QA DB로 E2E 확대.
3. 26개 릴리스 계약 mismatch의 CI **RED 차단은 유지**, 제품 테스트와 혼동해 GREEN으로 만들지 않음.
