# ★★★근무모아 2차·깊이8 — 265 공식 완료 / 266 다음

- **2-8-265 CLEAN (검증된 제품 경로)**, 신규 확정 제품 결함 **0종**, 누적 **540종**. 다음 **2-8-266**.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL·운영 배포 없음, APP_VERSION `ver20260927-0944`.
- 공식 266 시작본 `qa-handoff/index.before-2-8-266.html` SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes, `index.html`·265 시작/작업본과 동일.
- [265 전체 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667447): **High·깊이8**, **실제 20분39초**, **9×23=207 묶음 PASS**, 최종 attempt 2의 6 Jobs 모두 PASS. 독립 730일/연도경계 **30,606 PASS**, UI 1,401, 경계 765, 소스 21 PASS.
- [다중탭 경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667397) **560 PASS**, [교차검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38705667340) **20,301 PASS**.
- **중요한 QA 예외 기록:** 최초 backend `QA_256_RESTORE_RACE`의 PC `shared-removal` 1건 실패. [레거시 raw localStorage 삭제 병렬검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38707280992)에서도 재현. 이는 실제 앱 logout이 쓰는 토큰 폐기 표식을 생략한 역사적 테스트. [실제 로그아웃 표식+삭제 16회×40](https://github.com/eco-i/eco-i.github.io/actions/runs/38707807331) **640 PASS/0 FAIL**, [보정 후 backend](https://github.com/eco-i/eco-i.github.io/actions/runs/38708113447) PASS. `QA_265_ADAPT.cjs` 테스트 하네스만 보정, 본체 미변경. 원시 키 강제삭제 동작은 검증 제한으로 보존하고 숨기지 말 것.
- 보고서 `qa-handoff/QA_2-8-265_REPORT.md`, 증빙 `qa-handoff/QA_265_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-265_SHA_MANIFEST.json`.
- 다음: High·깊이8·각 블록 실제20분 이상·20분 이내 KST 중간보고·결함 즉시 수정/RED-GREEN 회귀·번호 연속. ZIP 금지. main·SQL·APP_VERSION·배포 무단 변경 금지.
- 실운영 Supabase/RLS 다중계정, 물리 Android 카메라/파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원 미검증.
