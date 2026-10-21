# 근무모아 — 휴일근무/초과근무 저장 실패 오류 안내 및 초안 보존 QA 검증 (2026-10-21)

> **검수 판정: 한정 범위 PASS** (원본 QA 화면의 실제 Chromium 클릭 + 가상 직원 + loopback 오류 응답 + 일회용 PostgreSQL 무쓰기 + readonly 권한 전환).
> **실제 Supabase Auth/PostgREST/RLS/CAS E2E 검증이 아님. 전체 3차 NOT CLEAN / 운영 배포 미승인.**

## A. 코드 분석에서 확인한 위험
1. `qa-3-8/index.html`의 `syncOpenDetailPermissionsPreservingDraft()`가 `holidayWorkError`를 권한 정상시 빈 텍스트로 덮어쓴다. `saveSelectedHolidayWork()`의 `catch/finally`에서 유의미한 실패 안내가 소거될 수 있다.
2. 초과근무 `saveOvertimeDay()`의 `finally`는 당시 `saveError`를 따로 백업·복원하여 즉시 소거를 일부 방어했지만, 이후 재권한 동기화 `syncOpenDetailPermissionsPreservingDraft()`에서는 `overtimeDetailError`를 계속 비웠다. 따라서 후속 UI refresh에서 경고가 사라질 수 있다.
3. **기능별 실패와 권한 제한은 별도 의미**다. 정상 권한이면 서버 실패 경고를 유지하되, readonly·인사최신성·서버상태 제한 시는 현재 제한을 우선 표시하고 Save를 잠근다. 그 상태에서 정상 복구되면 **권한 제한 안내만 지워야 한다**.
4. 안전성 범위를 최소화하기 위해 DB·RPC·CAS·인사/토큰/권한 판정·달력 날짜 계산을 수정하지 않았다.

## B. QA 제품 코드만 최소 수정
- 제품 수정: `qa-3-8/index.html`의 기존 `syncOpenDetailPermissionsPreservingDraft()` 내 **휴근/초과근무 오류 안내 2곳**. 이전 메모의 패턴과 동일한 `permissionMessage` 값 추적을 쓰되, 각 영역별 마지막 권한 안내 텍스트를 독립 저장하여 실제 서버 오류와 구분한다.
- 최초 커밋 `659947c29f108f4a2172fd6780b37a60770d3518`에 한 줄의 JS 문법 오류가 있어 가짜 로그인·근태 회귀검사가 실패했다. **원인을 즉시 확인해** `cf84a389ea9e04e7c3e7ae7b3fbe3b24331311b1`로 제거했다. 문제 있는 초안은 운영에 간 적 없으며, 수정 이후 기존 회귀검사가 모두 다시 성공했다.
- 검증 기준 QA HTML blob **`cc8df3e010234d87ef99b35e66d521ab18d96c4d`**. 실제 `main`과 실제 운영 Supabase 및 사용자 DB 미변경. QA용 새 브라우저 시험 스크립트·단일 합성 스키마 파일·전용 Actions workflow 추가.

## C. 실제 브라우저 검수 근거
- **[실제 버튼 음성 시험 최초 PASS — Actions 39564500467](https://github.com/eco-i/eco-i.github.io/actions/runs/39564500467)**:
  - 가짜 직원 로그인 → 2027-05-15 토요일 휴근 체크/기본시간 → 실제 `휴근 저장` 클릭. 합성 loopback API에서 `save_my_holiday_work_personnel_v2`에 **PGRST202 형식의 모의 404** 반환.
  - UI 저장 실패 문구 유지, 수동 권한 갱신 후에도 유지, 체크/시간 초안 유지, Save 재활성화, synthetic PG 쓰기 0.
  - 같은 브라우저에서 2027-05-13 초과근무 조출 실제 +10분 UI 버튼 → 실제 `저장` 클릭. `save_my_overtime_day_v2`에 **모의 `STALE_OVERTIME_DAY`/409** 반환.
  - 사용자에게 올바른 동시수정 안내 표시, 권한 재동기화 후에도 보존, 조출 10분 초안 유지, Save 재활성화, synthetic PG 쓰기 0.
  - 각 버튼은 정확히 1개씩 실제 RPC HTTP 요청을 발생시킴, 외부 Supabase 도메인 요청 0.
- **[권한잠금 확장 PASS — Actions 39564699553](https://github.com/eco-i/eco-i.github.io/actions/runs/39564699553)**:
  - 휴근/초과근무 모두 가짜 직원 계정 `readonly` 전환 → 저장 금지 안내 우선, Save 잠금, 초안 보존.
  - 다시 readonly 해제 → 이전 권한 안내만 제거, 저장 버튼 활성화와 기존 체크/시간/조출 10분 초안 복원.
  - 실제 운영 SQL/RLS/PostgREST 실행이 아니며 **UI 오류 안내와 로컬 synthetic 게이트웨이의 음성 동작만 실증**.
- 첫 전용 시험에서 잘못된 DOM 토글 ID·기존 숨김 닫기 버튼·중복 모달 닫기 버튼 셀렉터 문제로 실패한 이력은 **QA 하네스 오류**로 구분해 교정. 검수 도구 실패를 운영 제품 결함으로 오인하지 않는다.
- 수정된 제품 HTML에 대한 별도 기존 회귀검사 재통과:
  - [가짜 직원 로그인 Chromium — 39563935367](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935367) SUCCESS
  - [근태 폼 저장→가상 PostgreSQL — 39563935339](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935339) SUCCESS
  - [Chromium HTTP→가상 PostgreSQL — 39563935324](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935324) SUCCESS
  - [메모 저장실패 안내 — 39563935333](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935333) SUCCESS
  - [GitHub SQL provenance 감사 — 39563935320](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935320) SUCCESS
  - [운영 서버 26종 RPC 누락 배포 차단 — 39563935341](https://github.com/eco-i/eco-i.github.io/actions/runs/39563935341) **의도대로 FAILURE (RELEASE BLOCKED)**

## D. 남은 문제 / 엄격한 상태 고정
- 운영 서버는 여전히 최신 프런트 RPC 이름 80종 중 **26종이 없는 것으로 확인된 2026-10-21 읽기 전용 스냅샷**이며, 최소 31개 직접 호출 경로가 있다. 이번 QA 수정은 누락 함수를 복구한 것이 아니다.
- 구현 원본을 확보한 격리 환경에서 실제 인증/권한/RLS/동시성·2계정/PostgREST/지문·인사/근태 등 P0/P1 E2E가 필요하다.
- **공식 마지막 완료 `3-8-53` / 다음 `3-8-54` 미시작·보류 / 3차 누적 제품 결함 공식 `37종` 유지**. 발견한 오류 안내 UI 2개는 QA에서 수정·가상 브라우저로 실증했으나, 이 독립 실험으로 공식 결함 카운트와 블록 번호를 임의로 변경하지 않는다.
- `main`/Supabase 운영 스키마·실 직원 기록·지문·인증/PIN·운영 배포 변경 **0**, QA-only.
