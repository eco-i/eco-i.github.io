# 근무모아 2차·깊이 8 종합검수 — 2-8-278

**공식 판정 COMPLETE/CLEAN — 실제 Chromium 및 모의 RPC 범위. 다음 2-8-279, 신규 제품 결함 0종, 누적 540종.**

## High·깊이8·실제 20분 이상
- [GitHub 278 14/14 Jobs SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38918174267). depth-eight, full, backend, frontend, independent, integrity, cross-tab, rpc-boundary, picker-lifecycle, fingerprint-hint, viewer-sync, modal-privacy, badge-calendar, rpc-row-matrix.
- 실제 **1216초(20분 16초)** 지속 회귀검사. **10회 × 23종 = 230묶음 PASS / 0 FAIL**. Action 종료 증빙 `QA278_SOAK_FINAL_PASS rounds=10 suites=230 actual_seconds=1216`.
- 이번 새 검사: 실제 Chromium PC/모바일 × 서울/UTC/LA 총 6환경에서 **2026~2027년 730일 지문 RPC metadata 상태**(사진 출퇴근 유무, confirmed/confirmed_at, updated_at, 날짜 범위, 중복 날짜, 비정상 서버 시각, boolean 형식 및 원본 레코드 불변성) 검증 **245,406 PASS / 0 FAIL**. 실제 서버 응답은 모의 데이터로 주입, 운영 RLS 미검증.
- 기존 277 지문 달력 표시 **205,884 PASS**, 276 PIN/모달 정리 **1,326 PASS**, 275 사진 보기 동기화 **10,518 PASS**, 274 사진 메타 optimistic 갱신 **5,850 PASS**, 273 파일 선택 **180 PASS**, 272 RPC 경계 **498 PASS**, 271 다중 탭 **168 PASS**, 공식 시작 인계 **15 PASS**, 모두 0 FAIL.
- 전반적 23종 지속 회귀: 교대·대정비 2개년/정비 특례, 연차·인사, 초과근무·휴일, 관리자 권한, 지문 사진 입력·선택, 저장소/세션, 백업 복원 모의, 모바일 브라우저 및 시간대 경계. 독립 교대·대정비 전이 30,606 PASS, 날짜 속성 26,430 PASS, 지문 날짜 21,930 PASS, UI 1,401 PASS, 세션·이미지 검사 포함.
- 전회 277과 같이 `cross-tab` Job은 `needs: independent` 이후 실행, 과도한 병렬 리소스 경합 완화. 별도 재실행 없이 278 내 **168 PASS / 0 FAIL**.

## 결함·검수 한계
- 신규 확정 제품 결함 **0종**. `index.html` 제품 본체 변경 없음. 신규 QA 오라클/워크플로/보고서만 검수 브랜치에 추가.
- 이전 QA 예외 그대로 유지: 265 raw localStorage SESSION_KEY 삭제에 logout tombstone이 없는 QA 간헐 실패; 270 초기 picker 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 초기 preflight 번호 오류/모달 QA 오라클 78 RED 및 초회 cross-tab 제한시간 취소 후 재검증 168 PASS. 원래 QA 실패 기록 유지.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native 사진 선택/카메라, 장기 영속 BFCache, 운영 DB 실제 백업·복원은 직접 검증하지 않음.

## 공식 SHA 및 279 인계
- `index.html`, 278 시작·작업본, `qa-handoff/index.before-2-8-279.html` 모두 **1,175,136 bytes**, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`.
- 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 인계 2026-10-17T00:06:21.644+09:00. 다음 **2-8-279**에서도 High·깊이8·블록별 실제20분+·20분 안 KST 보고·결함 확인 즉시 수정+회귀. ZIP 금지, main/SQL/버전/운영 배포 임의 변경 금지.
