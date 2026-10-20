# 근무모아 3차·깊이8 — 3-8-51 실제 Chromium CSP 보안 검증

## 판정
- **3-8-51 BROWSER-CSP-SCOPED PASS / FULL-APP E2E BLOCKED (NOT CLEAN)**. Chromium v144.0.7559.96에서 합성 QA CSP를 실제 DOM(about:blank + set_content)에 주입해 브라우저 네트워크·자원 보안 검사 **11/11 PASS**.
- **운영 앱 전체 E2E 완료 아님**. 앱 HTML 자체 로그인/근태·PIN/지문사진/Realtime·Supabase SQL 동시성 확인이 아니라 50에서 도입한 CSP **정책 구조의 브라우저 적용 검사**. 정책 문자열은 실제 QA 페이지 생성기에 들어간 정책과 동일한 13개 directive를 합성 예제로 재현했으며, 실제 QA 프로젝트로 생성된 HTML을 직접 렌더링한 건 아님.
- 신규 제품 결함 **0**, 3차 누적 **37종**. 실제 운영 사이트·프로덕션 DB/직원기록 접근/변경 **0**, QA 제품 HTML/maintenance 코드 변경 **0**, 운영 `main` 불변 `6c784210e048426f18a486d5602652626d97574d`.

## 실제 11/11 검사
1. CSP 아래 인라인 UI JS 정상 실행.
2. 일반 비QA RPC 호스트 `connect-src` 차단.
3. 다른 Supabase 프로젝트(가짜 r×20) `connect-src` 차단.
4. 지정된 QA Supabase(가짜 q×20) HTTPS 요청만 Playwright 차단 라우터까지 도달.
5. CDN(jsdelivr)은 일반 fetch 연결 권한 거부.
6. jsdelivr 출처의 외부 **script resource** 허용 (라우터에서 다운로드 차단).
7. 미승인 외부 script 차단(`securitypolicyviolation`의 `script-src-elem` 확인). 주의: Playwright request 이벤트는 CSP에 의해 차단된 일부 resource에도 올라올 수 있어 이 테스트에서는 위반 이벤트를 판단 기준으로 사용.
8. data: PNG 이미지 로드.
9. 외부 사진 URL `img-src` 차단.
10. 외부 iframe `frame-src` 차단.
11. Blob Web Worker `worker-src` 차단.

Playwright의 `page.route('**/*')`가 **모든 네트워크 요청을 blockedbyclient로 중단**, 실제 QA/운영 Supabase 요청 없음. WebSocket WSS 핸드셰이크 실험은 오프라인 환경에서 정지되는 문제가 있어 **미검증**, 현재 tests 11개에 포함하지 않음.

## 실행 환경과 한계
- 시스템 Chromium: `/usr/bin/chromium`, 버전 `144.0.7559.96`. Python Playwright.
- `about:blank` 탐색 및 `page.set_content`은 성공. 반면 이 런타임의 일반 `file://`, `data:`, `localhost` 실제 navigation은 `ERR_BLOCKED_BY_ADMINISTRATOR`라 **실제 앱 동일 출처 2탭·Web Locks·PWA 실기기 검증 실행 불가능**. Browser CSP만 범위 좁혀 수행.
- GitHub 재현용 코드는 `qa-round3/e2e/browser-csp-probe.py`에 보관. `python qa-round3/e2e/browser-csp-probe.py`; 설치된 Playwright/Chromium 필요. 모든 URL/키/이미지는 synthetic, 실 DB 미사용.
- Supabase 프로젝트 목록 메타데이터 재확인: 여전히 송도 근무모아 운영 프로젝트와 다른 프로젝트만 있고 **독립 QA 프로젝트 없음**. 기본 clean-room QA DB schema/71 RPC 전체 구성 미확보. 사용자 비용·조직 정보 확인 및 신규 프로젝트 승인 없이 생성하지 않음.

## 다음 행동
- 51에서 신규 브라우저 정책 검증 진전은 있지만 **3차 종료조건 미충족**. 다음 실제 P0 근태/권한/SQL race 검증을 위해 별도 **독립 synthetic QA Supabase 새 프로젝트 + 완전 초기 schema/RPC + 실제 접근 가능한 테스트 브라우저**가 필요하다.
- 원본 repo `index.html`(blob `08867d7117ad9ae5a8247eda8d223687af2b8411`), `maintenance-20261018.js`(blob `f8e8e469503d0abf53844aa85188b15b09a95238`) 변경 없음.
- 비용 동의 전 유료 프로젝트 생성, 운영 DB clone/지문/SQL 접속, 실 계정 테스트, main 배포 전부 금지. 실제 환경 없는데 모의 블록만 반복하는 방식 중단.

기록(KST): 2026-10-20T21:41:03+09:00.
