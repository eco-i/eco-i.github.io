# 근무모아 3차·깊이8 공식 인수인계

- **최종 공식 완료 3-8-45: MEDIUM 신규 결함 1종 수정, CLEAN 아님. 다음 3-8-46.** 3차 누적 신규 제품 결함 **37종**. 2차 과거 540종은 별도.
- GitHub `eco-i/eco-i.github.io`; 검수 `qa-3-8`; 운영 `main`. 다음 채팅에서 `qa-round3/CURRENT_STATE.json`, 본 문서, `qa-round3/QA_3-8-45_REPORT.md`, `qa-round3/EXIT_CRITERIA.md`를 직접 확인.
- **3-8-45-001 MEDIUM:** 이미 사라진 이전 동일 토큰 로그아웃 suppression의 *지연 storage 이벤트*만 보고 열려 있는 새 로그인 UI가 `logout(false)` 되는 현상. 44 최종 원본 핸들러 72조합 중 오탐 4건 재현. 새 로그인 후 이전 마커 제거와 이벤트 큐의 비동기가 원인.
- **수정:** `index.html`에서 suppression storage 이벤트 처리 시 현재 `localStorage.getItem(SHARED_SESSION_LOGOUT_SUPPRESSION_KEY)`과 token을 재검사. 현재 표식 없거나 다른 토큰이면 오래된 이벤트를 무시. 읽기 실패 시 fail-closed. 44 pending local-login guard의 80ms 소유권 fence와 token-specific/aggregate logout 로직 변경 없음.
- 최종 QA HTML blob **`08867d7117ad9ae5a8247eda8d223687af2b8411`**, 제품코드 commit **`3db6b577a7caef8f8a7333885405d953b2d86e05`**. 44 완료 이전 blob `ab638a84e6c211a3845889c9ab9b69a1f2b4f1ea`. `APP_VERSION=ver20261018-2313` 유지.
- 최종 실제 함수 mock **608/608 assertions PASS**: suppression 72시나리오×3=216, token/aggregate logout 24×3=72, guard 96시나리오 **320**. JS script 구문 6개, HTML ID 488 유일성, 버전 정적 PASS. 실제 Chrome 두 탭이나 Supabase E2E로 해석 금지.
- **브라우저 환경 제약:** Playwright·Chromium 설치 확인했지만 테스트 sandbox의 localhost/file/data navigation이 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단되어 2탭 실제 실험 미실행. QA Supabase 실계정·물리 Android/iOS 테스트 역시 미실행. `EXIT_CRITERIA.md` 미충족.
- **운영 보호:** main SHA `6c784210e048426f18a486d5602652626d97574d` 불변; 실 직원 DB/근태/지문/SQL/RPC/배포 변경 없음. 임의 운영 반영 절대 금지.
- **다음 3-8-46:** suppression·guard micro-edge 무한 증식을 중단. 세션/권한과 근태 쓰기·지문 UI·Realtime/대정비·연가를 *서로 다른 통합 불변식*으로 우선 대조하고 종료 게이트 미충족 E2E 범위/QA 격리 환경 선행조건을 정리. 발견 결함만 국소 수정+회귀. 긴 결과는 GitHub, 대화 보고는 최소화.
- 사용자 선호: 연결 안정성, 짧은 보고, ZIP 불필요, 깊이8, QA 브랜치·실데이터 절대 보호.

갱신(KST): 2026-10-20T19:44:11+09:00.
