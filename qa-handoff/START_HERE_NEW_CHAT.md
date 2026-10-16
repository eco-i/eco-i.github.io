# ★★★근무모아 2차·깊이8 — 276 완료 / 277 다음

- 공식 마지막 **2-8-276 CLEAN(검증된 Chromium/모의 백엔드 범위)**, 다음 **2-8-277**. 공식 누적 확정 제품 결함 **540종**; 276 신규 확정 0종.
- [276 최종 GitHub Actions attempt 2 12/12 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38887878278): 실제 **1269초**, 8×23=184 지속회귀 묶음 0 FAIL. 신규 민감정보 팝업/이탈 정리 **1,326 PASS**, 275 viewer-sync **10,518 PASS**, 274 mutation hint **5,850 PASS**, 273 file-picker **180 PASS**, 272 RPC **498 PASS**, 271 교차탭 **168 PASS**.
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-2-8`, 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL 변경/운영 배포 없음.
- 다음 기준본 `qa-handoff/index.before-2-8-277.html` SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes, 제품 및 276 시작/작업본 동일.
- 공식 상태 `qa-handoff/CURRENT_STATE.json`, `QA_2-8-276_REPORT.md`, `QA_2-8-276_SHA_MANIFEST.json`, `QA_276_EVIDENCE_AUDIT.json`.
- **QA 실패/회복 경로 꼭 보존:** 265 직접 로컬 세션 키 삭제 후 표식 없는 로그아웃 QA 간헐 실패, 270 초기 사진 선택 QA 하네스 RED, 273 두 탭 전면선택 초기 QA 취소 기록. 276 첫 preflight 잘못된 번호 참조, 두번째 민감정보 검사에서 9개 필드 오인/비동기 ARIA 오라클 78 RED, 세번째 cross-tab 16분 제한 취소 후 단일 Job 재실행 168 PASS 기록 보존.
- 직접 미검증: 실운영 Supabase/RLS 실제 인증 다중 사용자, 실물 Android/iOS OS 사진 선택·카메라, 장기 BFCache, 운영 DB 백업/복원은 직접 테스트하지 않았음.
- 277도 High·깊이8·실제 20분+·20분 내 KST 진행보고·결함 즉시 수정+회귀. GitHub 직접 검수, ZIP 제안 금지, 운영 main/SQL/APP_VERSION/배포 임의 변경 금지. 채팅 대용량 로그·코드 출력 자제.
