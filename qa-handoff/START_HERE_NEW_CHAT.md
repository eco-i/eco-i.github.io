# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 258 완료

- 마지막 유효 완료 **2-8-258**, 다음 **2-8-259**. 누적 독립 제품 결함 **540종** (258 신규 **1종**, 수정·독립 GREEN 회귀 완료).
- 저장소 `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL·배포·APP_VERSION 변경 없음 (`ver20260927-0944`).
- 258 원본 `qa-handoff/index.before-2-8-258.html`: SHA256 `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9`, **1,174,614 bytes**.
- 258 최종 `qa-handoff/index.working-2-8-258.html`, QA `index.html`, 다음 불변 `qa-handoff/index.before-2-8-259.html`: SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, **1,175,136 bytes**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`.
- 2026-10-15 **11:01:05~11:22:03 KST 20분58초**, High·깊이8, KST 중간보고 준수. 원본 지속 1148초(14회·196스위트 PASS), 수정본 지속 547초(7회·70스위트 PASS).
- **이번 결함**: 백업 복원 파일 `File.text()` 완료 후 다른 탭에서 shared `localStorage` 키를 지워도 현재 탭에는 이전 값이 잠시 보이는 브라우저 교차 렌더러 전파 지연 중 `preview_data_restore_v2` RPC 발송 위험. 원본 Chrome RED (#38668983587 39/40, #38669216746 11/12), 별도 48-case 진단 7회 stale visibility, 독립 통제 RED8/GREEN8 (#38670140217).
- QA 수정은 **개인/관리자 prepare*DataRestore 2곳**의 `file.text()` 뒤 220ms 안정화 대기와 기존 소유권 재검사. 소스 +522 bytes, 버전/SQL 그대로. 수정 후보 실 Chrome 경합 14×40=560/0, 개인·관리자 복원 100+100/0, Full 214/0 및 전체 frontend/backend 통과 [#38669681084](https://github.com/eco-i/eco-i.github.io/actions/runs/38669681084). HTML injection92/0, 실제 Chrome 백업 다운로드22/0, source diff 무결성13/0, 날짜72/0.
- 공식 증빙 `qa-handoff/QA_2-8-258_REPORT.md`, `qa-handoff/QA_258_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-258_SHA_MANIFEST.json`. 실제 운영 Supabase/RLS, 물리 Android 카메라, iOS Safari, BFCache, 실DB 복원 미검증.

## 이어서 진행할 규칙
- `qa-handoff/CURRENT_STATE.json` 확인 후 **2-8-259부터** 번호 연속 진행.
- **High·깊이 8단계·최소20분 실제 검수** 고정. 20분 이내 KST 중간보고 및 답변 시각.
- 제품 결함 발견 시 즉시 수정+RED→GREEN+독립 회귀. 환경/하네스 오류와 구분.
- 운영 브랜치 `main`, SQL, APP_VERSION, 실제 배포 임의 변경 금지. ZIP 제안 금지. 채팅 대용량 출력 대신 GitHub 증빙 기록.
