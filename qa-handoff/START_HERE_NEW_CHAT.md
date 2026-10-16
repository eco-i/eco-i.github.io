# ★★★근무모아 2차·깊이8 — 273 완료 / 274 다음

- 마지막 공식 완료 **2-8-273 CLEAN(검증한 환경 범위)**, 다음 **2-8-274**, 누적 확정 제품 결함 **540종**, 이번 신규 확정 **0종**.
- [273 GitHub Actions 최종 9/9 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38871054655), **실제 1216초**, 8×23=184 지속회귀 묶음 PASS/0 FAIL. 새 picker lifecycle **180 PASS**, RPC boundary **498 PASS**, cross-tab session **168 PASS**, 독립 2년 근무표 30,606 PASS.
- GitHub `eco-i/eco-i.github.io`, QA `qa-2-8` (운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변). APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 다음 기준본 `qa-handoff/index.before-2-8-274.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. 273 시작/작업본과 제품 `index.html` 동일.
- 공식 인계 `CURRENT_STATE.json`, `QA_2-8-273_REPORT.md`, `QA_2-8-273_SHA_MANIFEST.json`, `QA_273_EVIDENCE_AUDIT.json`.
- 273 새 picker 이벤트 QA 초기 두 탭 foreground 하네스 시험 시도 [38870038990](https://github.com/eco-i/eco-i.github.io/actions/runs/38870038990)·[38870690285](https://github.com/eco-i/eco-i.github.io/actions/runs/38870690285)에서 picker/independent 취소 기록 보존. **최종 단독 foreground QA 이벤트와 별도 cross-tab 보안 실험으로 분리 후 9/9 성공**. 제품 결함 0종과 QA fixture 취소는 구분.
- 265 raw localStorage 직접 키 삭제에 정상 로그아웃 폐기 표식 미설정 간헐 레거시 실패 예외와 270 picker 초기 QA 하네스 RED trial 모두 유지. 실운영 Supabase/RLS 인증 멀티유저, 물리 Android/iOS native picker, 영속 BFCache, 운영 DB 복원 직접 미검증.
- **274도 High·깊이8·블록별 실제20분+·20분 내 KST 진행보고·오류 즉시 수정+회귀**, GitHub 직접 작업·ZIP 금지, main/SQL/APP_VERSION/배포 무단 변경 금지. 대용량 로그는 Actions/인계 파일, 채팅에는 요지만.
- 이전 `QA_2-8-273_WIP.md`는 중간 기록이며 최신 `CURRENT_STATE.json`이 공식 상태.
