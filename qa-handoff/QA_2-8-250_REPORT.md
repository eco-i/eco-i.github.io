# 근무모아 2차·깊이8 — 2-8-250 공식 완료 보고

**판정:** High·깊이8 실제 Chromium 검수, 신규 독립 제품 결함 **1종**, 독립 RED → 최소 수정 → 실제 Chromium GREEN, 전체 8계층 회귀 **213 PASS / 0 FAIL × 3회**, 안전 경계 및 소스 무결성 검증.

## 공식 상태 및 무결성
- 시작 2026-10-13 23:09:25 KST. 공식 완료 2026-10-13T23:34:12.872+09:00. **20분 이상 실제 심층검수 수행**, 20분 이내 중간보고.
- 마지막 완료 **2-8-250**, 다음 시작 **2-8-251**. 공식 누적 제품 결함 **533 → 534종** (+1).
- 시작 기준본 `qa-handoff/index.before-2-8-250.html`: SHA-256 `4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef`, **1,172,999 bytes**.
- 최종 QA 본체 `index.html`, `qa-handoff/index.working-2-8-250.html`, 불변 다음 시작본 `qa-handoff/index.before-2-8-251.html`: SHA-256 `aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841`, **1,173,309 bytes**, Git blob `01c76b6ae7d0b344713298960bc23860e0c3fc99`.
- APP_VERSION `ver20260927-0944` 및 `version.json` 불변, SQL 변경 없음, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지, 실배포 없음.

## 신규 독립 제품 결함 1종 — PC 로그인 유지 복구 중 관리자 공유권한 이력 미초기화
- 원인: 249차에서 추가된 `pcSharedAuthorityRevoked(token)`은 공유권한 이력 저장을 `state.me` 유무에 종속시킴. 복구 시작 시 아직 사용자 프로필이 로딩되지 않은 상태에서는 유효한 PC shared/tab 이중 토큰의 신뢰 범위가 기록되지 않음. 다른 탭이 같은 공유 로그인 토큰을 제거하면, 이전 탭이 남은 `sessionStorage` 토큰과 관리자 unlock으로 관리자 세션을 복구할 수 있는 경계.
- 실 Chrome RED [#38411568281](https://github.com/eco-i/eco-i.github.io/actions/runs/38411568281): **7 PASS / 2 FAIL**. 공유 전체 제거 및 로그인 토큰 개별 제거 모두 재승인, 무관한 PC 탭 전용 로그인은 정상 유지.
- 추가 원본 cold-page 부트 검증 [#38413606172](https://github.com/eco-i/eco-i.github.io/actions/runs/38413606172), [#38413915094](https://github.com/eco-i/eco-i.github.io/actions/runs/38413915094)은 `state` 초기화 직전 참조와 관련된 초기화 시간대의 브라우저 시험 장애로 결과 불인정. 이 검사 실패들은 신규 제품 결함에 추가하지 않음. 전용 초기화/복구 결함은 위 명확한 RED에서만 1종 집계.
- 수정: `state.me` 로드 여부 대신, 현재 동일 `sessionStorage`·`localStorage` 토큰과 PC 로그인 유지 표식의 일치 증거가 있을 때 즉시 탭별 신뢰 범위 이력을 기록. 사용자 프로필을 기다리거나 옛 탭 unlock으로 범위를 오판하지 않도록 변경.
- 실제 Chrome GREEN [#38411996488](https://github.com/eco-i/eco-i.github.io/actions/runs/38411996488): **9 PASS / 0 FAIL**. 실제 새 페이지 cold-load, 서버 RPC 대기, 다른 탭 공유 토큰 삭제 [#38412684603](https://github.com/eco-i/eco-i.github.io/actions/runs/38412684603), [#38413046942](https://github.com/eco-i/eco-i.github.io/actions/runs/38413046942): 각 **9 PASS / 0 FAIL**. 무관한 독립 PC 탭은 보존.
- 한 원인에서 파생되는 초기 부트 복구·권한 오인·렌더 위험을 개별 assertion 수만큼 중복 집계하지 않음.

## High·깊이8 전체 회귀와 독립 검사
- 최종 동일 SHA `aaf9fc0a9f69c5d5a59280e4050ed6b7036f969febf86ed142fda60ed6d08841`, 1,173,309 bytes에 대해 실제 Chromium 8계층 **213 PASS / 0 FAIL ×3회 독립**:
  - [#38412437555](https://github.com/eco-i/eco-i.github.io/actions/runs/38412437555)
  - [#38413258738](https://github.com/eco-i/eco-i.github.io/actions/runs/38413258738)
  - [#38413272137](https://github.com/eco-i/eco-i.github.io/actions/runs/38413272137)
- PC/모바일 각 162 관리자 세션 조합 + 각 162 tombstone 상태, 합계 **648 상태 PASS**, [#38412921278](https://github.com/eco-i/eco-i.github.io/actions/runs/38412921278). 독립 반복 [#38413292490](https://github.com/eco-i/eco-i.github.io/actions/runs/38413292490).
- 실제 Chrome 두 탭 native confirm/PROMPT 공유권한 해제 경계 **10 PASS / 0 FAIL** [#38412975637](https://github.com/eco-i/eco-i.github.io/actions/runs/38412975637).
- 독립 SHA256, 원본 byte, **인라인 JS 2개 파싱, DOM ID 457개 중복 없음, 변경 1 hunk/6 source lines** [#38412622859](https://github.com/eco-i/eco-i.github.io/actions/runs/38412622859). APP_VERSION 유지.
- 주요 검수 범위: 4조2교대(2920개), 2026년 대정비, 연차 분 단위·자정 경계·500 fuzz, 지문사진/메모/관리자 PIN/민감 RPC, 저장소 two-tab, Web Locks 150/400 병렬 요청, 역할/로그아웃 tombstone, 모바일 에뮬레이션, 320~1440px UI, 실제 네이티브 확인창.
- 미검증: 실제 운영 Supabase SQL/RLS/authenticated multiuser, 물리 Android 카메라·파일선택기, iOS Safari, persisted BFCache 및 운영 백업복원. 모든 클라이언트 검사는 실제 headless Chromium 기반이나 네트워크 RPC는 안전한 mock/stub. 브라우저측 권한 방어는 서버 RLS를 대체하지 않음.

## 인계
- 새 기준본: `qa-handoff/index.before-2-8-251.html`.
- 다음은 **2-8-251**. High·깊이8 고정, 매 블록 최소20분 실제 검수, 20분 내 KST 중간보고, 오류 즉시 수정+실 Chromium 회귀, 유효 완료 다음 번호만 진행. main/SQL/실배포/APP_VERSION 임의 변경 및 ZIP 요청/제안 금지.
