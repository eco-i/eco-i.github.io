# 근무모아 3차·깊이8 — 3-8-52 무료 로컬 QA 환경 구축 준비 결과

## 공식 판정
- **3-8-52 FREE LOCAL QA TOOLING PREPARED, DB RUNTIME BLOCKED, FULL APP E2E NOT CLEAN.** 사용자 요청에 따라 유료 cloud 프로젝트 생성 **0**, Supabase 신규 유료 자원 **0**. 새 제품 결함 **0종**, 3차 누적 **37종 유지**.
- GitHub QA 브랜치 `qa-3-8`에 무료 로컬 환경 도구 **5개** 업로드: `prepare-local-qa-site.mjs`, `prepare-local-qa-site.test.mjs`, `serve-local-qa-site.mjs`, `start-free-local-qa.ps1`, `LOCAL_FREE_QA_README.md`. 모두 `qa-round3/e2e/` 아래에 배치. QA 서버는 새 Windows 로컬 디렉터리로 제한, `127.0.0.1`에만 제공되도록 설계.
- 제품 `index.html` SHA `08867d7117ad9ae5a8247eda8d223687af2b8411`, `maintenance-20261018.js` SHA `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313` 그대로. 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d` 그대로. 운영 직원 DB·실 비밀번호·지문·SQL/REST/RPC·배포 접촉 **0**.

## 실제 로컬 실행/검사
1. 본 ChatGPT 컨테이너 자체의 명령 검색: **Node v22 있음, Python 있음**, **Docker, Docker socket, Supabase CLI, PostgreSQL/psql, Podman 없음**. DNS/외부 패키지 저장소 연결 차단으로 이 환경에서 Docker/CLI 설치·로컬 DB 시작 **실패/미수행**. 사용자의 Windows PC를 조작·설치할 수 없음.
2. Supabase 현재 공식 local-development 가이드 직접 확인. `supabase init`/ `supabase start`는 Docker 호환 컨테이너 런타임이 필요하며 클라우드 결제와 무관한 로컬 DB로 작업 가능. CLI는 사용자의 별도 폴더에서 npm dev dependency로 정확한 버전 고정 후 사용하도록 PowerShell 자동화 작성. **Windows 스크립트는 이 Linux 컨테이너에서 실행 테스트하지 못함**.
3. **실제 Node v22 로컬 합성 fixture 생성기 검사 15/15 PASS** (도구 개발 과정의 테스트 원본 / GitHub에 같은 목적의 재현용 검수 스크립트 저장). 운영 URL·운영 key·secret/service_role 거부, 오직 local `http://127.0.0.1:54321` 허용, 현행 publishable+익명 JWT 지원, 정적 자산 내 cloud URL 탐지, 기존 CSP 및 필요한 에셋 누락 fail-closed. 정상 생성물에는 `[로컬 QA 전용]` 타이틀과 `connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321` CSP.
4. **실제 Node 기반 local HTTP server 7/7 동작검사 PASS**: GET index, GET version, HEAD, POST 405, 미등록 URL 404, 인코딩 경로탈출/역슬래시 경로 404. 생성기·서버는 가상 index/키/주소만 이용하였으며 운영본 데이터 로딩하지 않음. GitHub에 저장한 실행 도구는 원본 시험도구와 구현 형식에 작은 차이가 있어 **Windows 및 GitHub에 올라간 정확한 파일을 실제 기기로 실행했다고 주장하지 않음**.
5. 안전 장치: 별도 `qa-3-8` branch, 사내 직원 정보 미사용, 기존 Supabase remote link/login/import/database dump 명령 금지, 로컬 Docker context 및 loopback network binding 확인, API URL/키를 local CLI status에서 읽되 화면에 출력하지 않음.
6. **가장 큰 잔여 BLOCKER**: GitHub 증분 SQL 16개는 앱 literal RPC 71종 중 같은 이름 CREATE 3종만 확인되는 불완전한 기본 schema. 깨끗한 로컬 Supabase를 켠다고 곧바로 근무모아 로그인/근태/지문/관리자/휴일근무 SQL E2E 가능한 게 아님. **가짜 직원·권한·함수·테이블을 포함한 완전한 합성 기본 schema/RPC 구성 필요**. 운영 DB를 덤프하거나 직원 데이터를 가져오지 않음.
7. 실제 Playwright Chrome 2탭/Web Locks/Android iOS PWA, 진짜 Supabase RPC 동시성 및 Realtime/PIN/사진 E2E는 **모두 미실행**. 46/47 isolated 코드 CLEAN 2회, 51 합성 Chromium CSP 11/11은 종단간 통합 PASS가 아님.

## 다음 실질 작업
- 사용자의 **개인 Windows PC에서** GitHub QA 브랜치의 `LOCAL_FREE_QA_README.md`를 참조하여 Docker Desktop/Node/Git 설치, `start-free-local-qa.ps1` 실행이 필요. 비용은 Supabase 클라우드 월 이용료 0이며, Docker Desktop 라이선스 조건은 사용 환경에 따라 확인.
- 로컬 스택 가동 결과와 Docker/CLI 오류 로그에서 **키·토큰을 제거한 내용**만 공유하면 다음 단계에서 완전 synthetic 기본 schema/RPC를 설계·추가하고 실제 2-user DB/E2E까지 검증할 수 있다. DB로부터 운영 데이터를 수집하지 말 것.
- 같은 유형 모의검수 블록을 불필요하게 추가하지 않음. **전체 3차 검수 미종료, 3-8-53은 실제 로컬 환경 기동과 합성 DB 준비가 가능해진 경우에만.**
- 사용자 명시 명령 전 `main` 배포/운영 DB 수정 금지.

작성 KST 2026-10-20T22:15:46+09:00.
