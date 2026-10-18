# 초과근무 삭제·저장 결함 / 복구 인수인계 (2026-10-18)

## 신고
- 2026-10-30 조출 계획 1시간에서 '삭제'→'저장' 후 '닫기'를 누르면 '저장하지 않은 내용' 경고가 남음.
- 사진에서 화면의 0분, '수정 중' 배지 확인. 실기기에서 서버 레코드가 삭제되었는지는 미확인.
- 사진의 하단 버전은 ver20261018-1200, 점검 당시 GitHub main 최신은 ver20261018-2041 (구버전 캐시 가능성 있음).

## 확인된 실제 결함
- 운영 Supabase public 스키마에 UI가 호출하는 save_my_overtime_day_v2와 save_my_overtime_entry_v2 RPC 둘 다 없음. 기존 v1 RPC만 존재. 서버 저장/완료 체크 실패가 예상됨.
- saveOvertimeDay()의 catch에서 저장 오류를 overtimeDetailError에 표시하더라도 finally에서 syncOpenDetailPermissionsPreservingDraft()가 지워 버릴 수 있음.
- 정상 쓰기 이후 서버 재동기화 실패에도 과거 캐시로 상세창을 재렌더하고 초안 기준을 리셋하는 위험 경로가 있었음.

## 처리
- 기존 v1이 이미 구현한 서버 인증, writable/배치 유효성, 10분 단위·날짜 검사, 조출·야근 2슬롯 변경 및 감사로그 보존.
- v2 함수 2개 추가: 인증·권한 재검증 후 직원+날짜 advisory transaction lock에서 현재 DB 레코드와 클라이언트 updatedAt/ID/minutes/completed 스냅샷 비교. 충돌 시 쓰기 없이 STALE_OVERTIME_DAY / STALE_OVERTIME_ENTRY; 일치 시 기존 v1 원자 저장 호출. PUBLIC 실행권한 회수, anon/authenticated EXECUTE만 부여(기존 커스텀 세션 RPC 모델).
- frontend: 저장 실패 안내는 finally 이후에도 표시; 충돌 사용자 안내; 성공했지만 재동기화 실패한 경우 과거 서버 캐시로 UI/dirty baseline을 되돌리지 않음.
- APP_VERSION·버전 표시·version.json·업데이트 기록 통일.

## 검증 / 잔여
- 완료: HTML 내부 스크립트 2개 JavaScript 구문 파싱 성공. 서버 함수 2개 생성/서명/SECURITY DEFINER/anon·authenticated EXECUTE 확인.
- 완료: 무효 세션 테스트에서 SESSION_EXPIRED 확인. 유효 계정 임시 세션을 DB 트랜잭션 안에 생성해 신규 조출 60분 등록, 동일 레코드 완료 체크, 구 버전 스냅샷의 완료 변경 및 날짜 삭제 충돌 차단, 정확한 최신 스냅샷으로 날짜 삭제, 빈 날짜 0분 재저장 검사에 모두 통과. 전체 시험 ROLLBACK; 실데이터 보존.
- 실제 사용자 기기의 저장·삭제 E2E 및 월간 합계·새로고침 복구, 기존 초과근무 레코드 안전성은 배포 후 검증이 추가로 필요.
- 백업: backup-main-before-overtime-rpc-repair-20261018.
- 정비기간 관리 기능은 이번 변경에 포함하지 않음.
