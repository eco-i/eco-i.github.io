# 근무모아 3차·깊이8 최신 인계

- 마지막 공식 완료: **3-8-49 QA 준비 보강, E2E BLOCKED, NOT CLEAN**. 다음 번호 **3-8-50(격리 QA 서버와 실제 브라우저 확보 후)**. 3차 누적 신규 제품결함 **37종**, 49 제품 신규 0.
- Github eco-i/eco-i.github.io, QA `qa-3-8`, 운영 `main`. GitHub `qa-round3/CURRENT_STATE.json`, `QA_3-8-49_REPORT.md`, `e2e/QA_BACKEND_GAPS.md`, `e2e/qa-schema-preflight.sql`, `EXIT_CRITERIA.md` 검토.
- 49에서 QA 보조 도구의 legacy JWT only 문제 개선: 현행 `sb_publishable_` 지원 + QA 프로젝트 ref 일치 확인, 키 수동 소속 확인 플래그, 운영 URL/키/secret 및 부속 파일 연결 차단. `node --test qa-round3/e2e/prepare-qa-site.test.mjs` **13/13 합성 offline PASS**. 실제 직원·DB 미접근.
- 앱 RPC 71종 중 GitHub의 증분 migration 16개에 정의된 일치 이름 **3종**, 나머지 **68종은 새 QA 프로젝트를 설치할 baseline DDL이 없어** E2E 불가. `qa-schema-preflight.sql`은 독립 QA 프로젝트에만 실행할 read-only catalog 검사이며 아직 미실행.
- 46~47 다른 코드 영역 연속 CODE-CLEAN이나 실제 browser·PWA·QA Supabase E2E 미통과. 제품 code blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance blob `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313`, main SHA `6c784210e048426f18a486d5602652626d97574d` 전혀 변경 없음.
- 다음엔 사용자 승인 후 *완전 독립* QA Supabase 및 non-personal synthetic schema 필요. 운영 프로젝트 branch/clone/backup/직원 데이터/secret 금지. 실 browser에서 P0 SQL race, shared 2탭, admin PIN, 근태/지문/Realt ime/E2E 통과 전엔 3차 종료·main 배포 불가. 번호만 늘리는 반복 mock 검수 금지.
- 연결 안정성 우선, 짧은 보고/깃허브 기록, ZIP 불필요.

KST 2026-10-20T20:50:38+09:00.
