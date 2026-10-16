# 근무모아 2차·깊이 8 종합검수 — 2-8-272

**공식 판정 2-8-272 COMPLETE/CLEAN (검증한 실제 Chromium·모의 RPC 범위). 다음 2-8-273, 신규 확정 제품 결함 0종, 누적 540종.**

## High · 깊이 8 · 실제 20분 이상
- [공식 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38867133983) **8/8 Jobs 전부 SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary.
- 동일 불변 기준 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`를 실제 Chromium headless PC/mobile에서 **1236초 (20분 36초)** 지속검수. **8회 × 23개 = 184묶음 PASS, 0 FAIL**. 증빙 로그 `QA272_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1236`.
- **272 신규 독립 지문 RPC fail-closed 검사:** 6개 Chrome 환경(PC/모바일×서울·UTC·LA), 날짜 유효성/윤년·중복/범위·확정·사진 업로드 플래그/타임스탬프 왜곡/서로 다른 시각대 동일 순간 검증 **498 PASS / 0 FAIL**.
- 271 신규 다중 탭 세션 폐기·사진 선택 컨텍스트·취소 정리·KST 날짜 경계 재검수 **168 PASS / 0 FAIL**.
- 독립 2개년 교대·대정비 패턴 **30,606 PASS**, 날짜 **26,430 PASS**, 지문 일자 **21,930 PASS**, 모바일 UI·달력 월뷰 **1,401 PASS**, 시간대·브라우저 경계 **765 PASS**, 이미지 **474 PASS**, 세션 **60 PASS**, 모두 0 FAIL. 무결성 예비검사 **15 PASS / 0 FAIL**.
- 전체·백엔드·프런트엔드 23개 반복 회귀 스위트에서 사진 선택, 세션/권한, 인사/연차, 대정비·초과근무, RPC, 데이터 백업·복원 모의 및 각종 UI 경계 확인. 실물 OS picker가 아닌 Chromium 에뮬레이션만 검증.

## 원본 예외와 미검증 범위 보존
- 이번 확인에서 **신규 확정 제품 결함 0종**으로 `index.html`을 수정하지 않았음. GitHub QA 전용 테스트·검수 기록만 추가.
- **265 레거시 예외 유지:** 정상 logout의 공유 세션 폐기 표식을 생략하고 raw localStorage SESSION_KEY를 직접 삭제하는 실험에서 나타난 간헐 QA 실패 이력은 제거하거나 완전 해결로 보고하지 않는다.
- **270 초기 picker QA 하네스의 비동기 초기화/세션 누락 RED 이력 역시 보존**하고, 이후의 성공과 구분한다.
- 직접 미검증: 실운영 Supabase/RLS 실계정 다중 사용자, 물리 Android/iOS native picker/카메라, 영속 BFCache, 운영 DB 백업/복원.

## 형상 및 273 인계
- `index.html`, 272 시작/작업본, 273 시작본 모두 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes로 동일. APP_VERSION `ver20260927-0944` 유지.
- 운영 main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경 없음, 운영 배포 없음. 이 보고서는 QA 환경에서 확인한 범위를 넘어 실운영 무결함을 보증하지 않는다.
- 2026-10-16T16:47:55.373+09:00 공식 승격. 273도 High·깊이8·실제 20분+·20분 내 KST 진행 보고·발견 즉시 수정/RED-GREEN 회귀, ZIP 금지, main/SQL/APP_VERSION/운영 배포 임의 변경 금지.
