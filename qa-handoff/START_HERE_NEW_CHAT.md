# ★★★근무모아 2차·깊이8 — 272 완료 / 273 다음

- 공식 완료 **2-8-272 CLEAN(검증 범위 내)**, 다음 **2-8-273**. 누적 확정 제품 결함 **540종**, 272 신규 확정 **0종**.
- GitHub `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`, 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL·APP_VERSION·운영 배포 무단 변경 없음; APP_VERSION `ver20260927-0944`.
- [272 본검수 8/8 Job 성공](https://github.com/eco-i/eco-i.github.io/actions/runs/38867133983): 실제 **1236초**, 8×23=184 반복 회귀 스위트 PASS, 신규 RPC boundary **498 PASS**, 교차탭 **168 PASS**, 무결성 15 PASS. 전부 해당 테스트 범위 실패 0.
- 273 시작 파일 `qa-handoff/index.before-2-8-273.html`: SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. 제품 `index.html` 및 272 시작/작업본과 동일.
- 공식 인계 `qa-handoff/CURRENT_STATE.json`, `qa-handoff/QA_2-8-272_REPORT.md`, `qa-handoff/QA_2-8-272_SHA_MANIFEST.json`, `qa-handoff/QA_272_EVIDENCE_AUDIT.json`.
- **265 legacy raw localStorage 세션 직접 제거(로그아웃 폐기표식 미설정) 간헐 실패 예외와 270 초기 picker QA 하네스 RED 이력은 계속 보존**. 확인하지 않은 위험을 해결로 처리 금지.
- 운영 Supabase/RLS 실계정 멀티유저, 물리 Android/iOS native picker/카메라, 영속 BFCache, 운영 DB 복원은 직접 미검증.
- 273 High·깊이8·블록별 실제20분+·20분 내 KST 보고·기술 결함 즉시 수정+회귀. 채팅은 핵심, 대용량 로그는 Actions/인계 파일. ZIP 제안 금지, main·SQL·APP_VERSION·배포 임의 변경 금지.
- 이전 `QA_2-8-272_WIP.md`는 진행 당시 스냅샷으로, 공식 상태는 CURRENT_STATE 및 이 최신 인계 문서 우선.
