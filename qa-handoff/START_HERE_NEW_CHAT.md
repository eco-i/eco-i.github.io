# ★★★근무모아 2차·깊이8 공식 인계 — 246 완료

- **마지막 공식 완료 2-8-246, 다음 2-8-247**, 누적 제품 결함 **528종**(이번 신규 **1종**, 영향 받는 RPC 6개. 원인 동일한 한 위치의 누락이므로 중복 집계 금지).
- GitHub `eco-i/eco-i.github.io` 검수 브랜치 `qa-2-8`, 운영 `main` 변동/배포 없음, SQL 미변경. APP_VERSION `ver20260927-0944` 유지.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-246.html`, 다음 시작 `qa-handoff/index.before-2-8-247.html`: SHA-256 **`8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d`**, **1,169,644 bytes**.
- 이번 불변 시작 `qa-handoff/index.before-2-8-246.html` SHA-256 `be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da`, **1,169,443 bytes**.
- 신규 제품 결함: 관리자 2차 인증 해제 시 `get_personnel_restore_revision_v1` 및 관리자 용량 메타 5종이 공통 read guard를 우회. `ADMIN_PRIVILEGED_READ_RPCS` 누락 분류 6개 한 곳 보완. RED [#38322894855](https://github.com/eco-i/eco-i.github.io/actions/runs/38322894855), [#38323230263](https://github.com/eco-i/eco-i.github.io/actions/runs/38323230263); GREEN [#38323036969](https://github.com/eco-i/eco-i.github.io/actions/runs/38323036969) 19/0, [#38323322734](https://github.com/eco-i/eco-i.github.io/actions/runs/38323322734) 27/0.
- 권한 회수·readonly·demotion 응답 시점 [#38323389313](https://github.com/eco-i/eco-i.github.io/actions/runs/38323389313) 18 PASS/0 FAIL.
- 실제 Chrome 두 탭 native confirm 회수: [#38323157946](https://github.com/eco-i/eco-i.github.io/actions/runs/38323157946), [#38323513571](https://github.com/eco-i/eco-i.github.io/actions/runs/38323513571) 각 2/0. 실제 UI 민감 문자열·PIN 캐시 청소 [#38324406058](https://github.com/eco-i/eco-i.github.io/actions/runs/38324406058), native dialog [#38324315744](https://github.com/eco-i/eco-i.github.io/actions/runs/38324315744), 각 18/0.
- 최종 후보 고정 Chrome 깊이8 **209 PASS / 0 FAIL × 3회 독립** [#38323566153](https://github.com/eco-i/eco-i.github.io/actions/runs/38323566153), [#38323876681](https://github.com/eco-i/eco-i.github.io/actions/runs/38323876681), [#38323995971](https://github.com/eco-i/eco-i.github.io/actions/runs/38323995971).
- 정밀 SHA/diff [#38323467567](https://github.com/eco-i/eco-i.github.io/actions/runs/38323467567), [#38323909769](https://github.com/eco-i/eco-i.github.io/actions/runs/38323909769) PASS (source 1 hunk, scripts 2 parse, DOM ID 457 unique).
- UI purge 초기 false FAIL은 테스트용 두 번째 탭의 자동 복원 루틴/저장소 write 관찰 전 조기 delete라는 **하네스 오류**. Passive blank same-origin B 탭 + 저장소 키 도착 확인 후 제거하여 18 PASS/0 FAIL로 바로잡음. 제품 결함 아님.
- 보고서 `qa-handoff/QA_2-8-246_REPORT.md`, 증거 `qa-handoff/QA_246_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-246_SHA_MANIFEST.json`.
- 서버 실운영 Supabase/RLS/실유저 DB, 물리 Android 파일선택·카메라, iOS Safari, persisted BFCache, 운영 백업 복원은 **미검증**.
- 다음 High·깊이8·실제 20분 이상 검수, 20분 이내 중간 보고, 번호 연속, 기술 결함 즉시 수정+회귀. 임의 APP_VERSION/SQL/main/배포 변경 금지.
- GitHub 직접 연결. ZIP 업로드/다운로드 요구하지 말 것.
