# ★★★근무모아 2차·깊이8 공식 인계 — 257 완료

- 완료: **2-8-257**, 다음 **2-8-258**, 누적 독립 제품 결함 **539종** (257 신규 0종/CLEAN).
- GitHub `eco-i/eco-i.github.io` QA `qa-2-8`; 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` **변경 없음**.
- 이전/최종/다음 불변 HTML SHA-256 모두 `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9`, 1,174,614 bytes, Git blob `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3`. 새 시작 `qa-handoff/index.before-2-8-258.html`.
- APP_VERSION `ver20260927-0944`, SQL·운영 배포 변경 **없음**. 소스 변경 0.
- 2026-10-15 10:04경~10:26경 KST 약 22분 실검수, 20분 최소 충족, 중간보고. 
- Chromium 전체 깊이8 214/0 ×2 독립 성공 (#38664120188, #38664240144), backend backup 6144, codec 16384, 개인/관리자 복원 100+100, 세션648, 연가34020, native/frontend287, index smoke56, integrity24; 신규 QA257 edge3171, RPC contract184 (#38664427189), 한국 자정/타임존72 (#38664997130) 전부 통과.
- 지속 실검수 GitHub Actions [#38664288131](https://github.com/eco-i/eco-i.github.io/actions/runs/38664288131) **857초·13회차·143개 테스트 묶음 전부 PASS**.
- 일부 QA 하네스 실패(#38663970966 정규식 이스케이프, #38664763053 0-based 월 oracle, #38664861930 가상시계 경과)는 스크립트 수정 후 전체 정상화, 제품 결함에 미포함.
- 자세한 공식 증빙 `qa-handoff/QA_2-8-257_REPORT.md`, `qa-handoff/QA_257_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-257_SHA_MANIFEST.json`.
- 실제 운영 Supabase/RLS 멀티유저, 물리 Android 카메라/Picker, iOS Safari, persisted BFCache, 운영 실DB 복원은 미검증.

## 다음 규칙
2-8-258부터 번호 연속·High·깊이8·매 블록 실제 20분 이상·20분 이내 KST 중간보고·발견 결함 즉시 수정 및 RED→GREEN 독립 회귀. ZIP 제안 금지, 운영 `main`/SQL/APP_VERSION/배포 무단 변경 금지. 검수 깊이는 줄이지 않고 대량 도구 로그만 축약.
