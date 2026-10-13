# 근무모아 2차·깊이8 — 2-8-249 공식 검수 완료 보고
**완료 시각 (KST)**: 2026-10-13T23:04:17.485+09:00

## 공식 상태
- GitHub `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`; 마지막 유효 완료 블록 **2-8-249**, 다음 **2-8-250**.
- 검수 깊이 8단계/High 기준, 2026-10-13 **22:38~23:03 KST** 동안 20분 이상 실제 GitHub 소스 추적, 독립 RED, Chromium GREEN/회귀, 무결성 및 인계 완료.
- 신규 독립 제품 결함 **2종**, 공식 누적 **531→533종**.
- 불변 시작본 `qa-handoff/index.before-2-8-249.html`: SHA-256 `9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0`, **1,171,231 bytes**.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-249.html`, 다음 시작본 `qa-handoff/index.before-2-8-250.html`: SHA-256 `4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef`, **1,172,999 bytes**, Git blob SHA `1357eb15db3228e38abf45b7bed72bbeb09cb4c5`.
- `APP_VERSION ver20260927-0944` 유지, `version.json` 불변, SQL 변경 없음. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지. 운영 배포 없음.

## 신규 제품 결함 ①: PC 공유 세션 해제 후 오래된 탭 관리자 인증 부활
- 기존 PC 로그인 유지 세션과 같은 토큰·관리자 표식이 과도기적으로 `localStorage`와 `sessionStorage` 양쪽에 남아 있을 때, 다른 탭의 `localStorage.clear()` 또는 공유 로그인 키 삭제 이후 오래된 탭 저장소의 관리자 잠금해제 표식이 다시 승인됨. 민감 DOM/PIN 캐시도 남음.
- 실제 두 탭 Chromium RED [#38407186141](https://github.com/eco-i/eco-i.github.io/actions/runs/38407186141): **8 PASS / 4 FAIL** (두 시나리오의 권한 및 DOM 실패, 동일 원인 1종).
- 수정: 탭별 공유권한 사용 이력을 토큰에 묶어 `sessionStorage`에 기록. 공유 소유권이 사라지면 예전 탭 토큰으로 관리 권한/세션을 재허용하지 않으며 저장소 변경 이벤트·민감 RPC 소유권/새로고침 경로에서 fail-closed 처리. 독립적인 PC 임시 탭 로그인은 영향 없도록 분기.
- Chromium GREEN [#38409331999](https://github.com/eco-i/eco-i.github.io/actions/runs/38409331999): **14 PASS / 0 FAIL**, 공유 전체/개별 삭제·관리자 UI 제거·새로고침 재승인 방지·독립 탭 유지.

## 신규 제품 결함 ②: 네이티브 확인창 종료 직후 권한 회수 전 보호 RPC 발신 경쟁 상태
- 실제 Chromium 네이티브 `confirm()` 처리 중 다른 탭이 공유 세션을 해제하면, 한 렌더러에 storage 변경이 늦게 관측되어 이미 둔 0ms 비동기 RPC 검사 이후에도 오래된 세션의 관리자 조회 RPC가 `fetch`까지 진행될 수 있음. 서버 응답을 폐기하더라도 요청 자체 발신은 별도 문제.
- 실제 두 탭 Chromium RED [#38408704094](https://github.com/eco-i/eco-i.github.io/actions/runs/38408704094): 공유 저장소 전체 삭제에서 `list_recent_audit_page` 외부 발신 확인. 네이티브 확인창의 동기 반환값만으로 안전성을 증명할 수 없음을 확인.
- 수정: 네이티브 `confirm`/`prompt` 복귀 후 짧은 저장소 정합성 유예구간을 기록하고, 보호 RPC는 유예 후 세션 epoch·공유 권한·관리자 권한을 요청 발신 전에 재검사. 확인창 자체가 곧바로 true를 반환할 수 있는 브라우저 제한은 인정하고 최종 전송 경계를 보장.
- 실제 네이티브 Chromium GREEN [#38409579533](https://github.com/eco-i/eco-i.github.io/actions/runs/38409579533): **10 PASS / 0 FAIL**, 공유 전체/개별 삭제 모두 보호 RPC 전송 **0건**, 세션 무효화 확인.

## 8계층 회귀 / 무결성
- 최종 동일 SHA `4a39b50e90355a372c8cfc8d65e8d046d558da9bd193569bd4207f9289b670ef` 대상 전체 실제 Chromium 8계층 테스트 **212 PASS / 0 FAIL × 3회 독립 실행**:
  - [#38409501429](https://github.com/eco-i/eco-i.github.io/actions/runs/38409501429)
  - [#38409770570](https://github.com/eco-i/eco-i.github.io/actions/runs/38409770570)
  - [#38409799397](https://github.com/eco-i/eco-i.github.io/actions/runs/38409799397)
- PC/모바일 `adminUnlockMatches` 상태 조합·tombstone 총 **648개 검사**: [#38408818543](https://github.com/eco-i/eco-i.github.io/actions/runs/38408818543) PASS.
- 독립 SHA·바이트·inline JS 2개 파싱·DOM ID 457개 고유성·보안 변경 범위 diff 14 hunks/40 lines: [#38409507687](https://github.com/eco-i/eco-i.github.io/actions/runs/38409507687) PASS.
- 자동 검수도구에서 오래된 후보 SHA/byte를 비교해 실패하거나, 네이티브 스텁 조건/DOM 추출 범위가 부정확해 실패했던 시행착오는 **제품 결함으로 집계하지 않음**.

## 미검증 범위
- 실제 운영 Supabase 인증/SQL/RLS, 운영 데이터 다중 사용자, 물리 Android 카메라·파일 선택기, iOS Safari, persisted BFCache, 운영 백업·복원은 실행하지 않음.
- 모든 Chromium 브라우저 테스트는 실제 headless Chrome UI/저장소/Web Locks/native dialog를 이용했으나 네트워크 RPC는 스텁이며 서버 측 권한 검증을 대체하지 않음.
- 다음 블록 **2-8-250**은 불변 `qa-handoff/index.before-2-8-250.html`에서 시작. High·깊이8·최소20분 실제 검수·20분 이내 보고·기술 오류 즉시 수정 및 회귀. SQL/`main`/APP_VERSION/운영 배포 임의 변경 금지.
