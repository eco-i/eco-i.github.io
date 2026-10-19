# 근무모아 3차·깊이8 공식 인수인계

- **3-8-19 공식 완료 / 다음 3-8-20.** 19는 **범위 한정 CLEAN**, 신규 확정 제품 결함 0. 전체 앱·실기기 CLEAN 아님.
- 저장소 `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. 새 채팅은 GitHub `qa-round3/CURRENT_STATE.json`, `qa-round3/QA_3-8-19_REPORT.md` 먼저 확인.
- **3차 누적 신규 결함 11종 유지** (2차 과거 결함 540종 별도). QA 개선안 운영 미배포.
- 운영 main SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 APP_VERSION `ver20261018-2313` 변경 금지. 19에서 직원 DB/감사행 SELECT·쓰기, DML/DDL, main 배포 전혀 수행 안 함.
- **19 서버 읽기 전용 확인:** Supabase SongdoFood `EXPLAIN (FORMAT JSON)`로 `list_recent_audit_page(...,p_limit=52,p_offset=0)` Function Scan 플랜 성공. `ANALYZE` 없음·실제 SQL 함수 실행 없음. `pg_proc`에서 `_session_employee`→`_require_admin`→감사목록 함수의 역할/계정검사 읽기 전용 확인. `p_limit` 최대 100으로 52 유효. **실제 관리자 로그인 토큰으로 RPC를 호출한 것이 아니며, 실제 감사행 조회 성공으로 오인하지 말 것.**
- 실제 GitHub 함수 추출·mock Promise/DOM 검사: 관리자 권한 상실 시 감사/PIN/백업·인사 민감 목록 즉시 폐기 **14/14**, 오래된 요청·재열기·계정 교체·Realtime 경합 **56/56**, 개인/전체 근태 목록 및 모바일·JS/HTML 정적 **20/20**, 합계 **90/90 PASS**.
- 3-8-19 제품 코드 수정 없음. QA `index.html` 최신 blob **`778529b59b550ee1f3bf4e8e3b0ea27463427276`** 유지. 1MB 이상이므로 fetch_file 본문이 비면 GitHub fetch_blob으로 열기.
- 3-8-18의 '앞쪽 개별 삭제+동시 삽입' 합성 예외는 서버의 기존 자동 정리 정책(오래된 1000초과 기록만 삭제)과 다른 상황이어서 현재 확정 결함 아님. 문서에서 알고리즘 한계로 보존.
- **다음 3-8-20 권고**: 모바일 모달 중첩/포커스 회귀, 휴근·연차 등 보조 목록의 비동기 소유권, 최신 월 전환/Realtime 동시성. QA에서만 코드 수정, main/실직원 DB 변경 금지.
- 실제 관리자 계정으로 `p_limit=52` RPC, 실멀티기기/Android-iOS·Chromium 전체 로그인은 계속 미검증. 실제 직원/감사 기록으로 시험하지 말 것.
- 사용자 우선 연결 끊김·무응답·대화 길이 최소화. 중간 보고 짧게, 상세 GitHub, ZIP·수동 파일 업로드 요청 금지.
