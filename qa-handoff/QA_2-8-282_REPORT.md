# 근무모아 2차·깊이 8단계 종합검수 — 2-8-282

**공식 판정: COMPLETE/CLEAN (Chromium·모의 RPC 범위; 최초 QA 실패를 보존한 후 재현 및 회귀 검증). 다음 2-8-283. 신규 확정 제품 결함 0종, 누적 540종.**

## 실제 20분 이상·High·8단계
- [282 메인 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38996713788) **최종 18/18 Job SUCCESS (run attempt 2)**, 기본 23종 전면 회귀 8회 반복, **184묶음 PASS / 0 FAIL**, 실제 **1239초 (20분 39초)**. 로그: `QA282_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1239`.
- 282 신규 독립 `QA_282_FINGERPRINT_TIMESTAMP_MATRIX.cjs`: 730일(2026~2027) × UTC시각 등가·시간대 ±12~+14 × 소수초 5종 × Chrome PC/모바일, 한국·UTC·미국 LA 등 6컨텍스트에서 **988,956 PASS / 0 FAIL**. 정상 ISO 시각 비교 및 원자적 optimistic 지문 사진 상태변경의 stale timestamp 거부, 정확히 같은 시각의 다른 오프셋 허용을 독립 오라클과 대조.
- 281 제외기간 fuzz **658,206 PASS**, 280 재직 구간 **1,734,246 PASS**, 279 제외기간 **636,354 PASS**, 278 지문 RPC행 **245,406 PASS**, 277 지문 달력 **205,884 PASS**, 276 개인정보·모달 **1,326 PASS**, 275 뷰어 **10,518 PASS**, 274 optimistic **5,850 PASS**, 273 picker **180 PASS**, 272 RPC **498 PASS**, 271 다중 탭 원본 최종 **168 PASS**, 282 사전 무결성 **16 PASS**.

## 최초 QA 실패·회복 증거 (절대 삭제하지 않음)
- **메인 첫 시도(Attempt 1) cross-tab QA 149 PASS / 1 FAIL**. `QA_271_CROSS_TAB_SESSION.cjs` 47행에서 두 번째 탭 페이지 이동 중 `page.evaluate: Execution context was destroyed`; 5/6 프로필 후 QA 경합. [원본 실행 기록](https://github.com/eco-i/eco-i.github.io/actions/runs/38996713788)과 `QA_282_CROSS_TAB_INITIAL_FAILURE.json`에 보존, 소급 SUCCESS 불가.
- [별도 Chrome 다중 탭 복구](https://github.com/eco-i/eco-i.github.io/actions/runs/38997014183): 기존 의미 검증을 모두 유지하고 탐색 컨텍스트 파괴 상황에만 제한적으로 재시도 가능한 `QA_282_CROSS_TAB_LIFECYCLE.cjs` 두 차례 **174/174 PASS**, 모두 6컨텍스트, FAIL 0. 각 시도 retry 발생 없음.
- 메인 GitHub Actions에서 기존 원본 cross-tab Job만 재실행한 **Attempt 2 168 PASS / 0 FAIL, 6컨텍스트**; 최종 전체 18/18 SUCCESS. 독립 2회 및 원본 재실행에서 제품 오류 재현되지 않아 최초 문제는 **QA 페이지 이동 경합**으로 구분, 제품 결함으로 집계하지 않음.
- 265/270/273/276의 이전 QA 실패 기록 및 환경 예외 유지. 신규 제품 수정사항 없음.

## 운영 무변경·인계
- 제품 원본 `index.html`, 282 시작/작업본, 283 시작본 동일 **1,175,136 bytes**, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, `APP_VERSION` `ver20260927-0944` 유지, SQL 변경·운영 배포 없음.
- 미검증: 운영 Supabase/RLS 실제 인증 다중사용자, 물리 Android/iOS 사진선택·카메라, 장시간 BFCache, 운영 DB 백업·복원. Chrome/모의 RPC 범위의 CLEAN 이외 확대 주장 금지.
- 공식 GitHub 기록 시각 KST: 2026-10-17T12:18:46.401+09:00. 다음 283에도 High·깊이8·블록별 실제 20분+·20분 이내 KST 보고·독립검사 추가·실패 이력 보존·ZIP 금지 및 main/SQL/버전/배포 보호.

## 283 시작본 최종 인계 검사
- [282 post-promote GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38998301895) **14 PASS / 0 FAIL**, 실제 Chromium PC·모바일 360/390/1280px 부팅, 4개 제품 HTML SHA·바이트 무결성, 282 공식 상태·SHA 매니페스트, 두 JavaScript 구문을 재확인.
- 완료 확인 2026-10-17T12:19:52.220+09:00 KST. 최초 282 cross-tab 탐색 QA RED 기록 및 과거 265/270/273/276 예외 유지.
