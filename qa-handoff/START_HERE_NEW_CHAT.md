# ★★★근무모아 2차·깊이8 — 289 완료 / 290 다음

- 공식 마지막 **2-8-289 COMPLETE/CLEAN (Chromium/모의 RPC 범위)**, 다음 **2-8-290**, 누적 제품 결함 **540종**(289 신규 0종).
- [289 GitHub Actions 25/25 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39015881283), 실제 **1250초 (20분 50초)** 지속, 8×23=184묶음 PASS/0 FAIL.
- 289 신규 **조출/야근 초과근무 10분단위·월별 편성확정·중복/범위/위변조 독립검사 122,670 PASS / 0 FAIL**, Chrome6환경, 4,380 사례.
- 기존 288 휴일근무 96,384, 287 인사발령 1,261,446, 286 부재 1,007,406, 285 연가 111,042, 284 대휴 50,694, 283 교대 57,222, 282 타임스탬프 988,956 등 모든 회귀 유지.
- **290 시작본** `qa-handoff/index.before-2-8-290.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes, index.html/289 시작·작업본과 동일.
- `qa-handoff/CURRENT_STATE.json`, `QA_2-8-289_REPORT.md`, `QA_2-8-289_SHA_MANIFEST.json`, `QA_289_EVIDENCE_AUDIT.json` 공식 증거; WIP는 당시 기록.
- 과거 QA RED 265/270/273/276/282/284 **보존**, 소급 PASS·삭제 금지. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영배포 없음.
- 실제 운영 Supabase/RLS 다중 인증·물리 Android/iOS 기본 camera/file picker·지속 BFCache·DB 복원 직접 미검증.
- 290도 High·깊이8·실제20분 이상·20분 이내 KST 진행보고·신규 독립검사·발견한 제품 결함 즉시 수정/회귀·GitHub 직접작업, ZIP 제안 금지, main/SQL/APP_VERSION/운영배포 무단 변경 금지.
- `QA_289_POST_PROMOTE.cjs` 및 `.github/workflows/qa-289-final.yml`로 290 시작본 14항목 Chromium/무결성 인계검사 대기.
