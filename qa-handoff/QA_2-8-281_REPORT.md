# 근무모아 2차·깊이 8단계 종합검수 — 2-8-281

**공식 판정: COMPLETE/CLEAN (실제 Chromium·모의 RPC 검증 범위). 다음 2-8-282, 신규 확정 제품 결함 0종, 공식 누적 540종.**

## High·깊이8·실제 20분 이상
- [281 GitHub Actions 전체 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38938332730) **17/17 Job SUCCESS**: integrity, depth-eight, badge-calendar, rpc-row-matrix, picker-lifecycle, exclusion-permutation, viewer-sync, modal-privacy, fingerprint-hint, rpc-boundary, backend, frontend, full, independent, longservice-band, longservice-exclusion, cross-tab.
- 불변 제품 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` 기준 실제 **1323초 (22분 03초)** 지속검사, **8회 × 23종 = 184묶음 PASS / 0 FAIL**. 최종 로그 `QA281_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1323`.
- 281 신규 독립 검증 `QA_281_EXCLUSION_PERMUTATION_FUZZ.cjs`: Chrome PC/모바일 × 한국·UTC·미국 LA **6환경**, 정해진 시드의 **63개 제외기간 구성 × 입사일 6개 × 92개 표본일자**, 중복·역순·연속·무효 기간 및 윤일 기념일, 최초 인정일, 인정근속, 입력 불변성을 독립 날짜 집합·이진 탐색 오라클로 비교. **658,206 PASS / 0 FAIL**. 최초 단독 검증과 통합 independent 작업 양쪽 모두 PASS.
- 기존 280 장기재직 구간 **1,734,246 PASS**, 279 제외기간 **636,354 PASS**, 278 지문 RPC행 **245,406 PASS**, 277 달력 표시 **205,884 PASS**, 276 민감정보 **1,326 PASS**, 275 뷰어 **10,518 PASS**, 274 optimistic **5,850 PASS**, 273 picker **180 PASS**, 272 RPC **498 PASS**, 271 cross-tab **168 PASS**, 281 사전 무결성 **16 PASS**, 모두 확인된 실패 0건.
- 기존 23개 회귀 스위트 반복 및 추가 독립 검사, UI·모바일·세션·권한·지문사진·휴가·백업 모의 검증 유지. 다중 탭 검사는 independent 의존성을 지켜 성공.

## 제품 결함·과거 QA 실패 보존
- 신규 확정 **제품 결함 0종**, 공식 누적 **540종**. 제품 HTML 수정 없음. 281 신규 QA 코드/워크플로 및 인계 기록만 qa-2-8 브랜치에 반영.
- 265 raw SESSION_KEY 삭제 후 tombstone 누락 간헐 QA 실패, 270 초기 picker RED, 273 초기 2탭 picker 하네스 취소, 276 초기 preflight 참조 오류·모달 오라클 78 RED·초회 cross-tab 제한시간 취소 이력 보존. 이전 실패를 소급 SUCCESS로 변경하거나 삭제하지 않음.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중사용자, 물리 Android/iOS 카메라·기본 파일 선택, 지속 BFCache, 운영 DB 백업·복원. Chrome 데스크톱/모바일 에뮬레이션 및 모의 RPC 범위에서만 CLEAN.

## 인계·운영 보호
- `index.html`, 281 시작/작업본, **282 시작본**은 모두 1,175,136 bytes / SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` / Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`로 동일.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경 없음, 운영 배포 없음.
- 공식 상태 기록 시각 KST 2026-10-17T02:39:55.731+09:00. 282도 High·깊이8·실제 20분 이상, 20분 이내 KST 보고, 신규 독립시나리오 추가, 모든 실패 이력 보존, GitHub 직접 작업, ZIP 금지.
