# ★★★근무모아 2차·깊이8 — 261 공식 완료 / 262 다음
마지막 유효 완료 **2-8-261 CLEAN**, 다음 **2-8-262**, 누적 독립 제품 결함 **540종** (261 신규 **0종**).
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음.
- SQL 변경·배포 없음, APP_VERSION `ver20260927-0944` 그대로.
- `index.html`, `qa-handoff/index.before-2-8-261.html`, `qa-handoff/index.working-2-8-261.html`, `qa-handoff/index.before-2-8-262.html` 모두 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes** 동일.
- 2026-10-15 **13:27:37~13:49:21 KST 21분44초** 실제 High·깊이8, KST 중간보고.
- [전체 8단계 20분32초 반복](https://github.com/eco-i/eco-i.github.io/actions/runs/38681632972) **8×23=184 스위트 PASS**, [신규 9분4초](https://github.com/eco-i/eco-i.github.io/actions/runs/38682192510) **111×4=444 스위트 PASS**, [Full/Backend/Frontend](https://github.com/eco-i/eco-i.github.io/actions/runs/38681722027) 3 Job PASS.
- 261 신규 독립 검사 **19,536 PASS/0 FAIL**, RED/GREEN 다중탭 **560 PASS**, SHA 무결성 **21 PASS**, 인계 Dry-run **39 PASS**. 최초 로그인 테스트의 레거시 Postgres 타임존 없는 시각 인식은 QA oracle 오류, 수정 후 제품 결함 미계상.
- 운영 Supabase/RLS 실제 다중계정, 물리 Android 카메라·파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원 미검증.
- 보고서 `qa-handoff/QA_2-8-261_REPORT.md`, 증빙 `qa-handoff/QA_261_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-261_SHA_MANIFEST.json`.
- **262부터** High·깊이8·각 블록 실제 20분 이상·20분 이내 KST 중간보고·결함 즉시 수정/RED GREEN 회귀·번호 연속. ZIP 업로드/다운로드 제안 금지. 운영 main·SQL·APP_VERSION·배포 무단 변경 금지.
