# 근무모아 3차·깊이8 — 관리자 권한 박탈·세션 만료 부분 실브라우저 QA (2026-10-25 KST)

> **21/21 SCOPED PASS** — 실제 Chromium UI + 합성 권한 응답 + 폐기형 PostgreSQL로 관리자 역할 박탈·다시 부여·세션 만료 불변식에 한정하여 검증. **공식 3-8-54 미시작 · 전체 NOT CLEAN · 운영 배포 보류.** 이 결과는 운영 원본 Supabase Auth/PostgREST/RLS/PIN 권한·원본 SQL 통합시험이 아님.

## 1. 실제 GitHub Actions 증빙

- **최종 성공**: [Run 40158058928](https://github.com/eco-i/eco-i.github.io/actions/runs/40158058928), HEAD `37f9991e70947657616fddd099f166b72e4e1ad5`, job `admin-authority-chromium`. 로그에 `AUTHORITY_PASS` **21개**, `AUTHORITY_SCOPE_PASS 21 scoped assertions` 및 workflow **SUCCESS**; 실패 0.
- 처음 실패한 [Run 40157641486](https://github.com/eco-i/eco-i.github.io/actions/runs/40157641486)는 **테스트 코드 오류**: `page.wait_for_function`에 문자열 JavaScript 전달 중 CSP의 `unsafe-eval` 제한과 충돌. 관리자 권한 박탈 단계는 정상 실행됐으며 세션 만료 단언까지 진행하지 못했음. **운영/QA CSP를 완화하지 않고** Playwright `locator.wait_for(state="visible")` 및 사후 상태 `evaluate`로 검증 스크립트만 수정. 최종 성공 실행으로 보완 확인.
- QA용 스크립트 `qa-round3/e2e/ci/browser-admin-authority-revocation.py`, 워크플로 `.github/workflows/workmoa-qa-admin-authority-revocation.yml`; 테스트 앱은 원본 QA `index.html` 실제 Chromium에서 실행. 백엔드 직원·권한·PIN 검증 응답은 시험용 fake HTTP; PostgreSQL은 폐기형 CI DB.
- 신규 21개는 **기존 2관리자 CAS 21/21과 다른** 검수 항목이며 기존 성공한 반복시험 재실행 아님.

## 2. 이번 21개 불변식

1. 폐기형 PG 초기 revision 0, 이벤트 0.
2. A는 가상 관리자 UI 로그인 및 2차 PIN 게이트 통과 상태.
3. 서버 모의 직원목록이 A의 `is_admin=false`를 반환 → 실제 앱 직원목록 재조회 후 관리자 권한 하향 반영.
4. 옛 관리자 unlock 무효화, 관리자 도구 숨김.
5. 미저장 계정상태 편집 창/메모 보존, 저장버튼 잠금.
6. 오래된 저장 핸들러를 직접 호출해도 변경 요청/PG 쓰기 0.
7. 서버 모의 직원목록에서 관리자 재부여 후에도 이전 unlock 자동복구 불가.
8. 미저장 초안은 그대로이며 명시적인 재인증 전 저장 잠금 유지.
9. A의 권한박탈·재부여 전체 동안 DB revision 0 / 이벤트 0.
10. 독립된 가상 관리자 B가 실제 계정변경 UI의 저장 버튼 클릭 후 시험 서버가 확정 `SESSION_EXPIRED` 반환.
11. 세션 token 및 사용자 식별 해제, 앱 숨김/로그인 화면 표시/관리자 unlock 없음.
12. 만료 확정 저장 시도는 합성 SQL 변경 0.
13. 외부 호스팅 Supabase 호출 0, 두 Chromium 컨텍스트의 uncaught JS 오류 0.

로그의 구체적인 단언 건수는 21개. 위는 의미별로 묶은 요약이며 항목 번호가 테스트 단언 개수는 아니다.

## 3. 이번에 읽기 전용으로 확인한 서버 원본 **후보** 계약과 한계

기존 비공개 서버 저장소 `ahnbest23-hash/workmoa-backend-private`의 `DRAFT_PERSONNEL_FIRST_FIVE_REAL_SCHEMA_CAS_REVIEW_ONLY_20261023.sql.txt`는 **운영 설치 기록이 아닌 차단된 리뷰 전용 후보**이고 실행하지 않았다. 이 파일에서 확인한 것은 다음 **설계상 후보**다.
- `admin_set_employee_account_status_v3`: `p_token, p_employee_id, p_account_status, p_effective_date, p_note, p_expected, p_expected_revision` → boolean.
- `admin_apply_personnel_batch_v3`: shared `p_expected_revision` 및 `p_expected` 배열 → jsonb.
- `admin_cancel_personnel_batch_v2`: `p_expected_batch`와 shared `p_expected_revision` → boolean.
- 후보 `workmoa_guard.require_epoch`는 관리자 검증·공유 generation row FOR UPDATE·재검증·32문자 revision 비교를 수행하도록 작성됨. 그러나 이 후보의 revision 생성 방식은 현재 21/21 합성 테스트의 단순 `revision = lpad(to_hex(n),32,'0')` 구현과 다르다.
- `OPERATING_PERSONNEL_REVISION_V1_4_WRITER_RELEASE_BLOCKER_20261023.md`는 당시 V1 writer 경로가 shared generation을 우회할 수 있다고 문서화함. 이 기록을 10월 25일 실제 운영 원본 설치 상황으로 확대해 단정하지 않는다.

따라서 이번에 증명한 것은 **사용자 화면에서 role down/up 및 확정 만료 처리**와 **시험용 서버의 쓰기 0**이며, 원본 인증·권한/RLS·PIN 변경 시점의 원자적 저장 차단, V1 우회 방지 및 실제 original revision 포맷은 **여전히 미검증**.

## 4. 안전 경계·현재 상태

- 작업 시작 전 운영 `main` HEAD `9052b00ea204e46754cc99fabfdc1f0eb8ef6cbb`; 운영 배포/실제 직원 DB 변경/운영 Auth 및 RPC 권한 변경 **0**.
- 연결 Supabase 프로젝트 메타데이터상 Workmoa 전용 독립 QA 프로젝트 **없음**. 신규 유료 프로젝트 생성·다른 프로젝트 재활용 금지.
- 지원센터 추가답변 전 세 남은 RPC `admin_restore_data_v2`, `admin_reset_data_v2`, `admin_restore_safety_backup_v2` 설치·실행·우회·V1 권한 조정 전면 금지.
- 운영 RPC 복구 **23/26=88.5%** (인수인계 기준; 실제 운영 카탈로그 재실측 안 함).
- 공식 3차 마지막 **3-8-53**, 다음 **3-8-54 미시작**; 신규 37종 유지; **전체 NOT CLEAN**.

## 5. 다음 순서

1. 원본 권한/PIN 변경 및 공유 CAS 계약의 빈틈을 단순 모의 boolean 검사와 구분하는 표 작성.
2. 독립 Workmoa QA Supabase+Auth+PostgREST+RLS 원본 동등 설치를 위한 정본 스키마/키/가상계정/가격/권한 승인 조건 확인. 승인 전 클라우드 생성 불가.
3. 위 조건이 마련된 이후에만 공식 3-8-54 시작. 브라우저 합성 PASS로 공식 E2E 또는 CLEAN 처리 금지.
