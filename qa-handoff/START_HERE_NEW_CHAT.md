# ★★★근무모아 2차·깊이8 — 266 공식 완료 / 267 다음

- 마지막 공식 완료 **2-8-266 CLEAN** (검증 범위 내), 다음 **2-8-267**, 신규 확정 결함 **0종**, 누적 **540종**.
- 저장소 `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` **미변경**; SQL·배포 변경 없음, APP_VERSION `ver20260927-0944`.
- 공식 267 시작본: `qa-handoff/index.before-2-8-267.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes; index.html/266 작업본 동일.
- [266 본검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38722557451): **6 Job 전부 SUCCESS**, High·깊이8, 실제 **20분57초**, **8×23=184 회귀 묶음 PASS**, 신규 교대/연도 30,606 PASS, UI 1,401 PASS, 시간대/대정비 765 PASS, 세션폐기 60 PASS, 소스 무결성 21 PASS.
- [과거 8개 계약](https://github.com/eco-i/eco-i.github.io/actions/runs/38722568171): **20,301 PASS**, [다중탭 경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38722562566): **560 PASS**, [실제 로그아웃 4병렬](https://github.com/eco-i/eco-i.github.io/actions/runs/38722623946): **640 PASS**, [지문기록 RPC 신규](https://github.com/eco-i/eco-i.github.io/actions/runs/38723208259): **156 PASS**.
- 265에서 발견된 원시 localStorage 키 직접 삭제(폐기 표식 미작성) 간헐 테스트 오류를 숨기지 말 것. 266은 실제 앱 로그아웃 방식의 토큰 폐기 표식을 포함해 검사했으며 정상. RAW 삭제 동작은 보증하지 않는다.
- 최신 보고서: `qa-handoff/QA_2-8-266_REPORT.md`, `qa-handoff/QA_266_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-266_SHA_MANIFEST.json`.
- **267부터:** High·깊이8, 블록별 실제20분 이상, 20분 이내 KST 중간보고, 결함 발견 즉시 수정/RED-GREEN 회귀, 번호 연속. ZIP 제안 금지, main·SQL·APP_VERSION·배포 무단 변경 금지.
- 운영 Supabase/RLS 실 다중계정, 물리 Android 카메라/선택기, iOS Safari, 영속 BFCache, 실 DB 복원 직접 미검증.
