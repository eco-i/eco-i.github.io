# ★★★근무모아 2차·깊이 8 — 280 완료 / 281 다음

- 마지막 공식 **2-8-280 CLEAN (Chromium/모의 RPC 범위)**, 다음 **2-8-281**, 공식 누적 제품 결함 **540종**(280 신규 0종).
- [280 GitHub Actions 16/16 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38933175903) 실제 **1238초(20분 38초)**, 8×23=184 반복 회귀 묶음 PASS/0 FAIL. 신규 장기재직휴가 구간(12입사일×4제외기간×2026~2027일자×Chrome6환경) **1,734,246 PASS / 0 FAIL**. 기존 279 제외기간 636,354 PASS, 278 지문 RPC행 245,406 PASS, 277 달력 표시 205,884 PASS, 276 민감정보 1,326 PASS, 275 사진보기 10,518 PASS, 274 optimistic 5,850 PASS, 273 picker 180 PASS, 272 RPC 498 PASS, 271 cross-tab 168 PASS.
- 저장소 `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`, 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL/배포 없음.
- **281 시작본** `qa-handoff/index.before-2-8-281.html`, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**; 제품 index.html 및 280 시작/작업본 동일.
- 공식 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-280_REPORT.md`, `QA_2-8-280_SHA_MANIFEST.json`, `QA_280_EVIDENCE_AUDIT.json` 확인, WIP는 중간기록.
- 이전 QA 실패 이력/예외 보존: 265의 raw SESSION_KEY 직접삭제 후 로그아웃 tombstone 누락 간헐 QA 실패, 270 초기 picker RED, 273 초기 2탭 picker 하네스 취소, 276 초기 preflight 참조 오류·모달 오라클 78 RED·초회 cross-tab 제한시간 취소 후 회복 기록 모두 보존. 소급 성공 처리나 이력 삭제 금지.
- 실운영 미검증 범위: 운영 Supabase/RLS 실제 인증 다중 사용자, 물리 Android/iOS 기본 사진 선택·카메라, 지속 BFCache, 운영 DB 백업·복원 직접 미검증. Chromium PC/모바일 에뮬레이션 및 모의 RPC 범위 한정.
- 다음 281도 High·깊이8·실제20분 이상 회귀·20분 이내 한국시간 보고·제품 결함 즉시 수정+회귀. GitHub 직접 작업, ZIP 금지, main·SQL·APP_VERSION·운영 배포 임의 변경 금지, 채팅 본문에 방대한 로그 출력 금지.
