# 근무모아 2차·깊이8 — 2-8-276 공식 종합검수

**판정: COMPLETE/CLEAN (실제 Chromium 및 모의 백엔드 검증 범위). 다음 2-8-277. 공식 누적 제품 결함 540종, 신규 확정 0종.**

## 20분 이상 실검수·최종 12/12 증빙
- [276 최종 Actions 실행 38887878278](https://github.com/eco-i/eco-i.github.io/actions/runs/38887878278) attempt 2, **12/12 Job SUCCESS**. 완료된 작업: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync, modal-privacy.
- [깊이8 반복회귀 로그](https://github.com/eco-i/eco-i.github.io/actions/runs/38887878278): **실제 1269초(21분 09초)**, **8회×23개=184묶음 PASS/0 FAIL**, `QA276_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1269`.
- 이번 신규 실제 Chromium PC/모바일×서울·UTC·LA 6환경에서 팝업 닫기 민감 값 삭제(5종 모달, 8개 내부 비밀번호), 페이지 이탈 대비 10개 입력 전체 정리, 관리자 복원 PIN 예외, 중첩 팝업 ARIA, 사진 보기 src/메타·맥락 폐기 **1,326 PASS / 0 FAIL**.
- 275 사진 보기 최신화 **10,518 PASS**, 274 지문 optimistic 저장·삭제·검증 **5,850 PASS**, 273 사진 선택 change/cancel·세션 가드 **180 PASS**, 272 RPC 경계 **498 PASS**, 271 별도 다중 탭 테스트 **168 PASS**, 인계 무결성 **15 PASS**, 전부 0 FAIL.
- 독립 2년치 교대·대정비 **30,606 PASS**, 날짜 **26,430 PASS**, 지문 날짜 **21,930 PASS**, 모바일·캘린더 UI **1,401 PASS**, 브라우저·시간대 **765 PASS**, 이미지 **474 PASS**, 세션 보호 **60 PASS** 등을 기존 및 독립 범위에서 확인.

## QA RED·취소 이력의 보존과 회복
- 최초 [run 38887644748](https://github.com/eco-i/eco-i.github.io/actions/runs/38887644748)의 QA preflight가 구버전 공식 274 참조로 실패한 기록을 보존. 제품 결함이 아님.
- 두 번째 [run 38887679888](https://github.com/eco-i/eco-i.github.io/actions/runs/38887679888)에서 새 모달 하네스가 실제 8개 입력을 9개라 가정하고 비동기 ARIA 갱신을 즉시 판정하여 **78 RED**. 테스트 오라클 수정 후 최종 1,326 PASS로 회복. 실패를 소급 삭제하지 않음.
- 최종 run 첫 시도에서는 cross-tab Job이 제한시간으로 **취소(미통과)**. 동일 run의 GitHub 단일 Job 재실행(attempt 2)에서 **168 PASS/0 FAIL**, 모든 12개 Job 최종 SUCCESS 확인. 취소 자체를 성공으로 표기하지 않음.
- 역사적 QA 예외: 265 직접 로컬 세션 키 삭제 후 표식 없는 로그아웃 QA 간헐 실패, 270 초기 사진 선택 QA 하네스 RED, 273 두 탭 전면선택 초기 QA 취소 기록. 276 첫 preflight 잘못된 번호 참조, 두번째 민감정보 검사에서 9개 필드 오인/비동기 ARIA 오라클 78 RED, 세번째 cross-tab 16분 제한 취소 후 단일 Job 재실행 168 PASS 기록 보존.
- 검증하지 않은 범위: 실운영 Supabase/RLS 실제 인증 다중 사용자, 실물 Android/iOS OS 사진 선택·카메라, 장기 BFCache, 운영 DB 백업/복원은 직접 테스트하지 않았음.

## 제품·운영 보호와 다음 인계
- `index.html`, 276 시작/작업본 및 277 시작본 전부 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes** 동일. 제품 본체 수정 없음.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경 없음, APP_VERSION `ver20260927-0944` 불변, 운영 배포 없음.
- 2026-10-16T19:56:18.365+09:00 공식 승격. 다음 2-8-277에서도 High·깊이8·20분 이상 실검수·20분 이내 KST 진행보고·기술 결함 즉시 수정+회귀, ZIP 금지, main/SQL/APP_VERSION/배포 임의 변경 금지.
