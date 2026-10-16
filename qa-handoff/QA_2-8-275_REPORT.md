# 근무모아 2차·깊이 8 종합검수 — 2-8-275

**공식 판정: 2-8-275 COMPLETE/CLEAN (실제 검증한 Chromium/모의 RPC 범위). 다음 2-8-276, 신규 확정 제품 결함 0종, 누적 540종.**

## High·깊이 8·실제 20분 지속검수
- [275 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38881172897) **11/11 Job SUCCESS**: depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync.
- 제품 SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` 그대로 **실제 1294초(21분 34초)** 지속검수, **10회 × 23종 = 230묶음 PASS/0 FAIL**, 종료 로그 `QA275_SOAK_FINAL_PASS rounds=10 suites=230 actual_seconds=1294`.
- 275 신규 독립: 실제 Chrome PC/mobile × 한국/UTC/LA **6환경**, 25개 날짜×출근/퇴근 사진×동일 시각/서로 다른 timezone/다른 사진 변화/확인 플래그/사진 변경/사진 삭제/일자 삭제/계정 전환/종류 누락/컨텍스트 없음에서 실제 `reconcileFingerprintViewerAfterSync()`·`closeBackdrop()`·이미지 src 폐기 확인. **10,518 PASS/0 FAIL**.
- 274 지문 optimistic 상태 갱신 31개 날짜·소수 마이크로초 낙관적 락 **5,850 PASS**, 273 실제 file-picker 이벤트·취소·세션 변경 **180 PASS**, 272 RPC 실패폐쇄·시간/날짜 경계 **498 PASS**, 271 2탭 세션 연동 **168 PASS**. 모두 0 FAIL.
- 기존 독립 2개년 교대/대정비 전이 **30,606 PASS**, 날짜 속성 **26,430 PASS**, 지문 일자 속성 **21,930 PASS**, UI/월별 216뷰 **1,401 PASS**, 브라우저 경계 **765 PASS**, 이미지 코덱 **474 PASS**, 세션 보호 **60 PASS**, 버전/SHA/JS 문법·기준 인계 **15 PASS**, 실패 0.
- full/backend/frontend 23개 반복 회귀 스위트에 근무/정비, 연차/인사, 권한, 초과근무, 사진 입력, 저장소·세션·백업·복원 모의/모바일/브라우저 반응까지 포함. 이 결과는 headless Chromium 및 모의 백엔드 한정이다.

## 제품 결함·QA 예외/직접 미검증
- 이번 검증에서 **신규 확정 제품 결함 0종**, 제품 `index.html` 수정 없음. 275 QA 스크립트/워크플로와 기록만 GitHub 검수 브랜치에 추가.
- **265 원본 레거시 예외**: raw localStorage `SESSION_KEY` 직접 삭제로 정상 logout 폐기 표식을 생략한 경우 발생한 간헐 QA 실패 이력은 유지하며 이번에 해결되었다고 주장하지 않음.
- **270 초기 picker/비동기 로그인 QA 하네스 RED** 및 **273 초기 두 탭 전면 picker 하네스 취소** 기록도 보존. 이후 성공으로 기존 실패를 소급 삭제하지 않음.
- 직접 미검증: 운영 Supabase/RLS 실제 인증 다중 사용자, 실물 Android/iOS OS 카메라/사진 선택, 지속 BFCache, 실운영 DB 백업·복원.

## 제품/배포 보호 및 276 기준본
- `index.html`, 275 시작/작업본 및 276 시작본 모두 Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, **1,175,136 bytes**. `APP_VERSION` `ver20260927-0944` 유지.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로, SQL 변경 없음, 운영 배포 없음.
- 인계 시점 2026-10-16T18:56:15.883+09:00. 다음 **2-8-276**은 기존 High·깊이8·실제 20분 이상 검수·20분 이내 KST 보고·발견 결함 즉시 수정+회귀 규칙 고정, ZIP 금지, GitHub 연결 사용. main/SQL/APP_VERSION/배포 임의 변경 금지.
