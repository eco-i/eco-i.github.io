# ★★★근무모아 2차·깊이 8 — 281 완료 / 282 다음

- 마지막 공식 **2-8-281 CLEAN (Chromium/모의 RPC 범위)**, 다음 **2-8-282**, 누적 제품 결함 **540종**(281 신규 0종).
- [281 GitHub Actions 17/17 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38938332730), 실제 **1323초(22분 3초)** 지속검사, **8×23=184 반복 회귀 묶음 PASS** / 0 FAIL.
- 281 신규 **장기재직 제외기간 순열·정규화·윤일·인정기념일 독립 fuzz 658,206 PASS / 0 FAIL, 6환경**. 기존 280 구간 경계 1,734,246 PASS, 279 제외일수 636,354 PASS, 278 RPC 245,406 PASS, 277 달력 205,884 PASS 등 기존 회귀 유지.
- 운영 branch main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`; SQL 변경/운영 배포 없음.
- **282 시작본** `qa-handoff/index.before-2-8-282.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. `index.html`, 281 시작/작업본과 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-281_REPORT.md`, `QA_2-8-281_SHA_MANIFEST.json`, `QA_281_EVIDENCE_AUDIT.json` 확인. 281 WIP 상태 파일은 당시 진행 증거.
- 이전 QA 실패 이력: 265 raw SESSION_KEY/tombstone, 270 picker 초기 RED, 273 2탭 하네스 취소, 276 preflight·모달 오라클 78 RED·cross-tab 제한시간 취소 모두 보존. 소급 처리 금지.
- 운영 Supabase/RLS 실제 인증 다중사용자, 물리 휴대폰 기본 카메라·파일선택, 지속 BFCache, 운영 DB 백업·복원 직접 미검증.
- 282도 High·깊이8·실제 20분+, 20분 내 KST 보고, 제품 결함 즉시 수정/회귀, 신규 독립검사, GitHub 직접 연결, ZIP 금지, main/SQL/APP_VERSION/배포 임의 변경 금지, 채팅 로그 요약.
- 282 인계 후속 GitHub Actions Chrome 14-assert 확인을 위한 `QA_281_POST_PROMOTE.cjs` 및 `qa-281-final.yml` 준비.
