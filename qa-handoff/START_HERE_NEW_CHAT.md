# ★★★근무모아 2차·깊이8 — 287 완료 / 288 시작

- 공식 마지막 **2-8-287 COMPLETE/CLEAN (Chromium/모의 RPC 한정)**, 다음 **2-8-288**, 제품 결함 공식 누적 **540종**(287 신규 0종).
- [287 GitHub Actions 23/23 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39011420967), 실제 **1325초(22분 5초)** 지속, 9×23=207 회귀 묶음 PASS/0 FAIL.
- 287 신규 **인사발령 날짜·배치 생성시각·동시 action_id·취소/미래 배치·퇴직/휴직·타인 ID 독립검사 1,261,446 PASS / 0 FAIL, Chrome6환경, 105,120 시나리오**.
- 이전 286 부재 판정 1,007,406, 285 연가 111,042, 284 대휴 50,694, 283 교대 57,222, 282 timestamp 988,956 등 모든 회귀 유지.
- **288 시작본** `qa-handoff/index.before-2-8-288.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes; 제품 index.html·287 시작/작업본 동일.
- `qa-handoff/CURRENT_STATE.json`, `QA_2-8-287_REPORT.md`, `QA_2-8-287_SHA_MANIFEST.json`, `QA_287_EVIDENCE_AUDIT.json` 공식 확인; WIP는 이전 진행 당시 기록.
- 265/270/273/276/282/284 최초 QA 실패 로그/증거 원본 보존 및 소급 PASS/삭제 절대 금지. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0`, APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 운영 Supabase/RLS 실제 다중사용자, 물리 Android/iOS 기본 카메라·파일 picker, 지속 BFCache, 운영 DB 복원 등 미검증.
- 288도 High·깊이8·실제20분 이상·20분 내 KST 진행보고·새 독립검사·결함 즉시 수정/회귀·GitHub 직접연결·ZIP 제안 금지, 운영 main/SQL/APP_VERSION/배포 임의 변경 금지.
- [288 인계검사 14 PASS / 0 FAIL](https://github.com/eco-i/eco-i.github.io/actions/runs/39012983546) 완료. `QA_287_POST_PROMOTE.cjs`와 `qa-287-final.yml` 기록 보존.
