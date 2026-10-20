# 근무모아 3차·깊이8 공식 인수인계

- **공식 마지막 완료: 3-8-46 CODE-SCOPED CLEAN. 다음 3-8-47.** 3차 누적 신규 제품 결함 **37종(증가 없음)**. 2차 540종은 별도.
- GitHub `eco-i/eco-i.github.io`; QA 브랜치 `qa-3-8`, 운영 `main`. 다음 시작 전 `qa-round3/CURRENT_STATE.json`, 이 문서, `qa-round3/QA_3-8-46_REPORT.md`, `qa-round3/EXIT_CRITERIA.md` 직접 확인.
- 46 범위: 최근 43~45의 localStorage 이벤트 파생을 멈추고 **근태 생성/삭제 + PIN·권한/세션 가드 + 지문 버전/CAS + Realtime catch-up + 연차/대정비** 상이한 코드 경로를 점검. 실제 QA HTML 원본 함수 기반 격리/모의 실행 총 **1,062/1,062 PASS**, 신규 결함 0. 점검 구분: mutation guard 384, saveAttendance preflight 11, 연차 시간 336, 정비↔연차 201, 지문 75, Realtime 55.
- 추가 정적 검증: HTML script 6, maintenance JS 1 syntax PASS, DOM ID 488개 모두 unique, 확인한 변경 RPC 33종 모두 mutation guard set 포함. **최종 QA `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411` 그대로**, maintenance blob `f8e8e469503d0abf53844aa85188b15b09a95238` 그대로. 제품코드 수정·SQL 변경 없음. 버전 `ver20261018-2313` 유지.
- **CLEAN 범위 엄격:** isolated mock+static CLEAN일 뿐 물리 Chrome/Android/iOS·실 전체 앱/Supabase 서버 E2E 미실행. `EXIT_CRITERIA.md` 미충족이며 46은 마지막 서로 다른 CLEAN 조건에 대한 코드 범위 첫 결과로만 관리. E2E나 실제 데이터 검수 완료로 오인 금지.
- `main` baseline `6c784210e048426f18a486d5602652626d97574d` 보호; 운영 직원 DB·지문/SQL/RPC·배포 0. 사용자 명시 지시 없이 main 병합 절대 금지.
- **다음 47:** 46과 겹치지 않게 계정 상태전환/관리자 PIN/근태 삭제·복구, 지문 picker·BFCache 및 긴 서버 read/write 응답의 권한·데이터손실 경계 검토; 실제 분리 테스트 인프라 없을 경우 재현 불가 항목은 미검증으로 기록하고 블록 무의미한 확대 자제. 결함 발견 시에만 qa 수정·회귀.
- 짧은 채팅 보고/자세한 GitHub/연결 안정성 우선. ZIP 요청 금지.

작성 KST: 2026-10-20T19:59:12+09:00.
