# 2026-10-22 승인된 운영 메모 RPC 복구 (3차 QA와 별도)

- 사용자가 명시적으로 승인한 운영 DB 마이그레이션 `20261022074305_workmoa_personal_memo_v2_cas_restore_20261022` **SUCCESS**.
- 실제 설치: `save_my_memo_v2`, `delete_my_memo_v2`, `delete_my_memos_v2`; boolean, postgres 소유, SECURITY DEFINER, 고정 search_path, 익명·인증 역할 EXECUTE 허용. 운영 DB 메타데이터 재확인.
- 구버전 메모 쓰기 RPC 3종 `save_my_memo`, `delete_my_memo`, `delete_my_memos`는 비CAS 충돌을 막기 위해 브라우저용 EXECUTE 권한 철회. 과거 탭에서 메모 쓰기는 실패하므로 새로고침 필요.
- 실제 직원/지문/근태/개인메모 행은 조회·수정하지 않았고, **RPC DDL/ACL만** 승인 범위에서 변경. `main` HTML unchanged.
- 1차 SQL 검증식 오류로 마이그레이션 실패했으며 **전체 롤백 확인**; 수정한 2차 배포 성공. 신규 권한·구버전 차단·RLS·누락 26개 카탈로그 재점검 후 **남은 운영 RPC 누락 23개**.
- 2026-10-21 기준 `live-rpc-contract-snapshot.json`과 이전 인수인계의 `운영 0/26 RPC 설치`는 **과거 기록**. 이번 출시 후 메모 3종 운영 설치·23종 미설치가 최신 상태.
- 실제 사용자 세션으로 메모 쓰기 성공을 아직 실증하지 않았으므로 서비스 전체 CLEAN 아님. 사용자 테스트: 최신 사이트 새로고침 → 자신의 메모 작성·저장 → 닫기 경고 없음 → 같은 날짜 다시 열어 내용 확인.
- 공식 QA: 마지막 3-8-53, 다음 3-8-54 보류, 누적 신규 결함 37, 전체 NOT CLEAN. 합성 후보 검증 12/26은 변동 없음.
- 비공개 상세 보고서: `ahnbest23-hash/workmoa-backend-private/MEMO_V2_AUTHORIZED_PRODUCTION_RELEASE_20261022.md`.
