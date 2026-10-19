# 근무모아 QA 3차·깊이8 공식 인수인계

- **3-8-20 완료 / 다음 3-8-21**. 이번 블록 범위 한정 CLEAN, 신규 확정 결함 0종. 전체 앱 무결함/실기기 E2E 확인 아님.
- GitHub repo `eco-i/eco-i.github.io`, QA branch `qa-3-8`, production branch `main`. 새 채팅은 `qa-round3/CURRENT_STATE.json`과 `qa-round3/QA_3-8-20_REPORT.md`부터 직접 열기.
- **3차 누적 신규 결함 11종**. 2차 과거 결함 540종 별도. 모든 QA 수정안 운영 미배포.
- 운영 main 기준 SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 유지. 직원 DB 쓰기/운영 배포 없음.
- QA 최신 `index.html` blob `778529b59b550ee1f3bf4e8e3b0ea27463427276` **변경 없음**. 1MB 이상이므로 fetch_file 본문이 비면 fetch_blob 사용.
- 블록 20 검수: 휴근 목록 scope/account 8/8, 연차 연도 전환·실패 8/8, 장기재직 dirty draft/세션 8/8, 3중 모달 포커스 및 aria 19/19, 연차·장기 사용내역 Realtime 초안보존 11/11, pending 닫기 49/49, JS parse/486 unique IDs/모바일 정적 24/24 = **127/127 PASS**.
- 실제 GitHub JS 함수 추출 + 모의 RPC/DOM 검증만 수행. 물리 Android/iOS, 실제 전체 앱 로그인 Chromium, 진짜 Supabase 복수 세션 동시성 미검증. 이 한계를 유지할 것.
- 상세 단계와 근거: `qa-round3/QA_3-8-20_REPORT.md`.
- **3-8-21 권고:** 모바일 날짜 선택기의 Tab/Escape 및 중첩 포커스, 휴근 편집·삭제 비동기 경합, 연차·장기 재직 저장 직후 Realtime 겹침. `qa-3-8`에서만 수정하고 main 배포·직원 DB 변경 금지.
- 연결 끊김/무응답/채팅 용량 절약 최우선. 중간 보고 짧게, 상세 내용 GitHub. ZIP·수동 업로드 요청 금지.
