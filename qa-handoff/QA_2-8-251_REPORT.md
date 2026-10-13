# 근무모아 2차·깊이8 — 2-8-251 공식 완료 보고

**검수 완료 시각 (KST):** 2026-10-14T00:07:21.936+09:00

## 공식 상태
- 마지막 유효 완료 블록 **2-8-251**, 다음 시작 **2-8-252**, 공식 누적 제품 결함 **534 → 535종** (이번 독립 결함 +1종).
- High / 깊이8 고정. **2026-10-13 약 23:45 KST부터 2026-10-14 00:06 KST까지 20분 이상 실제 GitHub 소스 추적·Chromium RED/GREEN·재검증·인계 수행**. 중간 보고 23:48, 23:59, 00:05 KST.
- 시작 기준본 `qa-handoff/index.before-2-8-251.html`: SHA256 `aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841`, 1,173,309 bytes.
- 검수 QA `index.html`, `qa-handoff/index.working-2-8-251.html`, 다음 불변 시작본 `qa-handoff/index.before-2-8-252.html` SHA256 `90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e`, **1,173,752 bytes**, Git blob `db7b1904ad620ac7fc630ff4c13ac57487983227`. 3개 파일 Git blob 재검증 일치.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로 유지, 실배포 없음, SQL 변경 없음, `APP_VERSION ver20260927-0944` 및 `version.json` 불변.

## 신규 독립 제품 결함 1종 — PC 공유 관리자 권한 이력 sessionStorage 기록 실패 시 복구 우회
- 원인: 250차에서 개선된 `pcSharedAuthorityRevoked`는 공유 로그인·탭 로그인이 동일 토큰인 경우 권한 이력을 `sessionStorage`에 기록하지만, `setItem`의 저장 공간 부족·쓰기 예외 시 오류 반환을 무시할 위험이 있음. 기록이 누락된 뒤 다른 탭이 공유 세션을 삭제하면 잔존 탭 토큰·2차 관리자 표식으로 관리자 복구 가능.
- 실제 두 탭 Chrome RED [#38416370588](https://github.com/eco-i/eco-i.github.io/actions/runs/38416370588): **8 PASS / 4 FAIL**. 전체 공유 저장소 삭제와 공유 세션 키 삭제 두 경우 모두 이전 관리자 세션 복구로 보안 기대조건 위반. 정상 저장과 독립 PC 탭은 통과.
- 해결: 권한 이력 기록 실패 시 해당 탭의 `SESSION_KEY` 및 `ADMIN_UNLOCK_KEY`를 즉시 지우고 현재 호출을 fail-closed 처리. 이로써 유지된 유효 공유 로그인은 공유 저장소를 통해서만 검증되며, 나중에 공유 세션이 제거돼도 삭제된 탭 fallback으로 권한이 부활하지 않음. 개인 PC 탭 전용 로그인은 독립 유지.
- 실제 Chrome GREEN [#38417057536](https://github.com/eco-i/eco-i.github.io/actions/runs/38417057536) 및 독립 재실행 [#38418861912](https://github.com/eco-i/eco-i.github.io/actions/runs/38418861912): 각각 **12 PASS / 0 FAIL**. 초기 후보에서 fail-closed 반환만 수행한 단계와 테스트 기대조건 초기 정정 오류는 미완성·하네스 문제로 분리, 공식 결함 추가 집계하지 않음.
- 실제 관리자 화면의 권한 즉시 해제 및 다른 탭 세션 삭제 [#38418204991](https://github.com/eco-i/eco-i.github.io/actions/runs/38418204991): **16 PASS / 0 FAIL**.
- 진짜 브라우저 새 페이지 부팅·초기 PIN RPC 지연·다른 탭 로그아웃·QuotaExceededError·재로드 부활 방지 [#38418643406](https://github.com/eco-i/eco-i.github.io/actions/runs/38418643406), 독립 반복 [#38418877031](https://github.com/eco-i/eco-i.github.io/actions/runs/38418877031): **19 PASS / 0 FAIL**, 유효한 독립 PC 세션 유지.

## depth8 실 Chromium 회귀
- 최종 동일 SHA `90616051815b531adb615ba23005ad504ffb6898ffe5b6b19c3de9b147766c4e`, 1,173,752 bytes에서 **214 PASS / 0 FAIL × 독립 3회**: [#38417831006](https://github.com/eco-i/eco-i.github.io/actions/runs/38417831006), [#38418307576](https://github.com/eco-i/eco-i.github.io/actions/runs/38418307576), [#38418466284](https://github.com/eco-i/eco-i.github.io/actions/runs/38418466284).
- PC/모바일 토큰·관리자 표식·로그아웃 tombstone **648 상태 조합 PASS**: [#38417703415](https://github.com/eco-i/eco-i.github.io/actions/runs/38417703415).
- 실제 Chrome native confirm/prompt 중 다른 탭 권한 철회·보호 RPC 차단 **10 PASS / 0 FAIL**: [#38418450317](https://github.com/eco-i/eco-i.github.io/actions/runs/38418450317).
- 정적 HTML SHA256 및 바이트·인라인 JS 2개 문법 검사·중복 없는 정적 DOM ID 457개·APP_VERSION·변경 diff 단일 hunk 10줄 검증 PASS: [#38417415390](https://github.com/eco-i/eco-i.github.io/actions/runs/38417415390).
- 기존 8계층의 교대근무/대정비 달력·연차 시간계산·권한·초기 PIN·지문 사진·미처리 작업·다중탭/Web Locks·320~1440px 대응 등 전체 회귀 테스트도 포함.
- 실제 서버 검증 미포함: 운영 Supabase SQL/RLS/authenticated multiuser, 물리 Android 카메라/파일 피커, iOS Safari, persisted BFCache, 운영 백업 복원. Headless Chromium이 실제 브라우저이며 네트워크 RPC는 모의.
- SQL/APP_VERSION/main/실배포를 임의로 변경하지 않았고, ZIP 파일을 요구하지 않음.

## 다음 시작
**2-8-252**, 기준본 `qa-handoff/index.before-2-8-252.html`. QA 규칙 High·깊이8·각 블록 최소20분 실제검수·최대20분 내 KST 보고·오류 즉시 수정 및 회귀·번호 연속 유지.
