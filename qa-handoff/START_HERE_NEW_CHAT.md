# ★★★근무모아 2차·깊이8 — 267 공식 완료 / 268 시작

- **2-8-267 CLEAN**, 다음 **2-8-268**, 신규 확정 제품 결함 **0종**, 누적 **540종**.
- 저장소 `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL·운영 배포 없음, APP_VERSION `ver20260927-0944` 유지.
- 다음 공식 기준본 `qa-handoff/index.before-2-8-268.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. index.html/267 작업본 동일.
- [267 본검수 6 Jobs 전부 PASS](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726740), 실제 **20분31초(1231초)**, 8×23=**184묶음 PASS**. 신규 일자 property **26,430 PASS**, 교대·연도 30,606, UI 1,401, KST/대정비 765, 세션 보호 60, 무결성 21 PASS.
- [8개 과거 계약 교차](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726596) SUCCESS, [다중탭](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726812) **560 PASS**, [실제 로그아웃](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726578) **640 PASS**, [지문 기록 검증](https://github.com/eco-i/eco-i.github.io/actions/runs/38728727002) **156 PASS**.
- 중요한 예외: 265의 원시 localStorage 세션키 직접삭제/폐기표식 누락 시뮬레이션 간헐 실패 증빙은 계속 보존. 앱의 실제 logout 토큰 폐기 표식 경로는 PASS; RAW 직접삭제 전조건을 보증하지 않음.
- 최신 보고서 `qa-handoff/QA_2-8-267_REPORT.md`; 증빙 `QA_267_EVIDENCE_AUDIT.json`; SHA `QA_2-8-267_SHA_MANIFEST.json`.
- **268부터** High·깊이8·블록당 실검수20분 이상·20분 이내 KST 중간보고·오류 즉시 수정 및 RED/GREEN 회귀. ZIP 금지, 운영 main·SQL·APP_VERSION·배포 무단 변경 금지.
- 운영 Supabase/RLS 실제 다중계정, 물리 Android 카메라/선택기, iOS Safari, 영속 BFCache, 실 DB 복원 직접 미검증.
