# 근무모아 독립 QA E2E 실행 계획 / 환경 게이트 — 3-8-48

> **현재 판정: 준비 도구 작성·격리 환경 미확보, 실제 E2E 미실행.** 운영 main 및 실 직원 DB/세션/사진/SQL/RPC 접근·실험 금지. 테스트는 가상 직원·모의 출퇴근 사진만.

## 0. 확인된 사실 (2026-10-20)
- Supabase 연결의 **프로젝트 목록 메타데이터만** 조회: 기존 프로젝트 2개(근무모아 운영 송도 관련 프로젝트 + 다른 용도 프로젝트), **독립 근무모아 QA 프로젝트 없음**. 송도 프로젝트의 개발 브랜치 목록도 비어 있음. **실제 DB 테이블·고객기록·키·세션을 열지 않았음.**
- `qa-3-8/index.html`은 기본 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 **운영 프로젝트를 직접 가리킨다**. 검수 HTML을 그대로 게시·브라우저 실행하는 것만으로도 운영 RPC를 호출할 위험이 있다. QA 전환 없는 live browser 검수 **절대 금지**.
- GitHub `db/migrations/`에는 **증분 SQL 16개**만 있으며 완성된 독립 DB의 기본 `employees`, `app_sessions`, `_session_employee`, `_require_admin` 등의 기초 스키마/함수를 *처음부터 재생성하는 migration 집합이 없음*. 빈 QA 프로젝트에 QA SQL을 바로 실행해도 전 기능이 작동한다는 근거 없음. 운영 DB에서 직원 row나 백업 데이터를 가져오지 않는다.
- GitHub 현재 브랜치에는 `.github/workflows`, `package.json`, 기존 Playwright/E2E 스위트가 없음.
- 표준 Playwright + 시스템 Chromium 실제 재시도: `about:blank`은 열리지만 `file://` / `data:` / `http://127.0.0.1` 탐색 모두 `ERR_BLOCKED_BY_ADMINISTRATOR`. 여기서 실제 동일 출처 2탭/모바일 실행은 **불가**. 브라우저 권한 우회 플래그로 보안 정책을 깨지 않음.

## 1. 새 QA Supabase 준비 — 실행 전 조건
1. **기존 운영 프로젝트의 DB branch/backup/restore/clone을 QA로 사용하지 말 것**: 실 직원 데이터 복제 위험. 새로운, 비용·권한이 확인된 완전 독립 QA 프로젝트만 사용. 클라우드 생성·과금 관련 **사용자 승인 후** 진행.
2. **기본 스키마부터 재현 가능한, 민감정보가 없는 QA 전용 schema**를 별도로 마련. 운영 직원 레코드·세션 토큰·지문 base64·관리자 비밀번호 절대 복제 금지. 증분 migration 중에는 원본 기반 테이블·RPC가 없어서 그대로 적용 불가능한 항목이 있음. 처음에는 미실행 상태로 둔다.
3. 가상 직원만 등록: 서로 다른 관리자 1명, 일반 직원 2명, 조회전용 또는 퇴사 상태 테스트 계정 1명. 가짜 고유 직원 식별자/비밀번호 사용. 지문은 사람이 나온 원본 사진 대신 표식이 들어간 synthetic image.
4. **QA 키는 해당 QA 프로젝트의 검증된 `sb_publishable_` 공개 키 또는 legacy anon JWT(role=anon, ref=QA ref)**. 서비스 역할/관리자/운영 key는 사용하지 않는다. QA 프로젝트의 RLS와 `SECURITY DEFINER` RPC, 일반 데이터 직접 접근 금지, 관리자 별도 PIN 검증을 독립 확인.

## 2. QA 전용 사이트 임시 생성 — 실행 도구 포함
- `qa-round3/e2e/prepare-qa-site.mjs`: Node.js 기본 기능만 사용. **외부 네트워크 연결·GitHub/DB 쓰기 없음**. 입력된 QA URL·anon key의 원본 운영 URL/키 일치, Supabase hostname, JWT `role=anon` 및 `ref=QA project` 불일치를 모두 fail-closed.
- 필수 입력: `QA_ISOLATED_PROJECT_CONFIRMED=YES`, `QA_SUPABASE_REF`, `QA_SUPABASE_URL`, `QA_SUPABASE_ANON_KEY`. 환경 변수를 **실제 독립 QA 프로젝트를 확인한 본인 컴퓨터에서만** 설정하고 `node qa-round3/e2e/prepare-qa-site.mjs` 실행. 안전확인에 통과하면 OS 임시 폴더에 `index.html` + 정적 리소스 복사. 저장소 root 운영파일 변경 없음.
- 현재 원본은 `sb_publishable_` 공개 키를 사용한다. QA 공개 키는 QA Dashboard에서 프로젝트 소속을 확인한 뒤에만 `QA_PUBLISHABLE_KEY_VERIFIED=YES`와 함께 입력한다. 이 플래그는 암호학적 검증을 대체하지 않는다. `sb_secret_`/`service_role` 키는 절대로 브라우저에 입력하지 않는다. `service_role`/운영 키가 거부되는지 확인.
- **QA 사이트 출처는 운영 사이트와 분리**하고 테스트 브라우저 개발자도구/방화벽에서 운영 Supabase 호스트 요청이 **0건**임을 검증. 테스트하는 앱에서 공식 운영 URL로 요청이 조금이라도 발생하면 중지.
- 자동 업데이트·manifest·페이지 캐시가 운영 출처로 돌아가지 않게 별도 QA origin 사용. 배포가 아니라 임시 테스트 호스트.

## 3. 실제 E2E 필수 케이스 / 판정 기준

| 우선 | 시험 | 절차·기대 결과 | 현재 |
|---|---|---|---|
| P0 | 동일출처 2탭 세션/Web Locks | QA 직원 A 로그인, 두 탭 동시 접속→A 로그아웃·B 로그인 및 동일 토큰 재로그인→옛 화면/관리자 잠금·메모 보호, 중복쓰기 0. Web Locks 허용/거절 양쪽 | BLOCKED |
| P0 | SQL 휴근 vs 편성 트랜잭션 | 가상 직원 휴근 저장 중 관리자 정비/공휴일 편성 변경을 2개 QA 세션에서 동시 실행. 변경 충돌은 한쪽 거절·롤백; 기록이 인정 불가 공휴일로 역행하지 않아야 함. 수정 SQL 파일은 QA에서만 적용 | BLOCKED |
| P0 | 정비 revision 경쟁 | 관리자 A와 B가 같은 편성 revision에 충돌 저장; 늦은 GET/POST의 revision 역행 0, 사용자 입력 손실 0, 동시 저장 1회 결과 일관 | BLOCKED |
| P0 | 근태 CAS·권한 | 직원 B의 근태 편집·삭제 중 관리자 변경/계정 readonly/disabled; 미승인 쓰기 0, 중복 삭제 0, 열려 있는 초안 보존·민감 화면 잠금 | BLOCKED |
| P0 | 관리자 PIN·실제 서버 응답 | 강제 초기 PIN 변경, 관리자 unlock 회수와 백업/복원 미리보기 RPC 경쟁, 오래된 응답 노출/저장 0 | BLOCKED |
| P1 | 지문사진·모바일 | Android 및 iOS/PWA 카메라/파일 picker→취소/선택/change 누락/백그라운드/BFCache 복귀→출퇴근 가짜 이미지 정확히 1회 저장 또는 안전 중단, 옛 사진 미노출 | BLOCKED |
| P1 | Realtime 따라잡기 | subscribe-after-snapshot, INSERT 연속, 오프라인→재연결, 오래 걸린 refresh와 계정 교체; 읽기 최종 상태 서버와 일치, 미저장 편집 보존 | BLOCKED |
| P1 | 연차·대정비·인사발령 | A~D조/일근·주2·야 전환, 10월 정비 및 휴일 편성, 인사발령 당일, 연차 차감 분·가용 인원 최종 UI/DB 일치 | BLOCKED |

## 4. 증빙·종료 규칙
- 케이스마다 **실제 QA 프로젝트 ref(기록 비공개 가능), 가상 계정 식별, Chrome/iOS/Android 버전, 날짜·전제조건, 액션/응답, DB before/after의 synthetic row 및 결과 PASS/FAIL, 원격 RPC 타임라인**을 기록. 실제 직원/개인정보는 기록하지 않는다.
- P0 전부 실제 격리 환경에서 PASS, P1 핵심 통과, unresolved HIGH/CRITICAL 0, 두 **독립된 E2E 위험 영역 CLEAN** 또는 사용자와 명시적으로 합의된 잔여 위험이 있어야 전체 3차 종료 가능. 46~47 mock CLEAN 2회는 이 기준을 대신하지 않는다.
- 사용자가 별도의 **최종 운영 배포 지시**를 내리기 전 `main` 병합·운영 DB SQL 실행 금지. QA 프로젝트 구성만으로 운영 배포 승인 아님.

작성 KST: 2026-10-20T20:31:37+09:00.

## 3-8-49 보완
- 현대 `sb_publishable_` 키와 legacy anon JWT 모두 QA 전용일 때 지원. `QA_SUPABASE_REF` 20자리 및 QA URL 호스트 일치 필수; 현대 키는 QA Dashboard에서 소속을 확인한 뒤에만 `QA_PUBLISHABLE_KEY_VERIFIED=YES` 선언.
- Node 오프라인 합성테스트 `node --test qa-round3/e2e/prepare-qa-site.test.mjs` **13/13 PASS**. 실제 서버 연결·운영 DB·직원 데이터 없음.
- 저장소의 16 증분 migration이 앱의 71 RPC 중 3종만 이름 일치 생성하므로, 독립 설치 가능한 QA 기초 스키마/함수 계약이 추가로 필요하다. `QA_BACKEND_GAPS.md` 참조. read-only 준비 확인 SQL `qa-schema-preflight.sql`은 독립 QA 프로젝트에서만 실행.
