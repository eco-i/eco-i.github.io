# 근무모아 3차·깊이8 최신 인수인계

- **공식 마지막 완료 3-8-52: 무료 로컬 QA 준비 도구 GitHub 업로드 / 실제 Supabase DB 미기동 / 전체 앱 E2E BLOCKED, NOT CLEAN.** 다음 번호 `3-8-53`은 무료 로컬 서버가 실제 켜지고 합성 schema 작업에 들어갈 때 진행. 3차 신규 제품 결함 37종 불변(52 신규 0).
- 저장소 `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. `qa-round3/CURRENT_STATE.json`, `qa-round3/QA_3-8-52_REPORT.md`, `qa-round3/e2e/LOCAL_FREE_QA_README.md`, `EXIT_CRITERIA.md` 읽을 것.
- 새 QA 파일: `qa-round3/e2e/{prepare-local-qa-site.mjs,prepare-local-qa-site.test.mjs,serve-local-qa-site.mjs,start-free-local-qa.ps1,LOCAL_FREE_QA_README.md}`. PowerShell은 사용자의 Windows에서 독립 위치 `%LOCALAPPDATA%\workmoa-free-local-qa` 에 로컬 Supabase CLI를 설치하고 **Docker loopback-only network + supabase init/start** 후 로컬 사이트 `127.0.0.1:54330` 제공. cloud login/link/pull/push/dump 금지.
- ChatGPT 컨테이너에는 Docker/CLI/Postgres 엔진 없고 외부 패키지 다운로드 DNS 제한. 그래서 **사용자 Windows PC의 실제 Supabase 스택을 켠 적 없으며** PowerShell도 물리 Windows에서 검증하지 못함. 파일 생성기 합성 Node fixture 15/15 PASS, localhost HTTP 테스트 7/7 PASS는 개발용 검증만.
- 앱 자체 완성 E2E 불가: GitHub는 SQL 16개 incremental 파일뿐이고 앱 literal RPC 71 중 3만 일치 정의. 가짜 직원/세션/스키마/SQL/RPC를 **별도 새 로컬 서버에만** 설치·검증해야 한다. 기존 운영 Supabase·직원 기록·지문/비번/백업 절대 접근/복제 금지.
- 변경되지 않은 원본: QA HTML `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance JS `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313`. 운영 main SHA `6c784210e048426f18a486d5602652626d97574d` 불변, SQL/직원 DB 변경 0.
- 다음 실질 순서: Windows 로컬 스택 기동(인증키 노출하지 말 것) → 비민감 합성 DB schema/RPC 구체화 → QA 웹 두 탭/Realtime/정비 SQL/근태·지문·PIN E2E 검증 → 미해결 HIGH 0 및 최종 승인. 무의미한 동일 mock 블록 증식 금지, ZIP 전달 요구 불필요.
- 채팅 용량/연결 안정성 우선, 상세 GitHub, 짧게 보고.

KST 2026-10-20T22:15:46+09:00.
