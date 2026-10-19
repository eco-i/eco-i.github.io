# 근무모아 3차·깊이8 최신 공식 인수인계

- **3-8-16 공식 완료 / 다음 3-8-17.** 이번 블록 신규 결함 1종, 전체 CLEAN 아님.
- GitHub eco-i/eco-i.github.io / QA qa-3-8 / 운영 main. 새 채팅은 CURRENT_STATE.json 및 QA_3-8-16_REPORT.md 직접 확인.
- **3차 신규 누적 10종**(직전 9 + 3-8-16-001). 2차 과거 결함 540종 별도. 모두 QA 후보 미배포.
- 운영 main SHA 6c784210e048426f18a486d5602652626d97574d, 운영 APP_VERSION ver20261018-2313 고정. 실제 직원 DB/운영 SQL/운영 main 변경 0건.
- 이번 신규 3-8-16-001: 감사로그 조회 중 더보기는 disabled, 새로고침은 여전히 클릭 가능하지만 loadAuditPage의 auditLoading 조기 반환 때문에 새 요청이 조용히 무시되는 결함. GitHub 원본 실제 함수 + 지연 RPC mock으로 재현.
- QA index.html에서 updateAuditControls가 refreshAuditBtn도 로딩 동안 disabled하고 진행 라벨 표시. 커밋 59b2e003627c8b9575bd548f505e83ce986d7ab4, 최신 QA HTML blob d6f86884edd51e0fd064adfacf54e35783bb4819. 이전 blob 76be467649cbe398198282639f93328dd6c1df9a는 지금 최신 아님.
- 감사 조회/재열기/Realtime/HTML 정적 20, 근태 보조 목록 비동기 12, 2026-2035 월 이동/세션 경계 13, 모의 모달 포커스/정적 접근성 16 = **61/61** 검사 통과. 내장 JS 2개 구문 성공, 정적 HTML ID 486개 중 중복 0.
- **한계:** 실제 운영 동등 Chromium 전체 앱 관리자 로그인/모바일 포커스/진짜 Supabase 병렬 요청/실 직원 DB는 확인하지 않았다. V8 실제 함수 추출 + 지연 mock RPC/DOM과 정적 검사를 실사용 E2E로 표기하지 말 것.
- index.html은 1MB를 초과해 fetch_file 본문이 비어 있을 수 있다. fetch_blob으로 위 최신 QA HTML blob 조회. 3-8-16 report/issues는 qa-round3/ 하위 저장.
- **다음 3-8-17:** 감사 offset 페이징 중 신규 로그 생성에 따른 페이지 밀림/중복, Realtime 읽기 경합·보조 팝업 소유권/권한, 모바일 통합 가능한 범위. QA-only, 운영 main 및 직원 DB 변경 금지.
- 사용자 우선: 연결 끊김·무응답·대화 길이 최소화. 중간보고 짧게, 상세 GitHub. ZIP 업로드 요구하지 말 것.
