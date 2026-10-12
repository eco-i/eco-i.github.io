# 근무모아 QA GitHub 공식 인수인계 — 2-8-240 완료

- 공식 마지막 완료 블록 **2-8-240**, 다음 **2-8-241**, 공식 누적 제품 결함 **516종** (이번 +1종).
- QA 브랜치 `qa-2-8` 및 저장소 `eco-i/eco-i.github.io`. 운영 `main`/APP_VERSION `ver20260927-0944`/SQL/배포 변경 없음.
- 240 시작 SHA-256 `afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5`, 1,164,059 bytes.
- 240 완료 및 241 시작 SHA-256 `53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34`, 1,164,815 bytes, GitHub QA `index.html`/working/241 기준 동일.
- 신규 제품 결함: token-specific logout tombstone이 실시간 열린 탭/관리자 unlock/지문 변경·민감 export RPC 사전 인증 경계에서 누락. 최신 로컬 로그아웃 이벤트가 도착하지 않거나 SESSION_KEY가 불변인 구간의 권한 우회. 제품 **6곳 최소 수정**.
- 브라우저 red [38214017941](https://github.com/eco-i/eco-i.github.io/actions/runs/38214017941).
- 실제 Chromium 고정 SHA 최종 **180 PASS / 0 FAIL 2회**: [38215309353](https://github.com/eco-i/eco-i.github.io/actions/runs/38215309353), [38215415673](https://github.com/eco-i/eco-i.github.io/actions/runs/38215415673).
- 실제 모바일 3 관리자 탭의 토큰 폐기 fan-out, PC 독립 관리자 B, 구 A 로그아웃 후 신규 공유 B 보존, 전 8단계 기존 검증.
- 문서 `qa-handoff/QA_2-8-240_REPORT.md` / `qa-handoff/QA_240_EVIDENCE_AUDIT.json` / `qa-handoff/QA_2-8-240_SHA_MANIFEST.json`.
- 실 DB/Supabase·Android native picker·실 인증서버 멀티유저·iOS·BFCache persisted·실 백업 미검증. High·깊이8·최소20분 실제검수·20분 이내 중간보고·기술결함 즉시 수정/회귀·번호 연속. ZIP 불필요.
