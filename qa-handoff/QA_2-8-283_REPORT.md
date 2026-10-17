# 근무모아 2차·깊이 8단계 종합검수 — 2-8-283

**공식 판정: COMPLETE/CLEAN (실제 Chromium·모의 RPC 검증 범위). 다음 2-8-284, 신규 확정 제품 결함 0종, 공식 누적 540종.**

## High·깊이 8·실제 20분 이상
- [283 GitHub Actions 전체 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38998568240) **19/19 Job SUCCESS (첫 시도)**: picker-lifecycle, fingerprint-hint, badge-calendar, rpc-row-matrix, rpc-boundary, backend, viewer-sync, depth-eight, independent, longservice-exclusion, exclusion-permutation, longservice-band, frontend, full, integrity, modal-privacy, shift-holiday-oracle, timestamp-matrix, cross-tab.
- 불변 제품 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` 기준 실제 **1249초 (20분 49초)** 지속검사, **8회 × 23종 = 184묶음 PASS / 0 FAIL**. 최종 로그 `QA283_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1249`.
- 283 신규 독립 `QA_283_SHIFT_HOLIDAY_ORACLE.cjs`: 실제 Chrome PC/모바일 × 한국·UTC·LA 시간대 **6환경**, **2026~2027 730일**, 2026-09-01 기준 네 조의 독립 8일 근무주기, 대정비 10/1~10/15 주2·휴·C조 10/15 야 예외, 휴일 데이터(46일)·대체공휴일(11일) 기준, 24개월씩 실제 달력 DOM 렌더·폭 검사 대조. **57,222 PASS / 0 FAIL**. 소스 정의 공휴일 표와의 일관성을 검사한 것이며, 정부 실제 공휴일 사실 검증으로 확대 주장하지 않음.
- 282 타임스탬프 **988,956 PASS**, 281 제외기간 순열 **658,206 PASS**, 280 장기재직 구간 **1,734,246 PASS**, 279 제외기간 **636,354 PASS**, 278 RPC행 **245,406 PASS**, 277 지문 달력 **205,884 PASS**, 276 민감정보 **1,326 PASS**, 275 뷰어 **10,518 PASS**, 274 optimistic **5,850 PASS**, 273 picker **180 PASS**, 272 RPC **498 PASS**, 271 원본 cross-tab **168 PASS / 0 FAIL**; 283 사전 무결성 **16 PASS / 0 FAIL**.
- 기본 23종 실브라우저·모의 RPC 전면 회귀를 8회 반복했고 개별 UI·모바일·권한·휴가·사진·세션·백업·복원 모의 범위를 유지. 19개 Job 모두 초기 시도에 SUCCESS.

## 결함 및 QA 이력
- 신규 확정 제품 결함 **0종**, 누적 **540종**. 제품 본체 HTML 변경 없음. 283 독립 테스트·CI 워크플로·인계 문서만 검수 브랜치에 반영.
- 과거 QA 실패 265 raw SESSION_KEY/tombstone, 270 picker 초기 RED, 273 2탭 하네스 취소, 276 preflight 참조·모달 오라클 78 RED·cross-tab timeout, 282 최초 cross-tab 페이지 navigation context destroyed RED는 모두 기존 원본 로그/보고서로 보존. 소급 SUCCESS 처리 또는 이력 삭제 금지.
- 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 기본 사진 선택·카메라, 장시간 BFCache, 운영 DB 백업·복원 직접 미검증. PC/모바일 Chromium 및 모의 RPC 범위 CLEAN.

## 무결성·운영 보호
- `index.html`, 283 시작/작업본, **284 시작본** 모두 **1,175,136 bytes**, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 일치.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 공식 인계 기록 KST 2026-10-17T12:45:50.597+09:00. 다음 284 역시 High·깊이8·실제 20분 이상·20분 이내 진행보고·독립검사 추가·확정 결함 즉시 수정 및 회귀, GitHub 직접 작업·ZIP 금지·main/SQL/버전/배포 무단 변경 금지.
