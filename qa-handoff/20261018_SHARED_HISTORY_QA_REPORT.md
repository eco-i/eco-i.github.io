# 근무모아 공유 업데이트 내역 기능 QA 인수인계 (2026-10-18)

## 운영 현황
- 운영 배포 코드 기준 main: 595ac7c1ace1e8d6e7f51968be46795dd1529c8e (ver20261018-1200) **GitHub Pages 배포 성공**
- 기능 브랜치: feat/shared-update-history-20261018
- Supabase: SongdoFood / fnzgjidzdazlodmjhmes
- DB 마이그레이션: shared_site_update_history_20261018 **실DB에 적용 완료**
- 운영 웹 기능 배포: **2026-10-18 GitHub Pages Actions 39097119511 성공**
- 적용 운영 버전: ver20261018-1200 (HTML APP_VERSION, 하단 버전 표시, version.json 일치 확인)

## 완료 항목
- 공유 테이블 public.site_update_history: RLS 활성화, 브라우저의 테이블 직접 접근 차단
- list_site_update_history_v1: 유효 직원 세션만 조회
- admin_edit_site_update_history_v1 / admin_delete_site_update_history_v1: _require_admin() 서버 검증, optimistic revision 검사, audit_log 작성, soft delete
- 최초 하드코딩 기록 15개 초기화 + 이번 릴리스 내역 1개 = 총 16개 (전부 1개 이상 items)
- 기능 브랜치 파일: index.html, site-update-history.js, site-update-history.css, db/migrations/20261018_shared_update_history.sql
- 이번 릴리스 기록 SQL 적용 완료: db/migrations/20261018_shared_history_release.sql
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
- 실제 기기 표시 확인 (GitHub 코드에서는 version.json, APP_VERSION, 화면 하단 표시 일치 확인)
- 일반직원 중 현재 PIN 초기설정 상태를 벗어난 실제 계정의 권한 거부 직접 체험
- 초과근무·휴가·지문 사진 기존 기능의 실제 브라우저 회귀시험

## 배포 전 점검 항목 및 수행 결과
1. 완료: index.html APP_VERSION / UPDATE_HISTORY / 하단 버전 표시 / version.json 동일 ver20261018-1200 반영.
2. 완료: 새 버전 공유 DB 기록 INSERT...ON CONFLICT DO NOTHING 반영, 과거 기록 덮어쓰지 않음.
3. 서버 RPC 실제 트랜잭션 롤백 검증 및 관리자·직원 UI 모의검증 성공. 실제 관리자/일반 직원 기기 E2E는 여전히 미검증.
4. 완료: backup-main-before-shared-history-20261018 브랜치 생성 후 기능 브랜치를 main에 fast-forward 반영. Pages 배포 success 확인.
5. GitHub 측 새 버전·JS/CSS 파일·배포 성공 확인. 실제 기기 캐시·근태/사진/휴가 동작 회귀검증은 미검증.

## 주의
- DB 새 테이블과 RPC는 프로덕션에 반영됨. 기존 근태 테이블 스키마와 기록은 변경하지 않았음.
- 운영 main에 기능 반영 및 GitHub Pages 배포 성공 확인됨. **실제 기기 E2E까지 통과했다고 보고하지 말 것.**
- 기존 2-8-290 검수 범위/결함 통계는 그대로 유지하고 새 2차 검수 블록을 만들지 않음.

## 배포 후 확인 이력
- GitHub Pages Actions: https://github.com/eco-i/eco-i.github.io/actions/runs/39097119511 (status=completed, conclusion=success, commit=595ac7c1ace1e8d6e7f51968be46795dd1529c8e)
- 운영 코드: main 595ac7c1ace1e8d6e7f51968be46795dd1529c8e
- Supabase 업데이트 내역: 총 16개, 삭제 표시 0개
- live 웹 URL 직접 열람: 이용 가능한 웹 조회에서는 불가, GitHub Pages 배포 성공으로 확인했으며 실제 직원 기기 사용성은 아직 미검증
- 실제 사용자용 확인: 관리자 로그인 후 '업데이트 내역'에서 수정·삭제 버튼 표시 및 저장 반영 확인; 일반 직원 로그인 화면에서는 버튼이 없어야 함.
