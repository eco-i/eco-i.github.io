# ★★★근무모아 2차·깊이 8단계 공식 GitHub 인수인계 — 242 완료

- 공식 마지막 **2-8-242**, 다음 **2-8-243**, 누적 제품 결함 **519종**(이번 신규 **2종**).
- 검수 브랜치 `qa-2-8`만 변경. 운영 `main`/SQL/실배포 변경 없음. `APP_VERSION ver20260927-0944` 고정.
- 완료 QA `index.html`, `qa-handoff/index.working-2-8-242.html`, 다음 시작본 `qa-handoff/index.before-2-8-243.html` 동일 SHA-256 `c685f8a453b556f6c52ac317b00de432471278aefb0fd2b0f686f7ffbb987082`, **1,165,913 bytes**.
- 불변 이번 시작본 `qa-handoff/index.before-2-8-242.html` SHA-256 `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`, **1,165,130 bytes**.
- 신규 결함 ① 이미 열린 confirm/prompt 사이 로그아웃 marker가 생겨도 snapshot mode=shared/tab을 그대로 승인. 현재 토큰 tombstone 재검사 추가.
- 신규 결함 ② 실제 Chrome 두 탭 native confirm 동안 localStorage A의 storage event 전파가 지연되어 수정 ①만으로는 RPC **1건이 전송**됨. 보호된 RPC의 fetch 전에 event-loop task 한 번 양보하고 ownership guard 재검사로 **0건** 확인.
- 실제 두 탭 native dialog [RED/GREEN #38241625619](https://github.com/eco-i/eco-i.github.io/actions/runs/38241625619), Scoped Chrome [#38241846303](https://github.com/eco-i/eco-i.github.io/actions/runs/38241846303) **18 PASS/0 FAIL**.
- 최종 독립 전체 Chrome [#38241742880](https://github.com/eco-i/eco-i.github.io/actions/runs/38241742880) + [#38241882963](https://github.com/eco-i/eco-i.github.io/actions/runs/38241882963): 각각 **198 PASS/0 FAIL**.
- 소스/바이트 2개 수정만 차이 [#38241809337](https://github.com/eco-i/eco-i.github.io/actions/runs/38241809337) 통과.
- 공식 보고 `qa-handoff/QA_2-8-242_REPORT.md`, 근거 `qa-handoff/QA_242_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-242_SHA_MANIFEST.json`.
- 운영 Supabase/RLS, 인증 backend 멀티유저, 실제 Android 네이티브 카메라/파일선택, iOS Safari, BFCache persisted 및 운영 백업복원은 미검증.
- **High / 깊이 8단계 / 블록 최소 20분 실제 검수 / 20분 이내 중간보고 / 번호연속 / 기술 결함 즉시 수정·Chromium 회귀 / 새 버전·SQL·main·배포 임의 변경 금지.**
- ZIP 업로드 불필요. GitHub 공식 브랜치 직접 읽기.
