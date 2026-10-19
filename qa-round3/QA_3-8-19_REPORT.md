# 근무모아 3차·깊이 8 — 3-8-19 공식 검수 보고서

## 공식 판정
- **3-8-19 완료, 이번 범위 신규 확정 제품 결함 0종 — 범위 한정 CLEAN**. 전체 앱/실기기/실계정 E2E CLEAN이 아니다.
- 3차 누적 신규 제품 결함 **11종 유지** (2차 과거 결함 540종 별도). 이번 블록 제품 코드/SQL 수정 없음.
- 검수 GitHub 브랜치: `qa-3-8`, 운영 `main`. QA 최신 index.html blob `778529b59b550ee1f3bf4e8e3b0ea27463427276` 변경 없이 유지.
- 운영 main 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 그대로. 운영배포, 데이터 DML·DDL, 직원·감사 로그 행 접근/변경 **0건**.

## 깊이 8단계
1. **공식 인수인계**: QA GitHub `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-18_REPORT.md` 직접 재확인. 18 완료/19 시작, 신규 누적 11종, QA HTML blob 및 운영 baseline 확인. QA 브랜치 main보다 ahead 87/behind 0인 상태에서 검수 시작.
2. **RPC 스키마·52건 계획 직접 확인**: 실제 Supabase SongdoFood 프로젝트의 `EXPLAIN (FORMAT JSON)`에 `SELECT ... FROM public.list_recent_audit_page('<허구의 무효 UUID>'::uuid, 52, 0)`를 작성하되 **ANALYZE 없이** 실행. `Function Scan: list_recent_audit_page` 계획을 성공적으로 확인. 이것은 쿼리 구조·함수 시그니처의 플래닝일 뿐, 함수 본문 실행/로그인 성공/실제 감사행 수신은 아님.
3. **서버 인증·권한 체인 확인**: 읽기 전용 `pg_proc` 메타데이터에서 `_session_employee` → `_require_admin` → `list_recent_audit_page`를 추적. 유효 세션/초기 비밀번호 변경 요구, 관리자 여부 및 인사상 active 상태 확인 경로 존재를 확인. `p_limit=52`는 서버 정의상 max 100 이내, 정렬은 `created_at DESC,id DESC`. 역할 변경의 실제 앱 내 전달은 별도 미검증.
4. **관리자 권한 박탈 시 민감 화면 폐기**: GitHub 실제 `clearAdminSensitiveRenderedState`와 `loadAuditPage/openAudit` 함수를 추출하여 fake DOM·지연 RPC 모의 실행. 감사행/PIN 상태/안전 백업·인사 스냅샷/DOM 민감 텍스트 폐기, 이전 RPC 소유권 무효화, 권한 재획득 후 새 조회 허용 **14/14 PASS**.
5. **다중창 지연 응답·Realtime catch-up**: 실제 감사 관련 함수를 지연 Promise RPC로 감싼 뒤 옛 조회와 새 조회 완료 순서 × 성공/실패 × 기존 세션·새 세션 × 권한 박탈·앱 재진입 × foreground/hidden 신호를 교차했다. 범위 내 **56/56 PASS**. 옛 응답의 최신 화면 덮기 차단 및 Realtime catch-up 지연 회복을 확인.
6. **보조 근태 목록·모바일 정적 회귀**: `loadAttendanceList`/`loadAllAttendanceList` 실제 함수와 fake RPC에서 응답 역순, 이전 세션 결과 거부, 최신 실패에서 수정잠금, 개인/전체 목록 독립성 확인. HTML 486개 literal ID 중 중복 0, JS inline 2개 구문 parse 성공, viewport-fit, max-height 90dvh, 600px responsive modal, 키보드 Tab/Escape, 감사 렌더 escape 검사를 포함하여 **20/20 PASS**.
7. **격리·범위 검사**: 서버 실행계획 SELECT의 `EXPLAIN`은 실행 단계가 없음을 구분했고, 권한 관련 SQL은 `pg_proc` 카탈로그 SELECT만 수행. 운영 Supabase의 실제 직원·감사 기록 SELECT/INSERT/UPDATE/DELETE 없이 완료. 실제 관리자 계정 토큰 미사용, 실제 RPC 비실행, 운영 본문 GitHub 웹사이트의 실제 Chromium 로그인/Android·iOS 픽셀/멀티기기 E2E 수행하지 않음. QA 브랜치 코드 수정 0.
8. **종합 결론·인계**: 프로그램 코드 추출 모의·정적 검사 **14+56+20=90/90 PASS**. 실제 Supabase 52건 함수 시그니처와 Function Scan 플랜 확인. 이번 블록 신규 확정 결함 0종, 3차 누적 11종 유지. 지난 18 블록의 공격적 합성 '앞쪽 삭제+재삽입' 특수 조건은 여전히 실서비스 신규 제품 결함으로 확정하지 않으며 별도 위험/한계로 보존.

## 미검증과 정직한 한계
- 인증된 실제 관리자 사용자로 `list_recent_audit_page(p_limit=52)` RPC를 호출하여 행을 읽지는 않았다. `EXPLAIN`은 실제 RPC 로그인 권한·정렬 결과·PostgREST 응답을 검증하지 않는다.
- 실제 운영 DB 두 세션 동시에 로그인/권한 회수, Supabase Realtime 무선망 지연, 전체 사이트 Chromium UI 및 물리 Android/iOS는 검증하지 않았다. fake DOM/mock Promise 시뮬레이션 통과를 실사용 E2E PASS로 표시하지 않는다.
- 전체 페이지 감사 목록이 DB 트랜잭션 스냅샷인 것은 아니다. 3-8-18에 기록한 원본 알고리즘의 균형 치환 특수 사례는 계속 후속 검토 대상으로 둔다.
- 이번 3-8-19에 실제 product bug 수정 파일이나 commit은 없다. GitHub 보고서/상태/인수인계 문서만 수정.

## 다음 3-8-20 권고
- 실사용 변경 없이 가능한 범위에서 로그인/권한 변동과 최신성 관측을 더 깊이 검증하고, 모바일 화면 전환·팝업 중첩 접근성 및 공휴일/연차 보조 화면의 비동기 소유권을 점검. 실제 계정 RPC가 필요하면 별도 비운영 검수 계정/검증 데이터로만 수행. 운영 main 배포·직원 DB 변경 절대 금지.
