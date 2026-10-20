# 근무모아 3차·깊이8 — 3-8-53 무료 로컬 Docker 공개 포트 안전검수

## 공식 결과
- **3-8-53 LOCAL-DOCKER-PORT-GUARD VERIFIED WITH SYNTHETIC CLI / REAL DB E2E BLOCKED / NOT CLEAN.**
- QA 프로젝트용 보조 도구 안전성 강화 **1개 분야**, 근무모아 신규 제품 결함 **0종**. 3차 누적 제품 결함 **37종 유지**. 운영 `main` 커밋 `6c784210e048426f18a486d5602652626d97574d` 및 직원 DB/비밀번호/실 근태/지문·운영 RPC·SQL 변경 **0**. 유료 Supabase 프로젝트·비용 **0**.
- 제품 QA `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance JS `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313` 불변.

## 실제 수행
1. 52 공식 상태/인계와 QA 및 main HEAD 직접 대조; 52의 GitHub 실제 PowerShell/Node 도구 원본 확인.
2. 실행 환경 재검사: Node v22.16.0, Git 가능. **Docker 실행파일·docker.sock·Supabase CLI·psql·PowerShell이 없음**. 사용자 Windows PC에 접근·설치할 수 없으므로 실제 Docker/Supabase local stack **미시작**, 앱 실 E2E **미실행**.
3. Supabase 공식 로컬 개발 가이드에서는 독립 loopback Docker 네트워크 `--network-id` 옵션을 권장. 하지만 네트워크의 기본 호스트 바인딩 설정만 검사하는 52의 bootstrap은 **실제 실행된 각 컨테이너가 공개한 포트 바인딩 상태를 사후 검증하지 않음**. QA 보조 도구 안전 갭으로 파악(근무모아 제품 결함과 분리).
4. 신규 읽기전용 `qa-round3/e2e/check-local-qa-docker.mjs` 제작: 별도 `workmoa-local-only` 네트워크만 허용, Docker context local 한정, `DOCKER_HOST`/`DOCKER_CONTEXT` override 거절, `docker ps/inspect`로 네트워크 내 **모든 실행 중 컨테이너 published HostIp=127.0.0.1** 검사, API 54321/Studio 54323 포트 실제 존재 필수. real DB/query/직원 데이터 접촉 없음.
5. **실제 Node v22.16.0의 child_process 실행 12/12 PASS**, `node --test qa-round3/e2e/check-local-qa-docker.test.mjs`: 가짜 Docker CLI 정상 loopback 통과, 원격 context, 컨테이너 없음, 0.0.0.0/IPv6:: 공개, 잘못된 API 포트와 포트 값, Studio 미노출, 잘못된 Docker inspect JSON, DOCKER_HOST/DOCKER_CONTEXT override, 다른 network name을 모두 fail-closed 확인. Github에 올라간 두 파일의 Git blob SHA는 각각 로컬 실제 시험본 `1d41a16da83310707133193f113e895470b9ff66` / `199bb73487642942c7919794c5f791648b29dc80`와 일치 확인. 따라서 **테스트한 정확한 원본을 GitHub에 보존**.
6. `start-free-local-qa.ps1` 개선: Docker 명령 전에 환경 override 제거 요구. `supabase start --network-id` 직후 새로운 Node guard 실행; 공개 포트 부적합 시 **`supabase stop`을 호출해 해당 로컬 스택만 중지**하고 QA 정적 웹을 열지 않음. 정상 시 다음 local status/QA site 생성 경로 진행. **Windows PowerShell에서 실제 실행한 것은 아님.**
7. GitHub `LOCAL_FREE_QA_README.md`, `START_HERE_NEW_CHAT.md`, `EXIT_CRITERIA.md`, 공식 상태 갱신. 모두 **qa-3-8 검수 브랜치에만**.

## 남은 위험·다음 단계
- 무료 로컬 QA 환경 자체는 설계 가능하고 cloud 청구 0원이나, **Windows PC Docker Desktop + Node + Git이 사용자 PC에서 설치/실행되는 실제 증거가 없음**. Docker Desktop의 이용 조건/라이선스 및 디스크·RAM은 해당 PC에서 확인 필요.
- GitHub SQL은 증분 파일 16개만 있고 전체 기초 schema/가짜 직원·71 RPC 계약 중 이름 일치 3개만 있으므로 **local Supabase가 켜져도 앱 로그인/PIN/근태/지문/Realtime 실 E2E는 자동 완성되지 않음**.
- 다음 3-8-54는 Windows 로컬 환경이 실제 가동되고 순수 합성 기초 DB/RPC 구축이 가능해졌을 때 실증 단계로 진행. 환경 확인 전 동일 도구 mock 블록 반복 금지. 운영 DB clone/dump/link/remote 로그인 금지, user 최종 승인 전 main 배포 금지.

작성 KST 2026-10-20T22:30:37+09:00.
