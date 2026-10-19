# 근무모아 3차·깊이8 최신 공식 인수인계

- **3-8-18 공식 완료 / 다음 3-8-19**. 18은 **범위 한정 CLEAN**(신규 확정 제품 결함 0), 전체 사이트·실기기 CLEAN 아님.
- GitHub eco-i/eco-i.github.io / QA qa-3-8 / 운영 main. 새 채팅 시작 시 qa-round3/CURRENT_STATE.json 및 qa-round3/QA_3-8-18_REPORT.md 직접 읽기.
- **3차 신규 누적 결함 11종**, 2차 과거 이력 540종 별도. 기존 11종 QA 수정안 운영 미배포.
- 운영 main SHA 6c784210e048426f18a486d5602652626d97574d, APP_VERSION ver20261018-2313. 실제 직원 DB 기록·SQL/운영 배포 변경 0건.
- **18 핵심 증거:** 실제 Supabase SongdoFood 프로젝트에서 SQL `pg_proc` 메타데이터를 READ ONLY 조회, `list_recent_audit_page`의 `p_limit`은 기본 50, 상한 100. QA의 요청 **52건은 함수 정의상 유효**. `perform _require_admin(p_token)` 인증 및 `created_at DESC,id DESC` 정렬 확인. `pg_trigger`로 감사로그 최다 1000개 유지 시 오래된 행만 잘리는 현재 서버 방식 확인. 상수식 SELECT 52 확인.
- **보안 경계:** 실제 인증된 관리자 `list_recent_audit_page(p_limit=52)` 호출은 하지 않았고, 실제 직원·감사행 SELECT나 DB DML 쓰기 전혀 없음. 함수 카탈로그/상수만 확인했으므로 실제 RPC end-to-end PASS로 적지 말 것.
- **18 검수:** QA 원본 GitHub 코드 추출 정상 서버모델 mock **162/162 PASS**, 보류 응답·세션/관리자 권한·Realtime **16/16 PASS**, JS 2개 구문/DOM 486 고유 ID/모바일·접근성 정적 **30/30 PASS**, 정상 흐름 합계 **208/208**.
- **극단 조건 주의:** 별도 300개 공격적 합성 시나리오 중 10개는 '최신 머리 행 삭제+새 행 삽입으로 앞부분 행 수가 같은' 조합의 오래된 앞부분 표시를 보여 줌. 현재 DB 자동 정리는 1000개 초과의 **최오래된** 행만 지우므로 현재 제품의 정상 흐름 확정 결함으로 분류하지 않음. DB 원자 스냅샷 보증이 아니라는 한계는 보고서에 명시.
- QA 최신 `index.html` blob **778529b59b550ee1f3bf4e8e3b0ea27463427276** 유지, 이번 블록 기능 코드 수정 없음. 파일 1 MB를 초과하므로 `fetch_file` 빈 본문 시 `fetch_blob`으로 열기.
- **다음 3-8-19:** 실제 관리 권한 계정으로 52건 RPC를 검수용 데이터로 안전하게 확인할 수 있는 범위, 관리자 다중 창 전환·Realtime, 전체 브라우저/모바일 가능 범위. QA 브랜치만 변경, main/직원 DB 쓰기 금지.
- 사용자는 연결 끊김·무응답 최소화와 채팅길이 절약 최우선. 중간보고 간결히, 상세 파일은 GitHub에, ZIP·수동 업로드 요구 없음.
