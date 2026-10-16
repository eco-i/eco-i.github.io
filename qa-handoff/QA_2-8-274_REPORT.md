# 근무모아 2차·깊이 8 종합검수 — 2-8-274

**공식 판정 2-8-274 COMPLETE/CLEAN (검증된 Chromium/모의 백엔드 범위). 다음 2-8-275. 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이8·실제 20분 이상
- [274 최종 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38877682762) **10/10 Jobs SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint.
- 소스 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`에서 **실제 1266초(21분 06초)** 지속검수, **8회 × 23개 = 184묶음 PASS / 0 FAIL**. 종료 로그 `QA274_SOAK_FINAL_PASS rounds=8 suites=184 actual_seconds=1266`.
- 이번 새 Chromium 실제 브라우저 PC/모바일 × 한국·UTC·미국 LA 6환경에서 지문 갱신 `updated_at` compare-and-swap, 업로드 시각 동등 오프셋, 1마이크로초 차이 stale 차단, 31일 × 사진 출근/퇴근 × save/delete/confirm, 날짜 사이 레코드 불변식 및 빈 레코드/알 수 없는 action 거부 **5,850 PASS / 0 FAIL**.
- 기존 273 실브라우저 사진 선택 change/cancel/회복·권한/세션 변경 **180 PASS**, 272 지문 RPC 날짜/시간/필드 fail-closed **498 PASS**, 271 실제 두 탭 세션/사진선택 소유권 **168 PASS**. 모두 0 FAIL.
- 기존 독립 이중 검증: 2개년 교대·대정비 패턴 **30,606 PASS**, 날짜 속성 **26,430 PASS**, 지문 날짜/상태 **21,930 PASS**, 월별 UI **1,401 PASS**, 9개 Chrome 시간대/뷰포트 경계 **765 PASS**, 이미지 변환 **474 PASS**, 세션 가드 **60 PASS**. 소스 무결성·JS 구문·운영 보호 **15 PASS**. 모두 해당 검증 기준 실패 0.
- 전체/백엔드/프런트엔드 기존 회귀: 초과근무·휴일/대정비, 연차·인사, 관리자 권한, 사진 처리, 백업·복원 모의, 브라우저 사진 선택, 저장소/세션 보호, 모바일 UI, 날짜 경계 등을 23개 스위트로 반복 검증.

## 결함과 과거 QA 예외의 경계
- 신규 확정 제품 결함 **0종**; 실제 제품 `index.html`은 수정할 필요가 없어 동일 기준본으로 봉인. 제품/운영 배포와 구별해 새 QA 테스트 스크립트·워크플로·보고서만 검수 브랜치에 기록.
- **265 원본 레거시 예외 보존:** 정상 logout으로 생성되는 폐기 표식을 사용하지 않고 raw localStorage `SESSION_KEY`를 직접 지웠을 때의 간헐 QA 실패. 이번 검수가 이를 제품에서 완전 해결했다고 주장하지 않는다.
- **270 초기 비동기 picker 하네스 RED 기록 보존**. **273 초기 두 탭이 공유하는 picker 하네스의 foreground 경쟁/Jobs 취소 이력 보존**; 최종 분리 하네스가 성공했다는 사실과 이력 자체를 구분한다.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native 사진 선택/카메라, 장기 지속 BFCache, 운영 데이터베이스 실제 백업/복원.

## 봉인본·운영 보호·275 인계
- `index.html`, 274 시작/작업본 및 `qa-handoff/index.before-2-8-275.html` 모두 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경·운영 배포 없음, APP_VERSION `ver20260927-0944` 유지.
- 인계 2026-10-16T18:24:49.937+09:00, 다음 **2-8-275**. High·깊이8·최소 20분 실제 검수·20분 이내 KST 중간보고·결함 발견 시 즉시 수정+회귀, ZIP 금지, main/SQL/APP_VERSION/운영 배포 무단 변경 금지. 원본 증빙은 GitHub Actions/QA 인계 파일에 보존.
