# GitHub Actions 2단계 — 실제 Chromium 로그인·초기 PIN UI 자동검수 (2026-10-21 KST)

> **공식 등급: 실제 브라우저 UI 범위 PASS + local QA builder guard PASS.**
> **전체 근무모아 서버/로그인/DB 통합 E2E 아님, 전체 CLEAN 아님, 운영 main 배포 승인 아님.**
> 이번 작업은 자동 검수 도구의 환경 문제를 수정했으며 근무모아 제품결함 37종 집계를 늘리거나 3-8-54를 완료 처리하지 않는다.

## 1. 작업 원인과 QA 전용 수정
- `qa-3-8/index.html` 원본의 `configured()`는 `https://*.supabase.co` 형식만 진짜 서버 연결로 인정. 기존 `prepare-local-qa-site.mjs`가 `SUPABASE_URL`을 `http://127.0.0.1:54321`로 바꾸기만 하면 브라우저가 서버를 호출하지 않고 로컬 미리보기로 전환하는 **QA 환경 설정 결함** 발견.
- 첫 실제 Chromium 실행 [run 39515924519](https://github.com/eco-i/eco-i.github.io/actions/runs/39515924519)에서는 로그인 입력 검증 일부가 통과했으나 API 실제 호출 기대가 어긋나 실패. 이를 운영 제품 결함으로 집계하지 않음.
- **수정:** `prepare-local-qa-site.mjs`에서 원본 `configured()`를 개수·형태 검사 후, 생성되는 **임시 QA HTML 내부에서만** loopback + 승인된 local QA key를 확인하도록 치환. 원본 `index.html`/운영 main 직접 수정 없음. 함수가 없거나 형태가 예상과 다르면 즉시 거부(fail closed).
- 검수 스크립트 `qa-round3/e2e/ci/browser-login-gate.py` 추가: 실제 전체 1MB 근무모아 HTML과 정적 자산을 원형 유지해 임시 생성 후 127.0.0.1:54330에서 제공. 백엔드는 127.0.0.1:54321 **가짜 HTTP RPC**만 허용, 미구현 API 전부 404.
- `qa-round3/e2e/prepare-local-qa-site.test.mjs` 회귀 단언에 loopback configured 활성화·누락 시 거부를 추가.
- `.github/workflows/workmoa-qa-browser.yml`은 검수 `qa-3-8` 관련 코드 변경에만 작동하며 `contents:read`; Python Playwright 1.56.0/Chromium 141, Node 22 사용. 외부 Supabase URL/DB 비밀번호/운영 자격증명 입력 금지. 브라우저 `route`에서 loopback 두 포트 외 HTTP 요청 전부 차단(외부 CDN 포함). 실제 기밀 정보 사용 0.

## 2. GitHub Actions 실증
- 수정 후 1차 SUCCESS: [run 39516223262](https://github.com/eco-i/eco-i.github.io/actions/runs/39516223262).
- 마지막 회귀·실브라우저 종합 SUCCESS: [run 39516333413](https://github.com/eco-i/eco-i.github.io/actions/runs/39516333413), job `118949262706`, commit `a3d3f114654e166ad5bfc4bf659847de665a8524`.
- 실제 GitHub job/로그 직접 확인: **로컬 QA 생성기 Node 테스트 16/16 PASS, Chromium 브라우저 UI 체크 10/10 PASS, job SUCCESS**.

### Node 생성기 16개 검사
로컬 전용 환경 확인, 로컬 키/URL/포트 검증, 운영 키 재사용·service_role 차단, QA 문서 CSP, 정적 파일 내 운영 URL 차단, 기존 CSP 충돌 거부, 누락 아이콘 거부, **configured 함수 부재 시 로컬 오프라인 모드로 허위 성공하지 않고 중단** 등 16 PASS.

### 실제 Chromium에서 10개 UI 체크
1. 원본 근무모아 전체 HTML의 QA 제목 표시 정상.
2. 외부 운영 프로젝트/GitHub 요청 차단.
3. 4자리 미만 잘못된 PIN은 API 호출 전에 차단.
4. 4자리 틀린 PIN은 **합성 HTTP 로그인 RPC** 거절 후 로그인 화면 유지.
5. 인증 실패 시 앱 본문 계속 숨김.
6. 합성 로그인 성공 이후 **초기 PIN 필수 응답**을 실제 fetch RPC로 확인.
7. 초기 PIN 필수 동안 앱 본문 숨김.
8. PIN 변경 버튼이 실제 Chromium에서 보임.
9. 전 과정 운영 Supabase 원격 요청 0.
10. 로그인·초기 PIN 외 미예상 API RPC 호출 0.

## 3. 검증 한계 및 다음 위험
- **확인한 사실:** 테스트는 실제 Chromium 엔진으로 브라우저 전체 HTML을 로드하고 네트워크 요청을 발생시키는 **UI/프런트 통합검사**.
- **미확인:** 백엔드는 Python의 **합성 HTTP 응답 서버**, 실제 Supabase Auth·PostgREST·RLS·Realtime 또는 PostgreSQL에 이 브라우저 검사가 연결된 것이 아님. 서버 비밀번호 검증/실계정 권한과 실제 직원 DB 안전성 통과로 해석 금지.
- 기존 1단계 [실제 PostgreSQL SQL 경합 PASS](ACTIONS_POSTGRES_FIRST_PASS_20261021.md)는 별도로 진짜 DB에서 검사했지만, 이번 브라우저 시험과 **동일한 E2E 경로로 결합되지는 않았음**.
- `E2E_RUNBOOK.md` 기준 P0 5건/P1 3건의 독립 QA Supabase 다중 로그인·정비 revision/근태 CAS·권한 PIN·모바일 카메라·Realtime·연차/대정비 UI/DB는 **전체 E2E UNVERIFIED**. 합성 RPC 기초 스키마 68개 부족분이 남음.
- 이 검사 자체가 대정비/근태 작성 기능까지 검증한 것은 아니다. 반복적인 동일 UI mock 블록을 추가해 전체 CLEAN 숫자를 채우지 않음.
- 신규 근무모아 제품결함 **0종**, 기존 3차 제품결함 **37종 유지**; 이번 발견은 **QA 생성기 환경 결함**으로만 분류.

## 4. GitHub 보호 범위
- 변경 파일은 `qa-round3/e2e/...` 및 `.github/workflows/workmoa-qa-browser.yml`의 **QA-only 테스트 코드**. 제품 `index.html`과 `maintenance-20261018.js` Git blob 변경 없음.
- 운영 `main`과 실 직원 DB/실 근태/지문/인증 키/원격 Supabase SQL·RPC는 접근 또는 변경하지 않음.
- **공식 마지막 완료 3-8-53 / 다음 3-8-54 미시작, 전체 3차 CLEAN 아님, 운영 배포 안 함** 유지.
