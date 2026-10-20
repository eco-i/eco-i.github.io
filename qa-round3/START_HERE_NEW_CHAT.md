# 근무모아 3차·깊이8 최신 인계

- **마지막 완료 3-8-50: QA 임시 테스트 사이트 CSP 네트워크 격리 도구 검수 완료. NOT CLEAN / E2E BLOCKED**. 다음 공식 번호 **3-8-51**은 실제 독립 QA 서버 + 브라우저 환경 확보 후 진행. 3차 누적 신규 제품결함 37종 유지(50 신규 0).
- GitHub `eco-i/eco-i.github.io`, `qa-3-8`, 운영 `main`. `qa-round3/CURRENT_STATE.json`, `QA_3-8-50_REPORT.md`, `e2e/E2E_RUNBOOK.md`, `EXIT_CRITERIA.md` 확인.
- 생성기 `qa-round3/e2e/prepare-qa-site.mjs`는 운영 호스트/키·secret을 거부하고 격리 QA key/ref를 강제. 이번 50에서 새 테스트 HTML head 최상단에 CSP 삽입: connect-src는 **해당 QA Supabase HTTPS·WSS와 self만**, CDN jsdelivr는 script-src만, 인라인 UI JS/CSS 및 data/blob 사진 허용, object/frame/worker 금지. `[격리 QA]` 제목 삽입. 원본 제품코드는 수정하지 않음.
- Node 실제 synthetic 오프라인 테스트 `node --test qa-round3/e2e/prepare-qa-site.test.mjs` **15/15 PASS**. 브라우저 CSP 적용/실제 로그인·근태·사진 E2E는 검증하지 않음.
- QA HTML blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance blob `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313` 불변. 운영 main `6c784210e048426f18a486d5602652626d97574d` 및 실제 직원 DB/실 운영 SQL/RPC/배포 변경 없음.
- 독립 QA Supabase 없음, GitHub에는 핵심 71 RPC 중 3종 이름 일치 정의만 있는 incremental SQL 16개뿐. 기본 스키마·가짜 직원·실 Chrome 두 탭·Android/iOS 테스트 환경 준비되지 않아 3차 전체 종료 미확정.
- **다음 실질 행동:** 별도 QA 프로젝트 비용과 조직 확인·사용자 승인 후 가짜 직원만 있는 완성 QA 서버 구축→P0/P1 실기기/동시 DB E2E. 그 전엔 블록 번호만 늘리는 mock 반복 금지. 사용자 별도 배포 지시 전 main 병합 절대 금지. ZIP 요구 불필요.

작성 KST 2026-10-20T21:28:39+09:00.
