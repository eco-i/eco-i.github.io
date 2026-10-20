# 3차·깊이8 3-8-49 환경 준비·보조도구 보강 보고서

- **3-8-49 준비 진전 완료 / 실제 E2E 여전히 BLOCKED / NOT CLEAN.** 신규 *제품* 결함 0, 3차 누적 **37종 유지**. QA helper 기존 구형 JWT 전용 처리 **보조 도구 호환성 문제 1건 수정**(제품 결함과 구분).
- QA site preparer: modern `sb_publishable_` QA 공개키 (QA 프로젝트 대시보드에서 직접 소속 확인 후 `QA_PUBLISHABLE_KEY_VERIFIED=YES`), legacy QA anon JWT, 필수 `QA_SUPABASE_REF`, 운영 URL/키 및 secret 차단, companion static assets 운영 연결 검사. 사이트 원본·main 미변경.
- **실제 Node v22 합성 fixture 보안검사 13/13 PASS**: 필수 승인 누락, 잘못된 URL/ref, 운영 URL, 운영 키, 관리자 비밀키, 프로젝트 미확인 공개키, legacy JWT role/ref 오류 9개 거부, 격리 modern/legacy 키 생성 2개 성공, 정적 자산에 운영 URL 및 파일 누락 거부 2개. `prepare-qa-site.test.mjs`로 재실행 가능. **네트워크·DB 사용 없음**.
- GitHub QA `index.html`에 literal RPC 71종. repo `db/migrations` 16개에서 같은 이름 CREATE function 3종, 나머지 68종은 해당 파일에 없어 빈 QA 서버 복원이 불가능. 현 운영 서버에 없는 것을 의미하지 않음. QA-only `qa-schema-preflight.sql` read-only catalog 검사 71 RPC/23 tables 작성, **실제 DB에 실행하지 않음**.
- `QA_BACKEND_GAPS.md`에 누락 범위/보안·합성 schema 요구조건 정리. 실제 동일출처 Chrome 2탭/Android/iOS/PWA + SQL 2-session race/PIN/지문/Realtime **미실행**. 46/47만 CODE-SCOPED CLEAN 2회이며 실 E2E CLEAN 아니다.
- GitHub `qa-3-8` QA 보조 도구/보고서만 변경, 제품 `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, APP_VERSION `ver20261018-2313` 불변. 운영 main 기준 `6c784210e048426f18a486d5602652626d97574d` 불변, 실 직원 DB·SQL·RPC·지문 접근/변경·배포 0.
- **다음:** 별도 QA Supabase 생성 비용과 권한을 사용자가 승인하고, 완전한 *비식별 합성* backend/테스트 직원이 마련된 다음 P0 E2E. 승인 전 유료 서비스 신규 생성/운영 DB clone/무의미한 mock 블록 증가 금지.

작성(KST): 2026-10-20T20:50:38+09:00.
