# ★★★근무모아 2차·깊이 8 — 277 완료 / 278 다음

- 최신 공식 마지막 완료 **2-8-277 CLEAN(검증 범위)**, 다음 시작 **2-8-278**, 확정 제품 결함 누적 **540종**, 277 신규 0종.
- [277 Actions 13/13 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38902439306)에서 실제 1318초(21분 58초), 8회×23종=184 반복검사 PASS/0 FAIL. 신규 지문 달력 표시 730일/6조건×6 PC·모바일/시간대 환경 **205,884 PASS/0 FAIL**. 기존 276 모달 비밀번호 1,326 PASS, 275 사진 보기 동기화 10,518 PASS, 274 optimistic update 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS.
- GitHub `eco-i/eco-i.github.io`, QA 브랜치 `qa-2-8`, 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL 및 운영 배포 없음.
- 278 기준본 `qa-handoff/index.before-2-8-278.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. `index.html`, 277 시작/작업본 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-277_REPORT.md`, `QA_2-8-277_SHA_MANIFEST.json`, `QA_277_EVIDENCE_AUDIT.json` 최신 확인. `QA_2-8-277_WIP.md`는 진행 기록.
- **과거 이력 유지:** 265 raw localStorage SESSION_KEY 직접 삭제 후 tombstone 누락 간헐 QA 예외; 270 picker 초기 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 처음 preflight 버전 참조 오류, 초기 modal oracle 78 RED 및 cross-tab 취소 후 성공적인 단일 작업 재검수. 역사적 실패 지우거나 성공으로 소급 처리하지 않음.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native camera/file picker, 영속 BFCache, 운영 DB 실제 백업·복원은 직접 미검증.
- **278도 High·깊이8·실제20분+·KST 20분 보고·기술 오류 즉시 수정+회귀·GitHub 직접 검수, ZIP 금지, main/SQL/APP_VERSION/배포 임의 변경 금지.** 대용량 코드/로그 채팅에 전송하지 말 것.
