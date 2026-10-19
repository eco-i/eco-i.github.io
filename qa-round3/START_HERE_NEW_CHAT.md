# 근무모아 3차·깊이8 공식 인수인계

- **공식 3-8-17 완료 / 다음 3-8-18**. 17에서 신규 제품 결함 1종 확인·QA 전용 수정, 전체 CLEAN 아님.
- 저장소 eco-i/eco-i.github.io / QA qa-3-8 / 운영 main. 새로운 채팅은 CURRENT_STATE.json / QA_3-8-17_REPORT.md를 GitHub에서 직접 확인.
- **3차 누적 신규 결함 11종** (직전 10 + 이번 3-8-17-001). 2차 과거 결함 540종 별도. QA 수정 모두 운영 미배포.
- 운영 main 기준 SHA 6c784210e048426f18a486d5602652626d97574d, APP_VERSION ver20261018-2313. 운영 SQL·실제 직원 DB 쓰기 금지, 실제 변경 0건.
- **3-8-17-001(MEDIUM):** 감사로그 첫 50건 뒤 offset 페이징 중 로그 삽입 → 중복 오류로 더보기 중단; 로그 삭제 → 중간 행 조용히 누락. 실제 QA 원본 audit 함수와 120건 가짜 RPC 데이터로 각각 재현.
- QA `index.html`의 `loadAuditPage`만 수정: 마지막 표시 ID와 다음 응답 첫 행을 겹쳐 확인, 밀림 시 이전 펼친 깊이+50건을 처음부터 다시 읽어 정상 완료시에만 교체, 내부 페이지도 anchor 체크·최대 2회 시도. SQL/근태/달력/관리자 권한/모바일 CSS 무변경.
- 코드 커밋 **cbf2f50c978cdf34db1b948c4f8359adcdcb38f1**, 최신 QA HTML blob **778529b59b550ee1f3bf4e8e3b0ea27463427276**. 이전 d6f86884edd51e0fd064adfacf54e35783bb4819은 16 완료본으로 최신 아님.
- 검증: 실제 함수 분리 mock/정적 **22+160+18=200/200 PASS**. 1000건 보관 경계, 보조 Realtime catch-up, 오래된 세션 read 거부, preserveDepth, 내장 JS 2개 파싱, DOM ID 486개 중 중복 0 확인.
- 주의: 모의시험이지 실 Supabase/Android/iOS/Chromium 전체 로그인 E2E 아님. 실제 `list_recent_audit_page` RPC가 overlap용 `p_limit=52`를 수용하는지 실서버 검증 미완료(기존 51). 서버 함수 정의는 현재 저장소 migrations 16개에서 확인되지 않음.
- index.html 1MB 초과해 fetch_file 결과가 빈 문자열일 수 있으므로 위 SHA를 fetch_blob으로 직접 조회. 상세: qa-round3/QA_3-8-17_REPORT.md 및 qa-round3/issues/3-8-17-001_AUDIT_OFFSET_PAGE_DRIFT.md
- **다음 3-8-18:** 감사 RPC 52건 계약 확인 가능한 읽기 검증, 지연 Realtime·팝업 세션 권한·다중 화면, 실제 UI/모바일 가능한 범위 검수. 운영 main 배포/실제 직원 DB 변경 금지.
- 사용자 우선: 연결 끊김·무응답·대화 길이 최소화, 중간 보고 짧게, 상세 GitHub, ZIP·수동 업로드 요구 금지.
