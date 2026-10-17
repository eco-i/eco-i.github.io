# ★★★근무모아 2차·깊이 8 — 282 완료 / 283 다음

- 공식 마지막 **2-8-282 COMPLETE/CLEAN (Chromium/모의 RPC 범위)**, 다음 **2-8-283**, 공식 누적 제품 결함 **540종**(282 신규 0종).
- [282 메인 Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38996713788): 최종 **18/18 SUCCESS(Attempt 2)**, 실제 **1239초**, 8×23=184 반복 회귀 묶음 PASS. 최초 Attempt 1 cross-tab **149 PASS/1 QA FAIL**, navigation destroyed 기록 **반드시 보존**. 별도 [복구 검증](https://github.com/eco-i/eco-i.github.io/actions/runs/38997014183) Chrome 174 PASS × 2회 및 원본 Attempt 2 168 PASS / 0 FAIL. 최초 실패 삭제/소급 성공 금지.
- 282 신규 타임스탬프·지문 optimistic stale mutation 독립검사 **988,956 PASS / 0 FAIL (6컨텍스트)**. 기존 281 658,206, 280 1,734,246, 279 636,354, 278 245,406, 277 205,884 등 기존 회귀 유지.
- **283 시작본** `qa-handoff/index.before-2-8-283.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 제품 HTML 및 282 시작/작업본 모두 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-282_REPORT.md`, `QA_2-8-282_SHA_MANIFEST.json`, `QA_282_EVIDENCE_AUDIT.json`. 최초 오류 `QA_282_CROSS_TAB_INITIAL_FAILURE.json` 및 `QA_282_CROSS_TAB_RECOVERY_EVIDENCE.json`, WIP 기록도 확인.
- 이전 265/270/273/276 QA 오류 이력도 유지. 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL/APP_VERSION/운영 배포 변경 없음.
- 운영 Supabase/RLS 다중사용자 직접인증, 실기 Android/iOS 기본 사진 picker/카메라, 지속 BFCache, 운영 백업·복원 미검증.
- 283도 High·깊이8·실제 20분 이상·20분 내 KST 중간 보고·새 독립 검사·발견 기술오류 즉시 수정 및 회귀, GitHub 직접 연결, ZIP 금지, SQL/운영 main/APP_VERSION/배포 임의 변경 금지, 채팅 로그 간결히.
- `QA_282_POST_PROMOTE.cjs` 및 `.github/workflows/qa-282-final.yml`로 283 시작본 인계 14항목 Chrome 검증 대기.
