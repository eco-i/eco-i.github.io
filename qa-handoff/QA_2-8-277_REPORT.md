# 근무모아 2차·깊이 8 종합검수 — 2-8-277

**공식 판정: COMPLETE/CLEAN (Chromium 실브라우저·모의 RPC 검증 범위). 다음 2-8-278. 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이 8 · 실제 20분 이상 13/13 SUCCESS
- [GitHub Actions 277 최종 실행](https://github.com/eco-i/eco-i.github.io/actions/runs/38902439306) **13/13 Jobs 모두 SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync, modal-privacy, badge-calendar.
- 같은 불변 소스 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`로 **실제 1318초(21분 58초)** 반복검수, **8회 × 23종 = 184묶음 PASS / 0 FAIL**. 증빙 `QA277_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1318`.
- 277 신규 실제 Chrome PC/모바일 × 한국/UTC/LA 총 6환경에서 **2026~2027년 730개 날짜 × 지문 6개 사진·확인 상태**, 달력 '사진 없음 / 1장 / 2장 / ✓ 확인완료' CSS/텍스트/aria-label/옆 날짜 영향 차단/비정상 키 값 처리 **205,884 PASS / 0 FAIL**. 단말 가상화이며 실제 Android/iOS 앱의 물리 카메라를 테스트하지 않음.
- 기존 276 민감정보 정리 **1,326 PASS**, 275 사진 보기 동기화 **10,518 PASS**, 274 optimistic 업로드 메타 **5,850 PASS**, 273 실제 Chrome file picker 이벤트 **180 PASS**, 272 RPC 경계 **498 PASS**, 271 2탭 세션/재로그인 **168 PASS**, 인계 SHA/스크립트 파싱 **15 PASS**, 모두 0 FAIL.
- 기존 독립 2년 교대·대정비 시프트 전이 **30,606 PASS**, 날짜 속성 **26,430 PASS**, 지문 날짜 **21,930 PASS**, UI/월별 뷰 **1,401 PASS**, 브라우저 경계 **765 PASS**, 이미지 코덱 **474 PASS**, 세션 가드 **60 PASS** 등 기존 종합 회귀 포함.
- 다중 탭 Job은 276의 초기 시간초과 문제를 고려해 `needs: independent` 이후 실행되도록 순서 조정했으며, 이번 [277 실행](https://github.com/eco-i/eco-i.github.io/actions/runs/38902439306)은 재실행 없이 **SUCCESS**.

## 검수 범위·과거 이력
- **이번 신규 확정 제품 결함 0종**, 제품 `index.html` 본체 수정 없음. QA 검수 스크립트·워크플로·인계 문서만 `qa-2-8`에 기록.
- 과거 QA 실패/예외 보존: 265 raw localStorage SESSION_KEY 직접 삭제 후 tombstone 누락 간헐 QA 예외; 270 picker 초기 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 처음 preflight 버전 참조 오류, 초기 modal oracle 78 RED 및 cross-tab 취소 후 성공적인 단일 작업 재검수. 역사적 실패 지우거나 성공으로 소급 처리하지 않음.
- 미검증 영역: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native camera/file picker, 영속 BFCache, 운영 DB 실제 백업·복원은 직접 미검증.

## 278 무결성 인계·운영 보호
- `index.html`, 277 시작/작업본, `qa-handoff/index.before-2-8-278.html` **1,175,136 bytes**, 동일 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`.
- 운영 `main` 커밋 `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 인계 2026-10-16T22:06:40.680+09:00; 다음 **2-8-278**, High·깊이8·블록별 실제 20분 이상·20분 안 KST 진행보고·오류 즉시 수정+회귀. ZIP 사용 금지, main/SQL/APP_VERSION/배포 무단 변경 금지.
