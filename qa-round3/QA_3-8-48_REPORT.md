# 근무모아 3차·깊이8 — 3-8-48 환경·실제 E2E 게이트 진단 보고서

## 공식 판정
- **3-8-48 ENVIRONMENT-GATE ASSESSED / E2E BLOCKED**. 신규 제품 결함 **0종**. 3차 누적 제품 결함 **37종 그대로**. **CLEAN 판정 아님**: 실제 통합테스트를 실행할 수 있는 격리 환경이 없어 완료로 위장하지 않음.
- QA HTML blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance JS blob `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313` **변경 없음**. 운영 `main` baseline commit `6c784210e048426f18a486d5602652626d97574d` **변경 없음**. 실제 직원 DB/지문·근태 기록/인증정보/SQL/RPC 호출·배포 **0**.
- 이 블록에서 실제로 만든 것: `qa-round3/e2e/prepare-qa-site.mjs` (격리 URL/anon JWT 안전 게이트, 임시 QA 빌드), `qa-round3/e2e/E2E_RUNBOOK.md` (P0/P1 필수 실서버/실브라우저 게이트). 검수 브랜치 QA 문서·보조 도구만 변경.

## 실제 수행한 점검
1. **GitHub 공식 상태 직접 대조:** 47 완료/48 시작, 37 결함, 46~47 code scoped CLEAN 2회, 종료 E2E 미충족, 원본 app/maintenance blob 및 main HEAD.
2. **연결된 Supabase 프로젝트 '메타데이터'만 조회:** 확인되는 2개는 기존 SongdoFood 근무모아 운영 후보 및 별개 mapleland 프로젝트. 근무모아 전용 **별도 QA 프로젝트 없음**. SongdoFood 개발 브랜치 목록 **0개**. 운영 프로젝트의 테이블·키·DB 행·로그/SQL 접근 금지 유지.
3. **QA HTML 내 운영 연결 위험 직접 확인:** `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 하드코딩되어 QA git branch도 기본적으로 live backend로 향함. **검수 브랜치를 단순 호스팅해서 테스트하는 것은 운영 데이터 변경 위험**. 제품 결함이 아니라 실행/인프라 안전 blocker로 분류.
4. **독립 QA 스키마 부재:** GitHub 파일 트리(125 files) 확인. `db/migrations/` 증분 SQL 16개, QA fixes 3개, 완전한 clean baseline schema 없음. 예: `maintenance_schedule_state`가 `employees` 참조, SQL이 `_session_employee`, `_require_admin` 기초 RPC를 전제. 독립 QA에서 실제 E2E하려면 비식별/합성 기본 schema 작성이 선행되어야 함. GitHub Actions 워크플로/기존 E2E 스위트/패키지 매니페스트 없음.
5. **Playwright/Chromium 실제 탐색 probe 재실행:** 시스템 `/usr/bin/chromium`을 기본 보안 설정으로 실행. `about:blank` **PASS**, `file:///tmp/...`, `data:text/html`, `http://127.0.0.1` 각각 `ERR_BLOCKED_BY_ADMINISTRATOR`. bundled Playwright browser는 설치 경로 불일치, 시스템 실행파일은 탐색 차단. 정책 우회 시도 없음. 따라서 **이 런타임 실제 2탭/browser E2E 미실행**.
6. **QA-only 준비 도구 구현 및 실제 Node 로컬 합성 fixture 검사:** `node --check` 문법 통과. 필수 환경변수 누락 → exit2 거부, 운영과 동일 URL → exit2 거부, QA JWT ref mismatch → exit2 거부, `service_role` JWT → exit2 거부, QA 새 ref/role=anon만 → exit0 임시 index와 9개 자산 생성/원 운영 endpoint 제거 확인. **5개 합성 안전 시나리오 5/5 기대결과**. Supabase 실계정·서버로 연결하지 않음.
7. **E2E 우선순위/종료 기준 구체화:** Web Locks 동일출처 두 탭, SQL holiday-work serializability, 정비 revision 충돌, 근태 CAS/disabled/admin PIN, 모바일 사진/BFCache, Realtime, 연차·대정비 등 **P0 5건 + P1 3건**을 각 BLOCKED로 명시. `EXIT_CRITERIA.md`도 본 진단과 잔여 범위 명시.
8. **비용·승인:** 신규 Supabase 프로젝트는 과금 가능성이 있어 **사용자의 별도 비용 확인/승인 없이는 생성하지 않음**. 운영 프로젝트의 DB branch·restore·직원 백업을 QA로 활용하지 않는 원칙 유지.

## 공식 결론 / 다음 단계
- 46·47은 코드 범위 CLEAN 2회, 48은 **E2E 환경 게이트 진단 완료 (BLOCKED)**. 실제 3차 전체 QA **미종료**, 최종 운영 배포 승인 아님.
- **실제 종단간 위험**: 3-8-5-001 holiday-work concurrency SQL, 3-8-10/11 maintenance delayed save + revision, 같은출처 세션, admin PIN, 실기기 카메라/사진, Realtime 상호작용을 독립 QA 서버/브라우저에서 한 번도 통합 검증하지 못함.
- **49블록은 조건부**: 가상 데이터만 들어 있는 별도 QA Supabase와 완전 기본 schema/실제 브라우저 접근 확보 후 위 P0부터 실동작 검증. 환경 미확보라면 계속 mock 블록을 생성하지 말고 인프라 준비/위험 합의 단계에서 중지. `main`과 실 직원 DB 절대 변경 금지.

기록 KST: 2026-10-20T20:31:37+09:00.
