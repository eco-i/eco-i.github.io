# ★★★근무모아 2차·깊이 8단계 종합검수 — 공식 GitHub 인수인계★★★

## 최신 공식 상태
- **마지막 유효 완료 2-8-234, 다음 검수 2-8-235**. 234 완료 판정 2026-10-11 19:05:37 KST.
- 누적 공식 제품 결함 **505종** (234에서 신규 1종 찾아 수정·회귀 확인).
- 234 시작 SHA a9a60aee1b863ec6cbb02d1d166268668199b129720e97cb26c0e1ebeca8d8e0 (1,157,310 bytes).
- 234 완료 = 235 시작 SHA **a46a2d8d11f1eaecab8b42e461804bad70650c4da462324e370dd307a112cd63** (1,157,156 bytes).
- 공식 다음 시작본: `qa-handoff/index.before-2-8-235.html`. QA `index.html`과 같은 Git blob.
- APP_VERSION `ver20260927-0944` 고정. SQL 변경 없음, 운영 `main` 변경·배포 없음.
- 234 보고 `qa-handoff/QA_2-8-234_REPORT.md`, 근거 `qa-handoff/QA_234_EVIDENCE_AUDIT.json`, 무결성 `qa-handoff/QA_2-8-234_SHA_MANIFEST.json`.
- 실제 headless Chromium 2탭 Web Locks 잠금 테스트 150회 동시 진입 0, 69개 상위검사 PASS. CI [#38130668271](https://github.com/eco-i/eco-i.github.io/actions/runs/38130668271). 
- 새 버그: 기존 localStorage 가짜 mutex에서 150회 중 84회 두 탭 동시 진입. Web Locks 기반 공유세션 직렬화 수정, 인증·로그아웃·자동복구·관리자 인증 흐름에 적용.

## 반드시 지킬 규칙
1. **High·깊이8**을 유지하고, 블록당 **20분 이상 실제 검수 및 충분한 회귀**가 필요하다.
2. 다음은 오직 **2-8-235**. 결함 즉시 수정/회귀. 하네스 오류와 제품 결함 분리.
3. 검수 범위 줄이거나 빠른 종료 금지. KST 시각 정확히 표기.
4. **APP_VERSION·SQL·운영 main·운영 배포 변경 금지**. ZIP을 요청하거나 제안하지 않음.
5. 실제 Supabase/RLS, Android 네이티브 피커, BFCache, 운영 로그인 2탭은 여전히 미검증.
6. Web Locks 미지원 구형 브라우저는 공유 토큰 쓰기 fail-closed. 구버전 탭과 새 잠금 체계 동시 사용은 안전성 미검증: 나중에 배포할 때 기존 열린 탭 종료/재시작 필요.
7. 작업 전 현재 qa-2-8 HEAD, CURRENT_STATE, 이전 QA 보고 및 SHA를 재검증하고 모든 완료 자료를 GitHub에서 재조회한다.
