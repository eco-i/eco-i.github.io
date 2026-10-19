# 3-8-16-001 — 감사로그 진행 중 새로고침 클릭이 반응 없이 무시됨

- 분류: LOW / 읽기 전용 UI 반응성·최신성. 운영 배포 없음.
- 원본 HTML blob: 76be467649cbe398198282639f93328dd6c1df9a
- QA 수정 HTML blob: d6f86884edd51e0fd064adfacf54e35783bb4819
- QA 코드 커밋: 59b2e003627c8b9575bd548f505e83ce986d7ab4

## 재현
1. 관리자 감사로그 openAudit()를 호출하고 list_recent_audit_page RPC를 지연 보류한다.
2. 기존 updateAuditControls()에서는 auditMoreBtn.disabled=true이지만 refreshAuditBtn.disabled=false다.
3. 활성화된 새로고침 버튼 클릭 핸들러가 loadAuditPage(true)를 호출해도 auditLoading에서 false만 반환해 새 RPC가 시작되지 않는다. 사용자는 클릭 실패 안내를 받지 못한다.
4. 더보기 조회가 진행 중인 경우에도 같은 조건이 발생한다.
5. 실제 GitHub HTML에 포함된 원본 함수를 V8으로 추출 실행하고 지연 mock RPC로 재현하였다.

## QA 수정
- index.html의 updateAuditControls()에서 refreshAuditBtn도 auditLoading 기간 disabled로 잠그고 상태 라벨을 불러오는 중…/새로고침으로 전환한다.
- 기존 감사 GET, 세션/Realtime 경합 처리, 근태 저장, SQL 로직 변경 없음. 해당 함수 국소 순증 193문자.
- QA-only commit 59b2e003627c8b9575bd548f505e83ce986d7ab4; main·운영 DB·직원 기록 변경 0건.

## 회귀
- 감사/동시성/재열기/Realtime/HTML 정적 20/20, 보조 목록 12/12, 달력 월 경계 13/13, 포커스·접근성 16/16. 총 61/61.
- 수정 QA HTML 내장 JS 파싱 2개 성공, 정적 id 486개 중 중복 0.
- 실제 운영 동등 전체 Chromium/실기기/실 Supabase 병렬 세션은 수행하지 않았으며 QA 모의시험으로 표기한다.