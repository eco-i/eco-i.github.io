# ★★★근무모아 2차·깊이8 공식 인수인계 — 260 완료, 261 다음



**2-8-260 공식 CLEAN**, 신규 제품 결함 0종, 공식 누적 **540종 유지**, 다음 **2-8-261**.

Repo `eco-i/eco-i.github.io`, QA branch `qa-2-8`, operating `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL/운영배포/APP_VERSION 변경 없음(`ver20260927-0944`).

260 원본/작업본/QA index/261 시작본 전부 동일 SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, **1,175,136 bytes**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`. 다음 시작 `qa-handoff/index.before-2-8-261.html`.

2026-10-15 13:00:36~13:21:07 KST **실제20분31초 High·깊이8**. 전체 Full/Backend/Frontend 3 Job GREEN (run38679584146). 19분3초 전체 지속 9회×18=162 suites (run38679267891) GREEN. 8분1초 신규 지속 22회×5=110 suites (run38680032891) GREEN.

새 독립 검사 overtime/hw3854 + responsive112 + admin5420 + timezone224 + storage84 = **9,694 PASS/0 FAIL**. 지난 블록 세션 보호 2탭 560/0, 소스 무결성 21/0.

시작·최종 보고 `qa-handoff/QA_2-8-260_REPORT.md`, 증빙 `qa-handoff/QA_260_EVIDENCE_AUDIT.json`, SHA 표 `qa-handoff/QA_2-8-260_SHA_MANIFEST.json`.

초기 source integrity 하네스 regex가 JS 템플릿 내부 id= 속성 2개까지 포함해 실패했으나 정정 후 전부 GREEN; 제품 결함 아님.

실 운영 Supabase/RLS 인증 다중계정, 물리 Android 카메라/Picker, iOS Safari, persisted BFCache, 실제 운영 DB 복원은 미검증.

**다음 블록 261 운영규칙:** High, 깊이8, 실제20분 이상, 20분 이내 KST 중간보고/답변시각, 실제 결함 즉시 기술수정·독립 RED→GREEN·전체 회귀. 검수번호 연속. ZIP 요구·제안 금지. 운영 main/SQL/APP_VERSION/배포 임의 변경 금지.