# ★★★근무모아 2차·깊이8 — 274 완료 / 275 다음

- 공식 마지막 **2-8-274 CLEAN(검증한 Chromium/모의 RPC 범위)**, 다음 **2-8-275**, 확정 제품 결함 누적 **540종** (274 신규 확정 **0종**).
- [274 최종 10/10 GitHub Actions SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38877682762): 실제 **1266초**, 8×23=184 반복회귀 스위트 PASS 0 FAIL. 새 지문 갱신 낙관적 상태·stale guard **5,850 PASS**, 273 사진선택 **180 PASS**, 272 RPC **498 PASS**, 271 교차탭 **168 PASS**, 원본 독립 근무표 30,606 PASS.
- GitHub `eco-i/eco-i.github.io`, QA 브랜치 `qa-2-8`, 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. 제품 APP_VERSION `ver20260927-0944`, SQL 변경·운영 배포 없음.
- 275 기준본 `qa-handoff/index.before-2-8-275.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 274 시작/작업본 및 `index.html`과 동일. 공식 인계 `CURRENT_STATE.json`, `QA_2-8-274_REPORT.md`, `QA_2-8-274_SHA_MANIFEST.json`, `QA_274_EVIDENCE_AUDIT.json`.
- **265 레거시 raw SESSION_KEY 삭제에 tombstone 생략된 QA 간헐 실패**, **270 초기 picker QA 하네스 RED**, **273 두 탭/foreground picker 초기 QA 하네스 취소 이력**은 모두 보존. 기존 테스트 성공으로 과거 기록을 지우거나 안전 범위를 확장하지 말 것.
- 실운영 Supabase/RLS 실계정 멀티유저, 물리 Android/iOS native picker/카메라, 영속 BFCache, 실운영 DB 복원 미검증.
- 275 High·깊이8·실제20분 이상·20분 내 KST 보고·발견 결함 즉시 수정+회귀. GitHub 직접 사용·ZIP 금지, main·SQL·APP_VERSION·배포 임의 변경 금지. 채팅은 핵심만, 로그는 Actions/QA 파일로.
- 과거 `QA_2-8-274_WIP.md`는 진행 스냅샷이므로 `CURRENT_STATE.json` 및 공식 274 보고서가 최신 기준.
