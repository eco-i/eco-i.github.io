# 근무모아 3차·깊이8 — 3-8-31 공식 검수 보고서

## 판정
- **3-8-31 범위 한정 완료 — 제품 결함 2종 확인(QA 수정·격리 회귀 완료), CLEAN 판정 아님.** 신규 `3-8-31-001` medium, `3-8-31-002` low. **3차 누적 21종**, 2차 역사적 540종은 별도.
- **105/105 유효 검사 PASS** = 관리자 unlock 복구/스토리지 8 + 30번 `restoreSession` 회귀 15 + `enterApp` 단계별 부트스트랩 14 + PIN 팝업 지연 포커스 18 + 정적 소스/JS 구문/무결성 50.
- 원본 재현 실패는 유효 PASS에 포함하지 않음. 모두 실제 index.html 함수 본문을 분리해 가짜 Web Locks/RPC/DOM/타이머로 시험. 실로그인 전체 브라우저·물리 단말·2계정 서버 E2E와 동일하다는 뜻 아님.
- QA 변경 `index.html` blob `a6cc643cc1c7a39c0afdfa8b1790e116d324ff03`. `APP_VERSION ver20261018-2313` **유지**. 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 불변, 운영 SQL/DB 읽기·쓰기·배포 **0건**.

## 깊이8 수행 항목
1. **공식 인계 및 원격 기준본:** `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-30_REPORT.md` 직접 읽고 30 완료/31 시작/19종 및 QA 이전 HTML blob `8645c90182b9160951dde13e7249ca92dc43e373` 확인. GitHub 현재 main/qa head 분리 확인.
2. **관리자 unlock 지연 작업의 side effect:** `ensureAdminUnlockForRestoreWithScope`, `ensureAdminUnlockForRestore`, `revokeAdminUnlockForToken`, `clearAdminUnlockForSession`, `sessionIsPersistent`, `fingerprintCurrentSharedSessionMismatch` 원본 소스를 활용해 Web Locks 대기 후 새 계정으로 전환하는 격리 실행. 보호 없는 원본에서 새 tab admin proof 삭제 재현(이슈 001).
3. **인증 소유권 수정/회귀 8/8:** token/epoch 및 공유 스토리지 불일치 확인을 Lock 콜백 **안에서** 재검사. 안정 admin/non-admin, 새 tab·remembered·mobile 계정, 같은 토큰의 보안 세대 변경, admin handoff, storage event 지연 **8/8**. stale 작업은 내부 저장소 수정 전에 거절.
4. **3-8-30-001 선행 수정 회귀 15/15:** 실제 `restoreSession`의 local/normal server/forced PIN 3갈래 × 정상/토큰교체/epoch변경/토큰삭제/unlock 거부 총 15 조합. 이전 사용자 화면·초기 PIN 창 재진입 차단, 정상 사용자는 그대로 진입. 30번 소유권 가드 2곳 유지.
5. **`enterApp` 화면 진입 14/14:** 실제 부트스트랩 함수와 가짜 로더로 계정 상태/직원/월별 근태/회사일정 각 단계의 소유권 역전, 같은 토큰 새 epoch, 비활성/읽기전용, 부분 조회 실패, 사용 가이드/초기 PIN 안내 경로를 확인. stale 계정 화면 오염 없이 조기 종료. 관리자 권한의 실서버 동적 변경은 미검증.
6. **PIN 팝업 지연 초점 결함 002:** `openSelfPin` 50ms 및 `enterInitialPinGate` 40ms의 개별 타이머가 `topOpenBackdrop` 우선순위를 확인하지 않음을 원본 4가지 상황에서 실제 함수 모의 재현. QA에서 상단 모달 검사 및 입력 필드 수동 포커스 보존, 초기 자동 포커스 동작 유지. **18/18 격리 회귀 PASS** (mock 닫기 버튼 태그 분류를 바로잡은 후 최종 유효 수치).
7. **정적·구문·이전 패치 무결성 50/50:** QA/main sha 고정, JS inline 2개 파싱, `id="..."` 문자열 488개 중 중복 0개, 원본 30번 가드, 세션 만료/초기 PIN 강제 차단, Realtime/관리자 토큰/스토리지·모달 민감값 초기화/스택 포커스 소스 검사. 정적 PASS는 DOM 통합/보안 침투검사를 의미하지 않음.
8. **결함/보고/안전 판정:** 발견 이슈 2개, QA 코드 파일과 공식 상태/보고서/새 인계 파일만 저장. 실제 근태·직원·지문·감사 로그 행 조회/쓰기 0, Supabase 연결/SQL 실행 0, 운영 PWA 버전 변경 0. 전체 서비스 CLEAN 인증 아님.

## 다음 3-8-32 범위
- 지연 Web Locks 반환 결과와 login/restore 레이스에서 **관리자 표식 정리**가 호출되는 다른 경로, 동일 토큰 재로그인·logout tombstone, 실시간 반영·강제 PIN 팝업 중첩 관련 QA 함수/정적 심층 회귀.
- 전체 브라우저·물리 모바일·서버 실제 저장은 별도 격리 QA 계정/DB가 마련되지 않으면 계속 미검증으로 남길 것.

작성시각(KST): 2026-10-19T21:50:05+09:00
