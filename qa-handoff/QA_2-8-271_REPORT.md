# 근무모아 2차·깊이 8 종합검수 — 2-8-271

**공식 판정: 2-8-271 COMPLETE/CLEAN (실제 검증한 Chromium/모의 백엔드 범위), 다음 2-8-272. 신규 확정 독립 제품 결함 0종, 누적 540종.**

## High·깊이 8·실제 20분 지속검수
- [271 본검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38753524965) GitHub Actions **7/7 Job 모두 SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab.
- 동일 불변 기준 SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`에서 **실제 1211초(20분 11초)** 지속검수, **9회 × 23개 회귀 스위트 = 207묶음 PASS / 0 FAIL**. 로그 `QA271_SOAK_FINAL_PASS rounds=9 suites=207 actual_seconds=1211`.
- 신규 실제 Chrome PC/모바일 × 서울·UTC·LA 시간대 6개 환경에서 별개 동일 출처 탭의 정상 폐기 표식·지문 선택 중 세션 전환·재로그인·날짜/탭/actor/epoch 소유권·취소 청소·한국 자정 경계 **168 PASS/0 FAIL**. `QA271_CROSS_TAB_SESSION_SUMMARY`.
- SHA/270→271 공식 인계와 제품 JS 파싱·배포 제약 검증 **15 PASS/0 FAIL**. 독립 2개년 달력·대정비 교대 **30,606 PASS**, 730일 날짜 속성 **26,430 PASS**, 730일 지문 정합성 **21,930 PASS**, UI/월별 216뷰 **1,401 PASS**, 시간대/브라우저 경계 **765 PASS**, 이미지 변환 **474 PASS**, 세션보호 **60 PASS**. 모두 관측 실패 0.
- 기타 full/backend/frontend 기존 회귀(지문 RPC, 백업·복원, 연차, 근무, 초과근무, 인증·권한, 파일 선택 및 모바일)는 같은 SHA의 7개 Job 모두 성공으로 확인.

## 제품 결함·QA 예외 경계
- 신규 확인 제품 결함 **0종**. 본 검증에서 제품 `index.html`의 수정은 없어 RED/GREEN 제품 패치 없음. 독립 QA 스크립트와 워크플로만 추가.
- **265 예외 보존**: 레거시 하네스의 raw `SESSION_KEY` 직접 삭제(정상 logout의 토큰 폐기 마커를 생략)에서 발생한 간헐 실패는 원본 증빙을 유지. 정상 공유 로그아웃 순서의 회귀와 구별. 이번 271도 이를 무조건 해결됐다고 보고하지 않음.
- 270 신규 picker 하네스의 초기 로그인/비동기 초기화 미완성으로 발생한 실패 흔적도 `QA_2-8-270_REPORT.md`에 보존. [270의 추가 중복 지속검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38749151235)는 현재 **SUCCESS**로 별도 확인했지만 271의 검수시간이나 결함 수에 합산하지 않음.
- **직접 미검증**: 운영 Supabase/RLS 실계정 다중 사용자, 물리 Android/iOS OS native camera·file chooser, 영속 BFCache, 운영 DB 복원.

## 소스·배포 제약 및 다음 인계
- `index.html`, `qa-handoff/index.before-2-8-271.html`, `qa-handoff/index.working-2-8-271.html`, `qa-handoff/index.before-2-8-272.html` 모두 SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, 동일 Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL 변경 없음, 운영 배포 없음, APP_VERSION `ver20260927-0944` 유지.
- 인계 시점 2026-10-16T00:03:40.614+09:00. 271 공식 완료; 다음 **2-8-272**. High·깊이 8·20분 이상 실검수·20분 이내 KST 보고·결함 즉시 수정 및 회귀·ZIP 금지·운영 보호 규칙 지속.
