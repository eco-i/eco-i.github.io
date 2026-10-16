# 근무모아 2차·깊이 8 종합검수 — 2-8-279

**공식 판정: COMPLETE/CLEAN (실제 검증된 Chromium·모의 RPC 범위). 다음 2-8-280, 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이8 · 실제 20분 이상 · 전체 15/15 SUCCESS
- [279 GitHub Actions 검수 증빙](https://github.com/eco-i/eco-i.github.io/actions/runs/38927474536) **15/15 Jobs SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync, modal-privacy, badge-calendar, rpc-row-matrix, longservice-exclusion.
- 동일 제품 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`에 대해 **실제 1242초(20분 42초)** 지속검수, **9회 × 23종 = 207묶음 PASS / 0 FAIL**. 최종 로그: `QA279_SOAK_FINAL_PASS rounds=9 suites=207 actual_seconds=1242`.
- 279 신규 독립 검사 `QA_279_LONGSERVICE_EXCLUSION_MATRIX.cjs`: 실제 Chrome PC·모바일 × 한국/UTC/LA의 **6개 브라우저 환경**, 2026~2027년 **730일×입사일 3조건×제외기간 12시나리오**. 휴직·장기재직 인정 제외기간이 중첩·인접·연도跨越, 유효/무효 날짜, 윤일 2/29 입사, 기간 정렬·합집합, 비파괴 값 계산, 제외 일수의 독립 Set 오라클, 인정기간 날짜 산출을 실제 앱 함수와 대조. **636,354 PASS / 0 FAIL**.
- 이전 278 지문 RPC 메타 strict validation **245,406 PASS**, 277 달력 지문 아이콘 **205,884 PASS**, 276 민감 PIN/모달 폐기 **1,326 PASS**, 275 사진 보기 변경 동기화 **10,518 PASS**, 274 fingerprint optimistic hint **5,850 PASS**, 273 사진 picker **180 PASS**, 272 RPC 경계 **498 PASS**, 271 다중 탭 **168 PASS**, source 무결성 **15 PASS** 모두 0 FAIL.
- 교대·대정비 근무, 장기재직·연차, 인사, 초과근무·휴일, 관리자 권한, 업로드·뷰어, 세션·백업·복원·시간대·브라우저 동작 등 기존 23종 심층 회귀 스위트 9회 반복. 다중 탭 검사는 `needs: independent` 이후 실행하여 정상 SUCCESS.

## 확정 결함 및 검증 한계
- 이번 확정 제품 결함 **0종**, `index.html` 제품 코드 수정 없음. QA 스크립트·워크플로·검수 기록만 qa-2-8 브랜치에 추가함.
- 초기 실패/제약 이력 보존: 265 raw localStorage SESSION_KEY 직접 삭제와 로그아웃 tombstone 누락의 간헐 QA 실패; 270 초기 picker 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 preflight 이전 번호 참조, modal oracle 78 RED 및 초회 cross-tab 제한시간 취소 후 단일 Job 재검증으로 복구. 초기 실패 이력 삭제 금지.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native picker/카메라, 영속 BFCache, 실운영 DB 백업·복원은 직접 검증하지 않음.

## 280 시작본 공식 인계 및 운영 보호
- 제품 `index.html`, 279 시작/작업본, `qa-handoff/index.before-2-8-280.html` 모두 **1,175,136 bytes**, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 동일.
- main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 인계 기록 2026-10-17T01:15:10.409+09:00. 다음 **2-8-280** 역시 High·깊이8·실제20분 이상 검수·20분 이내 KST 중간보고·문제 발견 즉시 수정/회귀, GitHub 직접, ZIP 금지, main/SQL/APP_VERSION/배포 임의 변경 금지.
