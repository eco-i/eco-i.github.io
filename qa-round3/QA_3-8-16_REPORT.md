# 근무모아 3차·깊이8 — 3-8-16 공식 보고서

## 공식 판정
- 3-8-16 범위 검수 완료; 신규 결함 1종(3-8-16-001), 이번 블록과 전체 CLEAN 아님.
- 3차 신규 누적 10종(기존 9+신규 1). 별도 2차 역사적 결함 540종 유지.
- QA 브랜치 qa-3-8에서만 index.html 193문자 순증 수정; 운영 main 배포 및 실제 직원 DB 수정 0건.
- 운영 기준 main SHA 6c784210e048426f18a486d5602652626d97574d, 앱 ver20261018-2313 유지.
- QA 수정 코드 커밋 59b2e003627c8b9575bd548f505e83ce986d7ab4, HTML blob d6f86884edd51e0fd064adfacf54e35783bb4819.

## 깊이 8 단계
1. 공식 CURRENT_STATE/START_HERE/3-8-15 보고서를 qa-3-8에서 직접 확인(15 완료, 16 시작, 9종). 전용 QA 기준 blob 확인.
2. 실제 감사로그 updateAuditControls/loadAuditPage/openAudit, 더보기·새로고침 핸들러, 50건 페이징, 닫기, 세션 소유권, Realtime catch-up 경로 검토.
3. 지연 mock RPC에서 더보기 버튼만 잠기고 refresh 버튼은 활성인 상태 확인. 새로고침을 호출해도 auditLoading의 조기 false 반환으로 새 RPC가 생기지 않음. 신규 결함 3-8-16-001 확정.
4. QA index.html만 수정하여 refresh도 조회 동안 disabled, 진행 라벨 표시, 완료/실패 시 원상복구. 기존 읽기·쓰기·SQL 코드 그대로 유지.
5. 감사로그 실제 함수 추출 V8 동적 20/20: 원본 결함 재현, 초기 요청/더보기 잠금, 50건 페이징, 로드 실패의 기존 54건 보존, 중복 행 거절, 닫고 재열기 늦은 응답 폐기, 세션 변경 거절, Realtime catch-up, 비관리자 거절, 2개 inline JS 파싱, HTML id 486개 중 중복 0.
6. 실제 loadAttendanceList/loadAllAttendanceList 분리 실행 12/12: 두 목록 새·옛 응답 역전, 실패 처리·수정 잠금, 펼친 목록 초기화, 계정 교체 시 지난 결과 폐기 확인.
7. 실제 navigateCalendarMonth/moveMonth/goToday 분리 13/13: 2026~2035 양 끝, 12월↔1월 경계, 중복 로딩 최신 seq 우선, 세션/수명주기/hidden 문맥, Realtime 후속. 실제 focusTargetUsable/visibleModalFocusables/ensureBackdropAccessibility와 DOM·키보드 정적 가정 16/16: disabled/hidden/aria-hidden/role/label/Tab-Escape 경로.
8. 20+12+13+16=61건 검사 통과, 신규 결함 누적 10종 갱신. 검수용 코드 수정은 감사 UI 버튼에 국한; 운영 및 SQL·실직원 기록 변경 없음.

## 검증 한계
- V8 실제 함수 + mock RPC/DOM 기반 및 정적 컴파일 검사이며 앱 전체 Chromium 로그인·실제 Android/iOS·운영 DB 조회/두 실제 세션 동시 요청·실기기 포커스 실험이 아니다.
- 본 블록 발견 결함이 있기 때문에 전체 CLEAN 또는 현장 안전 검증 완료라 표시하지 않는다.
- 상세: qa-round3/issues/3-8-16-001_AUDIT_REFRESH_BUSY_CLICK.md

## 다음 3-8-17
- 감사 offset 페이징 중 신규 감사행 삽입/삭제 드리프트와 Realtime 겹침, 팝업 소유권·관리자 권한 경계, 가능한 실제 Chromium 통합 점검. QA 전용, main 배포 및 실제 직원 DB 변경 금지.