# ★★★근무모아 2차·깊이8 — 288 완료 / 289 다음

- 마지막 공식 **2-8-288 COMPLETE/CLEAN (Chromium/모의 RPC 한정)**, 다음 **2-8-289**, 누적 제품 결함 **540종**(288 신규 0종).
- [288 GitHub Actions 24/24 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/39013935140), 실제 **1249초 (20분49초)** 지속, **8×23=184묶음 반복 회귀 PASS / 0 FAIL**.
- 신규 288 **휴일근무 4시간당 30분 차감·시간 형식/소수초·RPC 위조/중복/직원/날짜 검증 96,384 PASS/0 FAIL**. Chrome6환경, 4,380 사례.
- 기존 287 인사발령 1,261,446, 286 부재 1,007,406, 285 연가 111,042, 284 대휴 50,694, 283 교대 57,222, 282 timestamp 988,956 등의 회귀 유지.
- **289 시작본** `qa-handoff/index.before-2-8-289.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes; 제품 index.html·288 시작/작업본과 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-288_REPORT.md`, `QA_2-8-288_SHA_MANIFEST.json`, `QA_288_EVIDENCE_AUDIT.json`, `QA_288_INDEPENDENT_EVIDENCE.json` 확인; WIP는 이전 경과 이력.
- 이전 QA 초기 실패 **265/270/273/276/282/284** 원본 보존 및 소급 GREEN/삭제 금지.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음. 실제 Supabase/RLS 인증·물리폰 카메라/picker·지속 BFCache·운영 DB 복원 미검증.
- 다음 289에서도 High·깊이8·블록마다 실제20분 이상·20분 내 KST 진행보고·새 독립 검증·기술 결함 즉시 수정/회귀, GitHub 직접연결, ZIP 제안 금지, main/SQL/버전/운영배포 임의 변경 금지.
- `QA_288_POST_PROMOTE.cjs`와 `.github/workflows/qa-288-final.yml`에 의한 289 시작본 14항목 SHA/Chromium 인계검사 대기.
