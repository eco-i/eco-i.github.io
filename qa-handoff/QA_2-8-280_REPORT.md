# 근무모아 2차·깊이 8단계 종합검수 — 2-8-280

**공식 판정: COMPLETE/CLEAN (실제 Chromium·모의 RPC 검증 범위). 다음 2-8-281, 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이8·실제 20분 이상
- [280 GitHub Actions 전체 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38933175903) **16/16 Job SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync, modal-privacy, badge-calendar, rpc-row-matrix, longservice-exclusion, longservice-band.
- 공식 불변 제품 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`을 기준으로 실제 **1238초(20분 38초)** 지속검사, **8회 × 23종 = 184묶음 PASS / 0 FAIL**. 최종 로그 `QA280_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1238`.
- **280 신규 독립 검증** `QA_280_LONGSERVICE_BAND_BOUNDARY.cjs`: 실제 Chrome PC/모바일 × 한국·UTC·미국 LA 시간대 6환경, **2026~2027년 730일 × 12개 입사일 × 4개 제외기간 조합**에서 인정근속 1/5/10/20/30년 경계, 생일/윤일 입사 특례, 장기재직휴가 5/10/15/25/30일, 분할횟수 1/2/3/5/6회, 구간 시작/종료, 다음 인정 기념일을 독립 날짜·기간 집합 산술과 대조. **1,734,246 PASS/0 FAIL**.
- 기존 279 장기재직 제외일수 **636,354 PASS**, 278 fingerprint RPC 행 **245,406 PASS**, 277 지문 달력 **205,884 PASS**, 276 PIN/모달 개인정보 삭제 **1,326 PASS**, 275 지문 사진 뷰어 동기화 **10,518 PASS**, 274 지문 optimistic update **5,850 PASS**, 273 picker **180 PASS**, 272 RPC 경계 **498 PASS**, 271 다중 탭 **168 PASS**, 공식 시작본 무결성 **15 PASS**, 전부 0 FAIL.
- 기존 23개 전면 회귀 스위트 8회 반복: 교대·대정비·복잡한 근무일, 인사·휴가, 연차·장기재직, 지문 업로드·뷰어, 권한·세션·다중 탭, 초과근무·휴일, 백업·복원 모의, 모바일 UI 및 다중 시간대 경계. 16개 작업 중 다중 탭은 independent 이후 순차 실행, 첫 시도에 SUCCESS.

## 제품 결함 및 검증 범위
- 신규 확정 제품 결함 **0종**, 누적 **540종**. 제품 본체 `index.html` 수정 없음; 검수 스크립트·워크플로·검수 결과만 QA 브랜치에 기록.
- 과거 QA 오류 및 제약 이력: 265의 raw SESSION_KEY 직접삭제 후 로그아웃 tombstone 누락 간헐 QA 실패, 270 초기 picker RED, 273 초기 2탭 picker 하네스 취소, 276 초기 preflight 참조 오류·모달 오라클 78 RED·초회 cross-tab 제한시간 취소 후 회복 기록 모두 보존. 소급 성공 처리나 이력 삭제 금지.
- 직접 미검증: 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 기본 사진 선택·카메라, 지속 BFCache, 운영 DB 백업·복원 직접 미검증. Chromium PC/모바일 에뮬레이션 및 모의 RPC 범위 한정.

## 무결성 인계·운영 보호
- `index.html`, 280 시작/작업본, 281 시작본 모두 **1,175,136 bytes**, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 일치.
- 운영 main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로, APP_VERSION `ver20260927-0944`, SQL 변경 없음, 운영 배포 없음.
- 공식 인계 2026-10-17T01:58:11.857+09:00. 다음 **2-8-281**에서도 High·깊이8·블록별 실제20분+·20분 내 KST 진행보고·확정 기술 결함 즉시 수정 및 관련 회귀, GitHub 직접 연결, ZIP 금지, main/SQL/APP_VERSION/배포 무단 변경 금지.
