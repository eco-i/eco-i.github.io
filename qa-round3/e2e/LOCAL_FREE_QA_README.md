# 근무모아 무료 로컬 QA — 3-8-52

**사용료 0원인 로컬 개발 환경.** Supabase CLI + Docker Desktop + Node.js + Git 필요. 설치·Docker Desktop 라이선스 조건은 개인/조직에 따라 확인. 공식 문서: https://supabase.com/docs/guides/local-development

## Windows 실행

1. Docker Desktop 설치·실행, Node.js 20 이상과 Git 설치.
2. GitHub eco-i/eco-i.github.io 저장소의 `qa-3-8` 브랜치를 PC의 별도 폴더에 clone 후 해당 폴더에서 PowerShell 실행.
3. `powershell -NoProfile -ExecutionPolicy Bypass -File .\qa-round3\e2e\start-free-local-qa.ps1`
4. 성공하면 `http://127.0.0.1:54330`에 임시 QA 페이지, `http://127.0.0.1:54323`에 Supabase Local Studio.

자동 스크립트는 Docker가 로컬인지와 QA 브랜치를 먼저 확인하고, CLI를 `%LOCALAPPDATA%\workmoa-free-local-qa`라는 별도 폴더에 정확한 버전으로 설치한 뒤 로컬 프로젝트만 시작합니다. CLI에 로그인하거나 운영 프로젝트를 연결하지 않습니다. 컨테이너 네트워크 호스트 바인딩은 127.0.0.1만 허용하도록 확인합니다. 테스트 서버는 GET/HEAD만 허용합니다.

## 지금까지 검증된 범위

- 로컬 사이트 생성기 원본과 동등한 별도 합성 fixture에서 Node 15/15 PASS; 로컬 HTTP 서버에서 GET/HEAD 및 경로 차단 7/7 PASS. GitHub의 재현용 test 파일은 `node --test qa-round3/e2e/prepare-local-qa-site.test.mjs`로 다시 실행할 수 있습니다.
- **이 세션에는 Docker, PostgreSQL, Supabase CLI가 없어 실제 Supabase 로컬 스택을 켜지 못했습니다.** Windows PowerShell 실행도 직접 확인하지 못했습니다. 사용자의 PC에 원격으로 설치하지 않았습니다.
- 저장소의 증분 SQL 16개만으로 전체 근무모아 기본 DB 재현 불가능: 프런트엔드 literal RPC 71개 중 해당 migration에 일치 정의는 3개뿐. 가짜 직원·처리 함수·RLS 등을 구축해야 실제 앱 로그인/E2E 가능.
- 운영 SongdoFood DB, 운영 직원 명단/지문/인증/백업, main 접근·복제·수정 금지. `supabase link`, `supabase db push`, `supabase db dump`, `supabase db pull`, `supabase login` 금지. 이 스택을 인터넷에 공개하지 마세요.

## 문제 해결

- Docker 오류가 나면 Docker Desktop 실행/WSL2 설정/권한 확인.
- 네트워크 다운로드는 첫 Supabase CLI·컨테이너 설치에만 필요. 클라우드 Supabase 프로젝트 생성이나 월 사용료는 필요 없음.
- 시작 성공 후에도 SQL/RPC 기초 구성이 없으므로 **실제 근무모아 로그인 테스트를 성공했다고 주장하지 않습니다.**
