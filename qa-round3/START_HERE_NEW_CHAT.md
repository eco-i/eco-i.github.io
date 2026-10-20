# 근무모아 3차·깊이8 공식 인수인계

- **공식 마지막 완료 3-8-48 (E2E ENVIRONMENT-GATE 진단 완료, CLEAN 아님)**, 다음 번호 **3-8-49는 별도 QA 환경 확보 시에만 진행**. 3차 누적 신규 제품 결함 **37종** 유지; 46~47 코드 격리 CLEAN 2회는 E2E 완료 증빙 아님.
- GitHub `eco-i/eco-i.github.io` QA `qa-3-8`, 운영 `main`. 우선 `qa-round3/CURRENT_STATE.json`, `qa-round3/QA_3-8-48_REPORT.md`, `qa-round3/EXIT_CRITERIA.md`, `qa-round3/e2e/E2E_RUNBOOK.md` 읽기.
- **핵심 차단 사유 3개:** (1) 연결 Supabase 프로젝트 메타데이터 2개, 전용 근무모아 QA 프로젝트/branch 없음. 운영 DB 절대 읽기/쓰기 금지. (2) QA HTML 안에 운영 Supabase URL·anon key가 하드코딩돼 직접 열면 운영 연결 위험. (3) 이 세션 Playwright 시스템 Chromium에서 localhost/file/data 접근 `ERR_BLOCKED_BY_ADMINISTRATOR`. 추가로 독립 서버 기본 schema 없고 저장소 SQL은 증분 migration뿐.
- 신규 보조 도구 `qa-round3/e2e/prepare-qa-site.mjs`: Node.js로 **사용자가 확인한 새 QA 프로젝트 URL + legacy anon JWT**만 받아 환경변수 누락/운영 URL/운영 key/JWT ref 불일치/service_role을 fail-closed. 5개 합성 검증 PASS. 원본 `index.html` 수정 없이 OS 임시폴더 QA 전용 index+정적 자산 복사. 서버 네트워크/운영 DB 접근 없음.
- `qa-round3/e2e/E2E_RUNBOOK.md`: **P0 5개/P1 3개 실서버/실브라우저 테스트** 및 독립 clean QA schema/가짜 직원 필요조건, PASS/FAIL 증빙/승인 기준. 현재 8개 E2E 모두 BLOCKED/미검증.
- 제품코드 불변: `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance JS blob `f8e8e469503d0abf53844aa85188b15b09a95238`, `ver20261018-2313`. `main` baseline `6c784210e048426f18a486d5602652626d97574d` 불변. 48 신규 제품 결함 0 (환경 차단은 제품결함 집계 제외). QA 도구/보고서만 GitHub 커밋.
- **다음 행동:** 독립 Supabase 새 프로젝트 및 비용 승인·민감정보 없는 기본 schema 준비, 사용자 컴퓨터나 지원되는 QA 브라우저/모바일 환경 확보. 운영 프로젝트의 clone/branch/import는 실 데이터 위험 있으므로 금지. 그 전에는 49번 등 숫자만 반복하는 코드는 중단. 사용자 최종 배포 지시 전 main 병합 금지.
- 연결 안정성/간략 보고, 보고서는 GitHub, ZIP 불필요.

갱신(KST): 2026-10-20T20:31:37+09:00.
