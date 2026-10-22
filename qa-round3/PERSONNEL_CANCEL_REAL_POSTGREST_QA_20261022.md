# 3차 깊이8 · PRIVATE 인사발령 취소 실제 PostgREST/PG17 동시성 scoped PASS

**2026-10-22 KST | 3-8-54 사전검증 | 83/83 PASS는 특정 RPC 합성 격리시험이며 종합 NOT CLEAN.**

## 실증 증거

- PRIVATE [GitHub Actions Run 39755797680](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39755797680), Job `119747359468` **SUCCESS**, `PERSONNEL_CANCEL_TWO_ADMIN_REAL_POSTGREST_PG17_SCOPED_PASS`, `PASS_COUNT=83`.
- 실제 Github Actions 일회용 PostgreSQL **17.11**, 실제 PostgREST **14.18** HTTP, 합성 관리자 A/B·직원/발령·가짜 세션/권한/RLS 사용. 운영 송도 Supabase/실직원/지문/실서비스 토큰 접근 없음.
- 비공개 후보 `admin_cancel_personnel_batch_v2`의 **필수 3인자 `p_token,p_batch_id,p_expected_revision`** 및 조회 `list_personnel_assignments`의 `batch_revision`을 테스트. 원래 서버 SQL 복원본이 아니며 `WORKMOA_DRAFT_ONLY` 원본 설치차단을 통과한 *임시 REVIEW COPY만* DB에 적용.
- 두 관리자 동일 미래발령 취소: 실제 두 HTTP 요청 **200 + 409**, audit/snapshot 각 정확히 1건, revision 1회 증가. B의 note 변경과 A 취소 경합도 하나만 허용.
- 수정 후 원상복구 ABA stale 409, 이전 revision·이미 취소/과거 발령 차단, 구버전 두 인자 HTTP404, 역할 철회 중 실행 차단, PIN/readonly/만료·가짜 세션 거절, 감사·복구 snapshot 실패 시 변경 전부 rollback, non-BYPASSRLS 제한 소유자/직접테이블 조회·최종 EXECUTE 회수 확인.
- 이전 [Run 39755702352](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39755702352) FAIL은 **권한 ACL 테스트에서 PUBLIC pseudo-role을 실제 역할로 조회한 하네스 오류**. 올바른 ACL grantee=0 조회로 바꾼 최종 83/83 PASS. 제품 SQL과 혼동 금지.

## 종합 QA와의 경계

- 공개 `qa-3-8/index.html`은 이전 QA 작업에서 인사 취소 시 필수 `p_expected_revision` 전달·누락 차단·stale 안내를 추가했고 JS/source 19/19 PASS([Run 39752387949](https://github.com/eco-i/eco-i.github.io/actions/runs/39752387949)). 이번 검증은 **별도로 HTTP→synthetic DB SQL만** 검증한 것이며, **실제 사이트 취소 버튼→PostgREST→PG 통합은 아직 미실행**.
- 실제 운영 `main` 호출은 여전히 2인자, 실제 운영 `admin_cancel_personnel_batch_v2` 미설치. 운영의 발령 테이블·트리거·이전 쓰기 경로/복원 버전·서버 Auth/PIN/RLS가 synthetic 후보와 동등한지는 미검증. 실제 인사발령 수정 RPC 및 과거 SQL 레거시 CAS 우회 여부 추가 점검 필요.
- 기존 비공개 synthetic RPC 후보 범위 PASS **12/26 → 13/26종** (인사취소 1종 추가). 별도로 운영 설치된 메모 3종을 뺀 현재 미설치 **23종** 가운데 합성 범위 PASS 후보 **10종**, 나머지 13종 동등 실증 없음. 후보 통과는 설치 완료가 아님.
- QA 공식 신규 제품결함 **37종**, 마지막 **3-8-53 완료**, 다음 **3-8-54 미시작·BLOCKED**, 전체 **NOT CLEAN**. 운영 `main`·실직원 DB/운영 SQL·배포 변경 이번 작업 **0**. 별도 최종 운영 승인 필요.

비공개 전체 상세: `ahnbest23-hash/workmoa-backend-private/PERSONNEL_CANCEL_TWO_ADMIN_POSTGREST_CAS_GATE_20261022.md`. 공개 QA에는 원본 민감 SQL/RLS/토큰 없음.
