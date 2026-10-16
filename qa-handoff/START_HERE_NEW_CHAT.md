# ★★★근무모아 2차·깊이8 — 278 완료 / 279 다음

- 공식 마지막 **2-8-278 CLEAN (Chromium/모의 RPC 범위)**, 다음 시작 **2-8-279**, 공식 누적 제품 결함 **540종**, 278 신규 0종.
- [278 Actions 14/14 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38918174267): 실제 **1216초**, **10×23=230회** 회귀묶음 PASS/0 FAIL. 신규 지문 RPC 메타데이터 730일 검증 **245,406 PASS/0 FAIL**. 277 지문 달력 205,884 PASS; 276 민감정보 1,326 PASS; 275 viewer-sync 10,518 PASS; 274 mutation 5,850 PASS; 273 picker 180 PASS; 272 RPC boundary 498 PASS; 271 2탭 168 PASS.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`; main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL 및 운영 배포 없음.
- 279 시작본 `qa-handoff/index.before-2-8-279.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 278 시작/작업본 및 제품 index.html과 동일.
- 인계 파일: `CURRENT_STATE.json`, `QA_2-8-278_REPORT.md`, `QA_2-8-278_SHA_MANIFEST.json`, `QA_278_EVIDENCE_AUDIT.json`; WIP는 중간기록.
- 과거 QA 예외 유지: 265 raw localStorage SESSION_KEY 삭제에 logout tombstone이 없는 QA 간헐 실패; 270 초기 picker 하네스 RED; 273 초기 두 탭 picker 하네스 취소; 276 초기 preflight 번호 오류/모달 QA 오라클 78 RED 및 초회 cross-tab 제한시간 취소 후 재검증 168 PASS. 원래 QA 실패 기록 유지.
- 직접 미검증: 실운영 Supabase/RLS 인증 다중 사용자, 실물 Android/iOS native 사진 선택/카메라, 장기 영속 BFCache, 운영 DB 실제 백업·복원은 직접 검증하지 않음.
- 279 High·깊이8·실제 20분 이상·20분 내 KST 보고·기술 결함 즉시 수정+회귀. GitHub 직접, ZIP 제안 금지, main/SQL/APP_VERSION/운영 배포 무단 변경 금지.
