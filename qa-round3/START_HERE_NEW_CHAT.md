# 근무모아 3차·깊이8 공식 인계

- **공식 마지막 완료: 3-8-51 실제 Chromium(144.0.7559.96) 합성 QA CSP 11/11 PASS. 전체 앱 E2E 여전히 BLOCKED / NOT CLEAN.** 다음 번호 **3-8-52**는 별도 완전 QA 환경·실 브라우저 확보 이후 실질적 E2E 시작에 사용. 3차 누적 제품 신규 결함 **37종 유지**.
- GitHub `eco-i/eco-i.github.io` 검수 `qa-3-8`, 운영 `main`; `qa-round3/CURRENT_STATE.json`, `qa-round3/QA_3-8-51_REPORT.md`, `qa-round3/e2e/browser-csp-probe.py`, `qa-round3/e2e/E2E_RUNBOOK.md`, `qa-round3/EXIT_CRITERIA.md` 확인.
- 51의 새로운 증거: Playwright/Python에서 시스템 Chromium 실제 렌더러 `about:blank` + `set_content`에 **합성 QA 정책** 주입. inline JS, 지정 QA HTTP 허용, 운영과 다른 임의 HTTPS connect-src 거부, CDN fetch 거부·script 출처 허용, 악성 script/image/iframe/worker CSP 차단, data:image 허용 **11/11**. 모든 실제 네트워크 requests Playwright router가 abort, 운영 Supabase 접근 0. WSS handshake와 풀 앱/PWA 실행은 하지 않음.
- 제품/유지보수 코드 blob 각각 `08867d7117ad9ae5a8247eda8d223687af2b8411` / `f8e8e469503d0abf53844aa85188b15b09a95238`, 버전 `ver20261018-2313`, 운영 main `6c784210e048426f18a486d5602652626d97574d` 불변. QA 보고서·테스트 스크립트·상태만 저장.
- 연결 Supabase 프로젝트 2개(송도 운영 및 메이플랜드), **독립 QA 프로젝트 없음**. GitHub incremental SQL 16개는 현 앱 RPC 71종 중 3개와 일치 정의만 수록, 신규 빈 QA 프로젝트만으로 실 E2E 불가능. 환경 브라우저 file/data/local URL은 정책상 차단(about:blank set_content만 가능).
- **52 이후 필수 선행조건**: 사용자와 별도 QA 프로젝트 생성 비용·조직 승인, 가짜 직원 전용 완전 server baseline schema, 독립 키 검증, 브라우저 2탭/Android/iOS 접근을 마련한 뒤 P0 동시 SQL·PIN·근태 수정/삭제·Realtime·사진 검증. 사용자 요청만으로 유료 project 생성 승인이라 추정 금지. 운영 DB clone/backup/직원 기록 접근 금지, main은 별도 최종 배포 명령 필요.
- 짧은 응답/상세 GitHub, 연결 안정성, ZIP 요구 금지.

KST 2026-10-20T21:41:03+09:00.
