# ★★★근무모아 2차·깊이8 — 275 완료 / 276 다음

- 마지막 공식 **2-8-275 CLEAN(검증 환경 범위)**, 다음 **2-8-276**, 공식 누적 제품 결함 **540종**, 신규 확정 0종.
- [275 GitHub Actions 11/11 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38881172897): 실제 1294초(21분 34초), **10×23=230** 반복 회귀 묶음 0 FAIL. 새 실제 Chromium 사진 보기 동기화·stale 이미지 폐기 **10,518 PASS**, 274 optimistic 힌트 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS.
- GitHub `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`; 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. 제품 APP_VERSION `ver20260927-0944`, SQL/운영 배포 없음.
- 276 시작 기준본 `qa-handoff/index.before-2-8-276.html`: SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. 275 시작/작업본 및 제품 `index.html`과 동일.
- 공식 인계 `CURRENT_STATE.json`, `QA_2-8-275_REPORT.md`, `QA_2-8-275_SHA_MANIFEST.json`, `QA_275_EVIDENCE_AUDIT.json`. 이전 WIP는 중간 기록.
- **265 raw SESSION_KEY 직접 삭제로 logout tombstone 누락 간헐 레거시 QA 실패, 270 초기 picker 하네스 RED, 273 두 탭 foreground picker 초기 취소 이력은 삭제·성공 치환하지 않는다**.
- 실운영 Supabase/RLS 실계정 멀티유저, 물리 Android/iOS native picker·camera, 장기 BFCache, 운영 DB 복원은 직접 미검증.
- 276 High·깊이8·실제 20분+·20분 이내 KST 진행 보고·기술 오류 발견 즉시 수정+회귀. ZIP 금지, main·SQL·APP_VERSION·배포 임의 변경 금지, GitHub 직접 사용, 채팅에 대용량 코드/로그 출력 금지.
