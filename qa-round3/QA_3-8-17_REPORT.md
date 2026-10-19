# 근무모아 3차·깊이8 — 3-8-17 공식 검수 보고서

## 공식 판정
- **3-8-17 검수 범위 완료, 신규 제품 결함 1종(3-8-17-001); 전체 CLEAN 아님.**
- 3차 누적 신규 제품 결함 **11종**(기존 10 + 신규 1). 과거 2차 결함 540종과 별도.
- QA 전용 index.html만 수정, 커밋 cbf2f50c978cdf34db1b948c4f8359adcdcb38f1, QA HTML blob 778529b59b550ee1f3bf4e8e3b0ea27463427276.
- 운영 main SHA 6c784210e048426f18a486d5602652626d97574d, APP_VERSION ver20261018-2313 유지. main 배포/운영 직원 DB·SQL 기록 변경 0건.

## 깊이 8단계
1. qa-3-8의 CURRENT_STATE.json, START_HERE_NEW_CHAT.md, QA_3-8-16_REPORT.md 확인: 16 완료, 17 시작, 누적 10종, HTML blob 확인. 운영 main...QA 기준 behind 0.
2. 실제 audit loadAuditPage/updateAuditControls/openAudit 및 strictAuditRpcRows, Realtime open visible-screen 연동, session epoch와 보조 팝업·모바일 포커스 구조 확인. db/migrations 16개에서 SQL 함수 정의 미확인; 프런트 QA 분리 시험 수행.
3. 기존 실제 함수 + 120건 mock: 상단 1건 삽입 후 더보기 중복 오류로 차단, 상단 1건 삭제 후 ID 한 건 건너뜀을 재현. 제품 결함 3-8-17-001 확인(같은 offset drift 원인).
4. QA index.html의 audit 조회 함수만 수정. 더보기 첫 행을 기존 마지막 ID와 overlap 검증하고, 밀림이면 최대 기존 표시 깊이+50건 최신 목록을 처음부터 재조회해 성공시 원자 교체. 다중 페이지 reset에도 anchor 체크 및 최대 2회 시도. 기존 데이터는 성공 전 보존.
5. 실제 함수 추출·mock RPC 회귀 22/22 PASS: 원본 재현 2, 수정본 stable/insert/delete, 실패·offline·read lock, late session, Realtime 지연, 내장 JS 컴파일 및 id 검사.
6. 입력 변동 행렬 160/160 PASS: 삽입 1~5건, 삭제 1~4건과 위치 변동, 후속 50건, 세 번째 페이지/100→150건 전환, 표시 목록과 현재 mock DB 상위 행 일치·유일성 확인.
7. 추가 경계 18/18 PASS: retention 1,000건과 20번 GET, preserveDepth 150 유지, session switch 중 보류 응답 폐기, Realtime catch-up 합류, HTML 외부 변경 없음, CSS 그대로, 모바일 viewport/키보드 원본 보존, 내장 JS 2개 파싱, 정적 DOM 486 IDs 고유.
8. 총 **200/200** 분리 실행·정적 검사 PASS. 해당 블록의 검증 범위 완료. 기존 QA 결함 10종 수정안 유지, 신규 1종 추가, 운영 main·직원 DB 미변경. CI·실서버/실브라우저 최종 검증을 완료했다고 말하지 않음.

## 변동 상세 및 한계
- 새로고침/더보기 버튼 중복 클릭 잠금(16), 팝업 열기 재조회(15)의 기존 QA 변경 유지.
- 운영과 동등한 Chromium 전체 앱 관리자 로그인/실 Android·iOS/실 Supabase 관리자+직원 독립 세션/실서버 리얼타임 네트워크 경합 미검증.
- 실제 서버 list_recent_audit_page의 52건 요청 허용 계약 및 DB 원자 스냅샷은 실검증 불가. 이 저장소 db/migrations에서 해당 함수 정의를 찾지 못했음.
- 합성 mock 테스트의 PASS는 전체 서비스 무결함 증명이 아님. 감사 로그의 진짜 서버 행에는 어떠한 쓰기/삭제도 하지 않았음.
- 상세 이슈 qa-round3/issues/3-8-17-001_AUDIT_OFFSET_PAGE_DRIFT.md.

## 다음 블록 3-8-18 권고
- 감사 서버 RPC의 p_limit 52 반환 계약(읽기만), 로그인 변경·관리자 권한 박탈 중 새 감사 스냅샷의 중복 응답, 다중 화면 연동/모바일 실제 브라우저 동작을 검증. SQL 및 직원 DB 쓰기 금지, QA 브랜치만.
