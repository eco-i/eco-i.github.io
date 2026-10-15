# ★★★근무모아 2차·깊이8 — 263 공식 완료 / 264 다음

- **2-8-263 CLEAN**, 신규 제품 결함 **0종**, 공식 누적 **540종**. 다음 시작 **2-8-264**.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` (변경 없음).
- APP_VERSION `ver20260927-0944`; SQL·운영 배포 변경 없음.
- 공식 다음 기준본 `qa-handoff/index.before-2-8-264.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136bytes, `index.html` 및 263 작업본과 동일.
- [263 전체 High/깊이8 본검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38696601055) **6 Jobs 모두 PASS**, 20분52초 지속 실행, 9회×23=207묶음 PASS. 신규 UI 검사 1,401 PASS/0 FAIL; 소스 21 PASS.
- [추가 교차검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38697446935) 8개 독립계약 **20,301 PASS/0 FAIL**.
- [다중탭 RED/GREEN](https://github.com/eco-i/eco-i.github.io/actions/runs/38697137521) **560 PASS/0 FAIL**.
- 보고서: `qa-handoff/QA_2-8-263_REPORT.md`; 증빙: `qa-handoff/QA_263_EVIDENCE_AUDIT.json`; Manifest: `qa-handoff/QA_2-8-263_SHA_MANIFEST.json`.
- **264부터:** High·깊이8·블록별 실제20분 이상·20분 이내 KST 중간보고·오류 발견 시 즉시 수정/RED→GREEN 회귀·번호 연속.
- ZIP 제안/업로드 금지, 운영 main·SQL·APP_VERSION·배포 무단 변경 금지.
- 미검증 한계: 운영 Supabase/RLS 실제 다중계정, 물리 Android 카메라/파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원.
