# 근무모아 3차·깊이8 최신 공식 인수인계

- **3-8-15 공식 완료 / 다음 3-8-16**. 검수한 범위 신규 제품 결함 1종, 전체 CLEAN 아님.
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-3-8`, 운영 `main`. 다음 채팅 시작 시 `qa-round3/CURRENT_STATE.json` 및 `qa-round3/QA_3-8-15_REPORT.md` 직접 확인.
- 운영 기준 `main` SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313`. 2차 최종 2-8-290, 과거 누적 결함 540종.
- **3차 신규 누적 9종**: 이전 8종 + 이번 `3-8-15-001`. 모든 QA 수정안 운영 미배포. 운영 SQL·직원 DB 기록 변경하지 않음.
- 이번 신규 결함 `3-8-15-001`: 감사로그 팝업을 조회 도중 닫았다 다시 열어도 `auditLoading` 때문에 두 번째 조회가 시작되지 않고 첫 조회의 늦은 결과만 보이는 문제. **운영 main 원본의 실제 `openAudit/loadAuditPage`와 지연 mock RPC로 재현**. 감사로그 팝업은 read-loading 중 `closeBackdrop`이 막지 않음.
- QA **`index.html`만 수정**: 새로 열 때 이전 감사 조회 `auditPageLoadSeq` 무효화, `auditLoading` 해제 후 최신 `loadAuditPage(true)` 시작. commit `194f9d45c118165e4129788150155a099f57130a`, QA HTML blob `76be467649cbe398198282639f93328dd6c1df9a`. 이전 고정 HTML blob `5553a1d319e3ab7ff4dd6bb8ee7d995657112698`은 **이제 QA 최신 기준 아님**(운영 main의 현재 blob으로만 참조).
- 검증: 감사로그 재열기 응답 순서·실패·세션·Realtime **8/8**, 일반·전체 근태 목록 지연 응답 **10/10**, 수정한 QA HTML의 inline JS 구문 **2/2**, 486개의 정적 ID 중 중복 0, QA 정비 JS 요소 ID 26건 누락 0, 모바일 정비 CSS 25규칙 전부 팝업 한정·미디어쿼리·44/46px 최소 크기 정적 확인.
- **미검증**: 운영 동등 실제 Chromium 전체 로그인/팝업 UI, Android/iOS 실기기, 진짜 관리자 권한/실 Supabase 경합. 모의 응답을 실사용 E2E와 혼동 금지.
- `index.html` 크기 1MB를 넘으므로 `fetch_file` 본문은 비어 나올 수 있음. **최신 QA blob `76be467649cbe398198282639f93328dd6c1df9a`를 `fetch_blob`으로 열기.** JS 격리 시험은 functions.exec에서 가능.
- **다음 3-8-16**: 감사로그 ‘더보기/새로고침’ 경쟁·열기/닫기, 실시간 catch-up과 보조 목록 결합, 모바일 팝업 포커스/월 경계 검수. 운영 배포·직원 기록 변경 금지.
- 사용자 우선: 연결 끊김·무응답 최소화, 20초 안팎 간결한 중간보고, 상세 GitHub, ZIP 요구 금지.
