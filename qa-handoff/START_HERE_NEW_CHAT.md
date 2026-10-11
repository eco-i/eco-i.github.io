# 근무모아 ★★★ 최신 공식 인수인계 ★★★

- 공식 마지막 완료: **2-8-235**, 다음 시작: **2-8-236**. 2026-10-11 19:33:05 KST.
- 공식 누적 제품 결함 **506종**. 235 신규 제품 결함 **1종** 수정·회귀. (임시 로그인 불가와 탭 전용 handoff 미복구는 같은 Web Locks 과적용 원인으로 중복 산정하지 않음)
- 공식 시작본: `qa-handoff/index.before-2-8-236.html`.
- 최종 SHA-256 **f67887f5427da8331eaa134fbaeec73493815ac52e4c1cbcbbcaec1e42dbc50e**, **1,158,706 bytes**. QA 브랜치 `index.html` 및 `qa-handoff/index.working-2-8-235.html`과 같은 Git blob.
- 235 공식 보고 `qa-handoff/QA_2-8-235_REPORT.md`, 증거 `qa-handoff/QA_235_EVIDENCE_AUDIT.json`, SHA `qa-handoff/QA_2-8-235_SHA_MANIFEST.json`.
- 최종 실제 Chromium headless 2회 연속 **92 PASS/0 FAIL**: [#38132253855](https://github.com/eco-i/eco-i.github.io/actions/runs/38132253855), [#38132323640](https://github.com/eco-i/eco-i.github.io/actions/runs/38132323640).
- 변경 핵심: Web Locks 없는 PC에서도 탭별 임시 로그인, 관리자 인증·인증철회·로그아웃 및 비영구 업데이트 handoff 복구를 안전하게 허용. 공유 지속 로그인 및 모바일의 공유 쓰기에는 브라우저 잠금 필수.
- APP_VERSION `ver20260927-0944`, SQL 변경 없음, 운영 배포 없음, GitHub **qa-2-8 전용**; `main` 변경 금지.

## 다음 2-8-236 고정 규칙
1. **High·깊이8**, 블록별 **실제 최소 20분** 심층검수. 사용자 서두른다고 범위 줄이지 않기.
2. 공식 완료 바로 다음 번호만 검수. 다음은 2-8-236, 건너뛰지 않음.
3. 제품 기술결함 즉시 수정·관련 회귀; 하네스/도구/환경 결함과 분리.
4. 실제 Supabase/RLS, 물리 Android 사진, 운영 로그인 2탭, BFCache 미검증 정직히 명시.
5. **APP_VERSION 변경·새 버전명·SQL·운영 main·운영 배포 임의 진행 금지**. ZIP 요청/전달 불필요, GitHub 기준.
6. 보고에 반드시 실제 KST 시각. 종료 판단은 검사 범위와 회귀 안정성 기준.
