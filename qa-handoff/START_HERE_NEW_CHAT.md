# ★★★근무모아 2차·깊이8 공식 인수인계 — 245 완료

- 마지막 완료 **2-8-245**, 다음 **2-8-246**, 공식 누적 제품 결함 **527종**(이번 +2종).
- GitHub `eco-i/eco-i.github.io` QA `qa-2-8` 브랜치 기준, `main`·SQL·운영 배포 불변. APP_VERSION `ver20260927-0944` 유지.
- 최종 QA `index.html`/ `qa-handoff/index.working-2-8-245.html` /다음 시작본 `qa-handoff/index.before-2-8-246.html`: SHA-256 `be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da`, **1,169,443 bytes**.
- 불변 245 시작본 `qa-handoff/index.before-2-8-245.html`: SHA-256 `9bfce02ca8be15ae1a59eebec2d3b05d1563784719ebec6308b7537e8fb9d9ab`, **1,168,824 bytes**.
- 제품 결함① 관리자 잠금 해제 후 관리자-only 일반 읽기 5종이 공통 RPC 보호에서 빠진 문제: `ADMIN_PRIVILEGED_READ_RPCS` 도입, preflight + response fence. 실제 Chromium RED #38313201462 → 최종 27 PASS/0 FAIL #38314535322, 요청 중 권한 변경 20 PASS/0 FAIL #38313695541.
- 제품 결함② 실제 Chrome 두 탭 native confirm 동안 다른 탭이 관리자 unlock을 제거해 preflight와 fetch 사이 값이 달라진 PC 경쟁 조건: 추가 최후 네트워크 전송 경계 재확인, RED #38313908659 → GREEN #38314146810, #38314485271, #38314634523 (각 2 PASS/0 FAIL). 서버 RLS의 전부를 증명하는 것은 아님.
- 최종 전체 Chrome 깊이8 회귀 **206 PASS / 0 FAIL 3회 독립**: #38314296878, #38314472526, #38314621962. SHA/bytes 고정.
- 독립 원본 무결성 **PASS** #38314305584 / #38314817827. 변경 4 hunk, JS 파싱, DOM 457 IDs 유일성.
- 공식 보고 `qa-handoff/QA_2-8-245_REPORT.md`, 증거 `qa-handoff/QA_245_EVIDENCE_AUDIT.json`, SHA manifest `qa-handoff/QA_2-8-245_SHA_MANIFEST.json`.
- 운영 Supabase/RLS·실 backend 다중사용자·물리 Android 파일/카메라·iOS Safari·persisted BFCache·운영 백업복원 미검증.
- 다음 블록 High·깊이8, 블록 최소20분 실제 검수, 20분 내 중간 진행보고, 오류 즉시 수정·실 Chromium 회귀, 번호 연속, 버전/SQL/main/운영배포 임의 변경 금지.
- ZIP 업로드/다운로드 요구 금지. 연결된 GitHub에서 직접 작업할 것.
