# 근무모아 3차·깊이8 — 관리자 권한회수/세션 만료 독립 QA 추가 준비 (2026-10-25 KST)

> **공식 3-8-54 미시작 · 전체 NOT CLEAN · 운영 배포 금지.** 이번 추가 작업은 QA 전용 새 실브라우저 시험을 구성하고 실제 운영본과 격리된 QA 서버의 현재 부재를 확인한 것이다. **새 시험 성공을 아직 검증하지 않았으므로 PASS로 기록하지 않는다.**

## 1. 검증 가능한 기존 상태

- 작업 시작 전 운영 `main` HEAD `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb`, 검수 `qa-3-8` HEAD `3c07501802294e5b2f08cd8afe4006aaab48a9b5` — 두 브랜치 모두 기록된 SHA와 `compare_commits` 결과 동일(차이 0).
- 기존 성공 Actions: `40155654981` 사진/초과근무 35/35, `40155795728` 인사 CAS 정적 22/22, `40156466192` 2탭 14/14, `40157002998` 관리자 합성 CAS 21/21. 이 네 검수는 반복하지 않음.
- Supabase 연결 프로젝트 메타데이터의 프로젝트 2개: `mapleland`, 운영 `SongdoFood` (`fnzgjidzdazlodmjhmes`). **독립 Workmoa QA 프로젝트 없음.** DB row, Auth, SQL/RPC, 비밀키, 운영 데이터는 조회하거나 변경하지 않음.
- `qa-round3/e2e/E2E_RUNBOOK.md`, `QA_BACKEND_GAPS.md`상 원본 동등 독립 QA 서버 기초 스키마/Auth/PostgREST/RLS가 마련되지 않음. 따라서 공식 3-8-54 E2E 진입 게이트는 계속 미충족.

## 2. 새 검수 구현 (합성·격리 범위)

QA 브랜치만 수정:
- `qa-round3/e2e/ci/browser-admin-authority-revocation.py`
- `.github/workflows/workmoa-qa-admin-authority-revocation.yml`

워크플로는 `qa-3-8` push/수동 실행만 허용하며 `main`과 운영 Supabase 변수 사용을 거부한다. 동일한 QA HTML과 실제 Chromium UI를 열되, 관리자/직원·세션·PIN·권한변경 응답은 **시험 전용 HTTP fixture**, DB는 폐기형 PostgreSQL이다. 관리 백업/초기화/복원 RPC는 실행하지 않으며 알 수 없는 API 쓰기는 404로 거절한다.

새 범위(기존 21/21 CAS 시험과 구분):
1. 로그인·2차 PIN 확인된 가상 관리자 A가 직원 계정 상태 변경 초안을 수정해 dirty로 유지.
2. 가짜 직원 목록의 A 관리자 권한을 제거하고 실제 앱 `loadEmployees()` 호출 → 최신 권한을 UI가 반영하는지, 이전 관리자 unlock이 제거되는지, 민감 도구가 숨겨지는지, 미저장 초안은 보존되고 저장 버튼이 잠기는지 점검.
3. 권한을 다시 관리자 상태로 되돌려도 이전 2차 PIN unlock이 자동 복원되지 않고, 원래의 dirty 초안이 잠겨 있는지 검증.
4. 별도 가상 관리자 B가 실제 화면 저장을 누른 때 가짜 서버가 명확한 `SESSION_EXPIRED`를 응답 → 세션/화면 정리, SQL 쓰기 0, JavaScript 오류 0 여부 확인.
5. 외부 Supabase 연결 0 확인.

**주의:** 현재 스크립트는 테스트 시나리오 및 실패 검출 단언을 추가한 상태다. GitHub Actions Run 결론과 상세 로그가 이 문서 작성 시점에 직접 확인되지 않았으므로 실행 성공 / 통과 개수를 보고하지 않는다. PIN **변경 자체**나 원본 RPC의 role enforcement를 검증했다고 주장하지 않는다.

## 3. 금지·보류 조건

- OpenAI 고객센터 기술답변 전 `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` 설치/실행/재마이그레이션/기존 V1 권한변경 금지. 다른 실행 경로로 우회하지 않음.
- 독립 Workmoa QA 프로젝트 구축에는 권한·비용 검토 후 별도 사용자 승인 필요. 다른 `mapleland` 프로젝트 재활용 금지.
- 원본 3-8-54는 독립된 원본 동등 QA Auth/PostgREST/RLS 및 합성직원 데이터 조건을 실제로 충족한 후에만 시작.

## 4. 현재 기록 (신규 PASS 주장 없음)

- 운영 RPC: **23/26 · 88.5%** (인수인계 기준, 이번에 서버 RPC 재실측 안 함).
- 임시 안정화: 4/4.
- 공식 3차: **3-8-53 마지막 완료; 3-8-54 미시작**.
- 신규 결함: **37종** 유지(이번 새 브라우저 테스트 결과 미확인, 추가 결함 판정 보류).
- 전체: **NOT CLEAN**.
- 운영 `main`·직원 DB·운영 Auth/RPC 변경: **0**.
- **다음 단계:** 새 QA Actions의 실제 Run ID, conclusion, 단언 로그 확인. 실패라면 합성 fixture 오류와 앱 오류를 분리하고 `qa-3-8`에서만 수정. 이어 PIN 변경 중 권한 상태·원본 CAS 서명/권한 계약을 독립 서버 없이 어디까지 검증할 수 있는지 선별한다.
