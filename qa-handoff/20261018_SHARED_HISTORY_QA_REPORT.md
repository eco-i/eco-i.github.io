# 근무모아 공유 업데이트 내역 기능 QA 인수인계 (2026-10-18)

## 운영 현황
- 운영 main: 4c4b9d0dd2639070e2c3784c76ac40c4ef0a3461 (ver20261017-2320) **변경 없음**
- 기능 브랜치: feat/shared-update-history-20261018
- Supabase: SongdoFood / fnzgjidzdazlodmjhmes
- DB 마이그레이션: shared_site_update_history_20261018 **실DB에 적용 완료**
- 운영 웹 기능 배포: **미실시**
- 차기 버전 후보: ver20261018-1200 (확정 배포 전 버전 정합성 재확인)

## 완료 항목
- 공유 테이블 public.site_update_history: RLS 활성화, 브라우저의 테이블 직접 접근 차단
- list_site_update_history_v1: 유효 직원 세션만 조회
- admin_edit_site_update_history_v1 / admin_delete_site_update_history_v1: _require_admin() 서버 검증, optimistic revision 검사, audit_log 작성, soft delete
- 최초 하드코딩 기록 15개 초기화 (전부 1개 이상 items)
- 기능 브랜치 파일: index.html, site-update-history.js, site-update-history.css, db/migrations/20261018_shared_update_history.sql
- 새로운 릴리스 기록 SQL 후보: db/migrations/20261018_shared_history_release.sql
- 클라이언트 쓰기 호출을 기존 SESSION_GUARDED_MUTATION_RPCS 집합에 런타임 등록하도록 외부 JS 보강

## 검증 사실
- 서버 인증되지 않은 토큰으로 조회/변경 요청 -> SESSION_EXPIRED
- 실제 DB BEGIN/ROLLBACK 시험: 유효 관리자 테스트 세션 생성(미커밋), 전체 15건 조회 성공; 수정 성공; 오래된 revision UPDATE_HISTORY_CONFLICT; 삭제 후 목록 제외. 최종 ROLLBACK 확인.
- 시험 후 DB 확인: 15개, 삭제 0, revision 1, 최초 최신 내용 그대로, 테스트 세션 0
- 모의 화면 JS 시험: 일반 직원 수정/삭제 버튼 없음, XSS 텍스트 이스케이프, 직원의 임의 버튼 클릭에서 변경 RPC 미호출, 관리자 버튼 표시·수정·삭제, 보호 RPC 등록 모두 통과
- 외부 JS와 주요 기존 inline JS 구문 파싱 통과
- GitHub main SHA가 공식 최종 커밋과 동일함을 비교로 확인

## 아직 검증하지 못한 항목
- 실제 브라우저/모바일 기기에서의 로그인/화면 조작, 네트워크 끊김, 동시 사용자 다중기기 E2E
- 배포 후 version.json, APP_VERSION, 화면 하단 표시의 실제 일치 여부
- 일반직원 중 현재 PIN 초기설정 상태를 벗어난 실제 계정의 권한 거부 직접 체험
- 초과근무·휴가·지문 사진 기존 기능의 실제 브라우저 회귀시험

## 배포 전 반드시 수행
1. 기능 브랜치의 index.html APP_VERSION / 기존 UPDATE_HISTORY / 하단 버전 텍스트와 version.json을 **동일한 새 버전**으로 원자적 변경 (현재는 구버전).
2. 해당 새 버전의 공유 DB 기록을 INSERT...ON CONFLICT DO NOTHING 방식으로 반영. 관리자가 수정/삭제한 과거 기록을 되살리거나 덮어쓰지 않도록 유지.
3. 실제 관리자 및 일반 직원 조작/권한/재로그인/새로고침/다른 기기 회귀 검증.
4. GitHub main 현재 SHA 및 필요한 백업 확인 후 승인된 기능 브랜치 내용을 main에 안전하게 반영.
5. 운영 캐시·버전·기존 근태/사진/휴가 영향 최종 확인.

## 주의
- DB 새 테이블과 RPC는 프로덕션에 반영됨. 기존 근태 테이블 스키마와 기록은 변경하지 않았음.
- 실제 클라이언트 기능은 아직 운영 main에 반영되지 않았으므로 사용자에게 완료·배포됐다고 보고하지 말 것.
- 기존 2-8-290 검수 범위/결함 통계는 그대로 유지하고 새 2차 검수 블록을 만들지 않음.
