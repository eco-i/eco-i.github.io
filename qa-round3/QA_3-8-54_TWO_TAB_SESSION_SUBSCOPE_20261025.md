# 근무모아 3차·깊이8 — 같은 출처 PC 2탭 세션 실브라우저 검수 (2026-10-25 KST)

> **공식 3-8-54 미시작 / 전체 NOT CLEAN / 운영 배포 보류**. 이 문서는 P0 중 *PC 2탭 세션 저장 경계*에 한정한 새 Chromium 실증이다. 관리자 2명 CAS/실제 Supabase E2E 합격 판정 아님.

## 실제 GitHub 증거
- **최종 성공**: [GitHub Actions Run 40156466192](https://github.com/eco-i/eco-i.github.io/actions/runs/40156466192), job `121058814487`, `TWO_TAB_PASS` **14개**, 실패 **0**, 최종 `TWO_TAB_SCOPED_PASS`.
- 최종 검수 커밋: [`57643533ef9e7f8c36e3c81402cab4f5ec30dfa6`](https://github.com/eco-i/eco-i.github.io/commit/57643533ef9e7f8c36e3c81402cab4f5ec30dfa6).
- 신규 자동검수: `.github/workflows/workmoa-qa-two-tab-session-browser.yml`.
- Chromium test: `qa-round3/e2e/ci/browser-two-tab-session-handoff.py`.
- 실제 검수 대상: `qa-3-8`의 완전한 QA `index.html` 로드, 동일 브라우저 컨텍스트의 **같은 출처 2개 탭**, PC 탭별 세션 저장과 '로그인 유지' 로컬 저장, 화면/로그인 상태, 비동기 로그아웃 정리.
- 서버 측: **실제 운영 서버가 아닌** 가짜 employee 로그인, 가짜 인증 응답, loopback-only HTTP RPC gateway 및 폐기형 synthetic PostgreSQL. 운영 SQL 복원/초기화/관리자 3 RPC는 실험하지 않음. 모든 외부 통신은 브라우저에서 차단.

## 14개 확인 항목
1. A 탭의 PC 세션 전용 로그인에서 토큰이 `sessionStorage`에만 존재함
2. 새 B 탭이 A의 탭 전용 토큰을 자동 상속하지 않음
3. B의 독립 로그인은 A와 서로 다른 세션 토큰을 획득함
4. B 로그인 직후에도 A의 기존 로그인과 표시 화면 유지
5. A 로그아웃이 별도 토큰으로 로그인한 B를 삭제/로그아웃하지 않음
6. 각각 로그아웃 후 탭 전용 세션 값이 남지 않음
7. A 재로그인은 탭 전용 모드 유지
8. B의 로그인 유지 선택은 공유 저장소에만 반영됨
9. B의 로그인 유지 설정이 A의 독립 탭 세션을 덮어쓰지 않음
10. B 공유 로그인 로그아웃은 독립 A 탭의 현재 인증 상태를 파괴하지 않음
11. B 공유 토큰 삭제 후 잔존 공유 자격증명 없음
12. 마지막 A 탭 로그아웃 후 자격증명 없음
13. 실제 호스팅 Supabase로 브라우저 네트워크 요청 0
14. 근태 DB 쓰기/관리자 복원·초기화 RPC 실행 0

## 최초 실패를 정직하게 구분
- 첫 시도 [Run 40156344542](https://github.com/eco-i/eco-i.github.io/actions/runs/40156344542)는 초기 네 조건 PASS 후, A 로그아웃 시 B를 유지하는 기대 조건에서 실패.
- 분석: 처음의 합성 로그인 서버가 **두 개의 별개 로그인에 동일한 토큰을 무조건 반환**함. 앱은 동일 토큰을 공동으로 로그아웃/차단하려 하므로 독립 로그인 상황을 올바르게 모델링하지 못한 테스트 fixture 오류. 이를 운영 앱 결함이라고 단정하지 않음.
- 이후 가짜 서버가 서로 다른 독립 로그인에 서로 다른 synthetic 세션 토큰을 반환하도록 수정. 같은 출처 실제 두 탭에서 **14/14 성공**. 운영 제품 코드나 DB 수정 없음.

## 공식 3-8-54 진입 조건 중 어디까지 왔나
| P0 세션 영역 | 이번 시험 | 남은 실증 |
|---|---|---|
| PC 탭 전용 로그인/별도 탭/로그아웃 분리 | **14개 한정 PASS** | 원본 Supabase Auth/세션 토큰 발행 아님 |
| PC 로그인 유지 모드 vs 탭 전용 모드 | **합성 직원의 실제 Chromium UI PASS** | 실제 로그인 유지 복구/권한 만료/서버 거부 재연결 |
| 관리자인 두 계정의 로그인/관리자 PIN/권한 회수 | **미검증** | 두 실제 독립 QA 관리자, 관리자 보조 인증, role down |
| Web Locks 지연/사용 불가, 구버전/신버전 탭 혼재 | **미검증** | 별도 지연·우회 불가능한 격리 브라우저 시험 |
| 인사관리 공유 revision CAS, DB·RLS/권한 경쟁 | **미검증** | 정본과 동등한 독립 QA PostgreSQL/Supabase 함수, 두 관리자 동시 클릭, 엄격한 사전·사후 상태 검사 |
| Android/iOS/PWA, 물리 네이티브 사진 선택기 | **미검증** | 실제 기기와 QA 전용 백엔드 |

## 불변의 안전·진행상태
- 운영 `main` HEAD `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb` 재확인; 변경 0.
- 실제 직원 DB·인증·지문 정보 및 운영 Supabase 접근/변경 0. RPC 복구 인계는 **23/26(88.5%)** 유지; `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2`는 지원센터 조사 결과 전까지 실행/권한 변경 금지.
- 마지막 공식 3차 완료 **3-8-53** / 다음 **3-8-54 미시작** / 기존 3차 신규 결함 **37종** / 전체 **NOT CLEAN**.
- 무의미한 합성 재검수 반복 대신 다음 단계는 관리자 역할 분리·실제 QA 서버 원본 동등성을 확인한 뒤 P0 E2E를 선별해 수행.
