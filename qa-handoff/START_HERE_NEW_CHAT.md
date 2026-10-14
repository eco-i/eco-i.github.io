# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 251 완료

- 마지막 유효 완료 **2-8-251**, 다음 시작 **2-8-252**, 누적 독립 제품 결함 **535종** (251 신규 **1종**).
- GitHub `eco-i/eco-i.github.io`, QA `qa-2-8`. `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지. SQL/운영 배포/APP_VERSION 변경 없음. `ver20260927-0944`.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-251.html`, 252 시작 `qa-handoff/index.before-2-8-252.html` 일치, SHA-256 `90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e`, **1,173,752 bytes**, Git blob `db7b1904ad620ac7fc630ff4c13ac57487983227`.
- 불변 251 시작본 `qa-handoff/index.before-2-8-251.html`: SHA-256 `aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841`, **1,173,309 bytes**.
- 신규 결함 1종: PC remembered/shared+tab 이중 인증 토큰에서 `sessionStorage` 권한 이력 기록이 QuotaExceededError로 실패하면, 다른 탭이 공유 토큰을 제거해도 탭에 남은 로그인·관리자 표식으로 권한을 복구. 저장 실패 시 tab `SESSION_KEY`와 `ADMIN_UNLOCK_KEY`를 즉시 제거하고 fail-closed. 정상 공유 remembered 로그인과 독립 PC 탭 로그인은 유지.
- 실제 Chrome RED [#38416370588](https://github.com/eco-i/eco-i.github.io/actions/runs/38416370588) **8 PASS/4 FAIL**, 최종 GREEN [#38417057536](https://github.com/eco-i/eco-i.github.io/actions/runs/38417057536), [#38418861912](https://github.com/eco-i/eco-i.github.io/actions/runs/38418861912) **12 PASS/0 FAIL** each.
- 실제 관리자 UI 세션 권한 회수 [#38418204991](https://github.com/eco-i/eco-i.github.io/actions/runs/38418204991) **16/0**. 진짜 cold load, 지연 RPC, 다른 탭 삭제, quota + reload [#38418643406](https://github.com/eco-i/eco-i.github.io/actions/runs/38418643406), [#38418877031](https://github.com/eco-i/eco-i.github.io/actions/runs/38418877031) 각각 **19/0**.
- 8계층 동일 최종 SHA 전체 Chromium **214 PASS/0 FAIL ×3** [#38417831006](https://github.com/eco-i/eco-i.github.io/actions/runs/38417831006), [#38418307576](https://github.com/eco-i/eco-i.github.io/actions/runs/38418307576), [#38418466284](https://github.com/eco-i/eco-i.github.io/actions/runs/38418466284).
- PC/모바일 세션 648개 상태 [#38417703415](https://github.com/eco-i/eco-i.github.io/actions/runs/38417703415) PASS, native dialog 보호 RPC [#38418450317](https://github.com/eco-i/eco-i.github.io/actions/runs/38418450317) **10/0**, 원본·최종 SHA/바이트·인라인JS2·DOM457·1hunk/10 changed lines [#38417415390](https://github.com/eco-i/eco-i.github.io/actions/runs/38417415390) PASS.
- 공식 20분 이상 실제 검수 2026-10-13 23:45경~2026-10-14 00:07 KST. 중간 보고 23:48, 23:59, 00:05 KST. 결함·하네스 문제 명확히 구분. `qa-handoff/QA_2-8-251_REPORT.md`, `qa-handoff/QA_251_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-251_SHA_MANIFEST.json`, `qa-handoff/CURRENT_STATE.json` 참고.
- 실 운영 Supabase/RLS/authenticated multiuser, 물리 Android camera/picker, iOS Safari, persisted BFCache, 운영 백업/복원 미검증. 브라우저는 실제 headless Chromium이나 네트워크 RPC는 mock/stub.
- **다음은 2-8-252**. High·깊이8 고정, **블록별 최소20분 실제 검수**, 20분 내 KST 중간보고, 오류 즉시 수정+회귀, 유효 완료 다음 번호만 순서대로. main/SQL/APP_VERSION/실배포 임의 변경 금지. ZIP 요청/제안 금지.

## 새 채팅방 길이·토큰 절약 운영 규칙 (2026-10-14 사용자 요청)
- **검수 범위·깊이·실제 수행 시간은 절대 줄이지 않는다.** High/깊이8, 블록별 최소20분 실제 심층 검수, 20분 이내 중간보고, 발견된 제품 결함의 즉시 수정과 실 Chromium RED→GREEN→전체 회귀·SHA 검증을 유지한다.
- 길이 최적화는 **ChatGPT 대화/도구 출력량만** 대상으로 한다. 1MB HTML 원문·장문 GitHub Actions 로그·거대 JSON·코드 diff 전체를 사용자 채팅으로 보내지 말고, GitHub에 저장한 뒤 필요한 구간/오류 요약/해시/통과 건수/워크플로 링크만 반환한다. GitHub 연결 도구에서는 코드 실행 내부에서 큰 원문을 처리하고 출력은 작게 제한한다.
- 중복 파일 재조회·중복 테스트 로그 전체 읽기를 줄인다. 다만 검증의 **독립성·3회 반복처럼 필요한 테스트 수**는 축소하지 않는다. 도구 결과의 요약으로 테스트를 수행했다고 속이지 않고, CI 결과가 확정된 경우에만 성공으로 보고한다.
- 중간보고는 20분 안쪽으로 짧게, KST 시각·진행 범위·확정 결함·테스트 상태만 전달한다. 최종 답변은 공식 블록/신규·누적 결함/최종 SHA/회귀결과/다음 블록을 중심으로 간결하게 작성하고 상세 증거는 GitHub QA 보고서로 연결한다.
- 새 채팅방에서는 매번 `qa-handoff/CURRENT_STATE.json`과 최신 SHA 기준본, 최신 공식 보고서를 먼저 확인하여 **마지막 유효 완료 블록 바로 다음 번호**만 시작한다. 이전 채팅 메시지보다 최신 GitHub 공식 상태를 우선하며 ZIP을 요청하지 않는다.
- 위 방식은 모델의 채팅 최대 길이 제한 자체를 해제하거나 다음에도 절대로 길이 경고가 생기지 않는다고 보장하는 것이 아니라, 기록 소모를 줄여 인계 빈도를 낮추려는 조치다.
