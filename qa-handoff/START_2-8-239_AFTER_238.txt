# ★★★근무모아 2차·8단계 종합검수 GitHub 공식 인계 — 238 완료

- 공식 마지막 완료: **2-8-238**. 다음 시작: **2-8-239**. 공식 누적 제품 결함 **512종**(238 신규 2종).
- Github QA 브랜치 **qa-2-8**; 운영 main 변경/배포/SQL 변경 없음.
- 완료본 및 239 시작본 SHA-256: **1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360** (1,161,777 bytes).
- 238 시작 원본 불변 SHA-256: **f5d75a76d182629d1b8fa97002a726249f8860c729db4b47fdfa74d9707cc30f** (1,161,672 bytes).
- APP_VERSION `ver20260927-0944` 고정.
- 신규 ① 모바일 레거시 탭 세션 A가 공유 신규 B의 권한 변경을 차단한 문제 → mobile/PC 탭 전용 예외 분리(소유권·지문 경계·RPC).
- 신규 ② newer 공유 B 로그아웃 표시 후 남은 과거 모바일 레거시 A가 복원되는 문제(저장소 B 잔류/삭제 2케이스, 하나의 결함) → 최신 shared 및 suppression 우선, PC 독립 예외 유지.
- 최종 실제 Chromium 재검 [38180607739](https://github.com/eco-i/eco-i.github.io/actions/runs/38180607739), [38180691498](https://github.com/eco-i/eco-i.github.io/actions/runs/38180691498) **각 141 PASS / 0 FAIL** 동일 후보 SHA.
- HTML: `index.html`, `qa-handoff/index.working-2-8-238.html`, `qa-handoff/index.before-2-8-239.html` QA 브랜치에서 서로 동일.
- 보고서: `qa-handoff/QA_2-8-238_REPORT.md`; 증거: `qa-handoff/QA_238_EVIDENCE_AUDIT.json`; SHA: `qa-handoff/QA_2-8-238_SHA_MANIFEST.json`.
- 운영 실 Supabase DB/RLS, 실제 기기 Android native picker/카메라, iOS Safari, 실 인증서버 멀티유저, BFCache persisted는 이번 블록에서 미검증.
- High·깊이8·20분 이상 실검수·연속 번호·기술 결함 즉시 수정/회귀. 실제 검증이 없는 범위 PASS 금지. ZIP 파일 불필요.
