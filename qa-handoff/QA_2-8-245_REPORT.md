# 근무모아 2차·깊이 8단계 종합검수 — 2-8-245 공식 완료 보고서

**판정:** High·깊이8. 실제 Chromium 모바일 에뮬레이션·데스크톱·실제 두 탭 native confirm을 사용하여 신규 클라이언트 제품 결함 2종 RED 재현 및 수정. 최종 동일 SHA에서 전체 Chromium **206 PASS/0 FAIL 독립 3회**, 집중 권한검사·실제 두 탭·소스 무결성 회귀 성공.

## 1. 공식 연속성과 소스
- 이전 공식 2-8-244 → **이번 2-8-245 완료** → 다음 **2-8-246**. 공식 누적 제품 결함 **525 → 527종**, 이번 독립 신규 **2종**.
- 실제 검수 시작 **2026-10-13 06:49 KST**, 완료 **2026-10-13T07:11:05.128+09:00**, 최소 20분의 GitHub 정밀 소스 리뷰·실제 브라우저 결함 RED/수정/GREEN·다중 독립 회귀 및 인수인계.
- 불변 원본 `qa-handoff/index.before-2-8-245.html` SHA-256 `9bfce02ca8be15ae1a59eebec2d3b05d1563784719ebec6308b7537e8fb9d9ab`, **1,168,824바이트**.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-245.html`, 다음 시작 `qa-handoff/index.before-2-8-246.html`: SHA-256 `be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da`, **1,169,443바이트**.
- APP_VERSION `ver20260927-0944` 및 `version.json` 유지. SQL·운영 `main`·실배포 변경 없음. 운영 main SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지.

## 2. 신규 제품 결함 ① — 관리자 2차 잠금 뒤 일반 관리자 전용 read RPC 전송
- 244차가 보호한 mutation/민감 read 밖에 놓인 `list_recent_audit_page`, `list_personnel_snapshots`, `list_employee_pin_status`는 관리자 UI에서는 `activeAdminMode()`를 확인했지만 공통 `rpc()` 경로의 권한 경계를 우회해 직접 전송 가능.
- 실제 Chrome RED [#38313201462](https://github.com/eco-i/eco-i.github.io/actions/runs/38313201462): 모바일/PC에서 각각 세 종류의 관리자 read RPC가 unlock 없이 서버 쪽 fetch stub으로 각 1건 송신(전체 개별 실패 assertion 6개 = 한 원인).
- 수정: `ADMIN_PRIVILEGED_READ_RPCS` 명시적 allowlist에 위 3종 및 관리자 전용 용량 `get_capacity_usage`, 인사변경 영향 `get_personnel_change_impacts` 추가. 공용 ordinary read 사전 fence에서 `guardAdminPrivilegeRpcSession(name)` 적용. 이미 존재하던 응답 소유권 검사 또한 이 새 목록에 동일하게 적용.
- 실제 Chrome 최종 집중 GREEN [#38314535322](https://github.com/eco-i/eco-i.github.io/actions/runs/38314535322): **27 PASS / 0 FAIL**. 해제된 관리자 5종 조회 전송 0, 정상 관리자 조회 허용, 일반 개인 메모 조회 허용. PC 탭 전용 세션 A는 다른 공유 세션 B의 관리자 해제와 독립성을 유지하고, A 자신의 탭 관리자 해제는 차단.
- 권한이 요청 도중 해제·조회전용 전환·직원 역할로 강등되는 응답 단계 회귀 [#38313695541](https://github.com/eco-i/eco-i.github.io/actions/runs/38313695541): **20 PASS / 0 FAIL**.
- 최초 테스트 하네스의 `Promise.all` 동시 probe 건수 중복 및 백그라운드 fetch 섞임은 **테스트 도구 오류**로 수정 후 개별 순차 검증. 별도 제품 결함으로 세지 않음.

## 3. 신규 제품 결함 ② — 실제 cross-renderer 관리자 unlock 폐기가 RPC preflight와 fetch 사이에서 도착
- 현실 Chrome 두 탭에서 탭 A가 native confirm을 띄운 사이 탭 B가 공유 관리자 unlock 키를 삭제. 탭 A의 `guardAdminPrivilegeRpcSession` 검사는 잠깐 이전 값을 보았으나, 실 fetch 시점에는 권한 해제가 이미 반영된 경우를 재현.
- 실제 Chrome RED [#38313908659](https://github.com/eco-i/eco-i.github.io/actions/runs/38313908659): 모바일 0건 차단, PC **관리자 감사 조회 RPC 1건 전송**. 내부 계측 `unlockAtFetch=false` 확인. 단순 미인증 호출이 아닌 **preflight↔fetch 시간차**의 별도 원인.
- 수정: `rpc()` 보호된 mutation/민감 read/관리자-only read가 네트워크를 호출하기 **직전의 마지막 동기 경계**에서 `guardAdminPrivilegeRpcSession(name,options)`를 재실행.
- 실제 두 탭과 native Chrome confirm GREEN [#38314146810](https://github.com/eco-i/eco-i.github.io/actions/runs/38314146810), [#38314485271](https://github.com/eco-i/eco-i.github.io/actions/runs/38314485271), [#38314634523](https://github.com/eco-i/eco-i.github.io/actions/runs/38314634523): 각 **모바일+PC 2 PASS / 0 FAIL**. 실제 재현 조건에서 두 환경 모두 관리자 감사 RPC 전송 0건.
- 이 브라우저 검사는 client 요청전 보호의 재현 사례를 증명한다. 다른 프로세스의 저장소 전파가 임의 지연될 수 있으므로 클라이언트만으로 임의의 경합에 대해 완전한 서버측 보안을 보장한다는 뜻은 아니다. 운영 DB 함수 권한·RLS의 서버측 검사는 **미검증**.

## 4. 전체 깊이8 회귀 및 무결성
- 최종 동일 SHA `be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da`로 반복한 전체 Chromium:
  - [#38314296878](https://github.com/eco-i/eco-i.github.io/actions/runs/38314296878): **206 PASS / 0 FAIL**
  - [#38314472526](https://github.com/eco-i/eco-i.github.io/actions/runs/38314472526): **206 PASS / 0 FAIL**
  - [#38314621962](https://github.com/eco-i/eco-i.github.io/actions/runs/38314621962): **206 PASS / 0 FAIL**
- 2026~27년 4조2교대 2,920개 독립 근무조 기대값, 10/1~15 대정비, 연차 500 fuzz, 민감 백업/사진 업로드 검증, Web Locks/실제 다중 탭, 31일 달력, 320~1440px 7폭 UI, 로그인·인사 및 관리자 보호 경로에 신설된 245 권한검사 포함.
- 소스/JS/DOM 무결성 [#38314305584](https://github.com/eco-i/eco-i.github.io/actions/runs/38314305584)와 반복 [#38314817827](https://github.com/eco-i/eco-i.github.io/actions/runs/38314817827): 불변 원본 및 최종 SHA/bytes 일치, 소스 **4 diff hunk**, 추가 7줄/기존 교체 1줄, inline JS 2개 parse, DOM ID 457개 고유성 모두 PASS.

## 5. 검증 한계 및 다음 블록
- 테스트는 실제 headless Chromium 및 네트워크 fetch stub 기반이다. **운영 Supabase 인증/RLS, 실제 백엔드 다중 사용자, 물리 Android 카메라·파일 선택, iOS Safari, persisted BFCache 및 실제 운영 백업/복원은 직접 검증하지 않았다.**
- 제품 결함 신규 2종. 이전 SHA를 기대하는 회귀 스크립트의 일시 실패 및 테스트 하네스 동시성 오류는 도구 문제로 분리하고 수정 후 통과했으며 제품 누적 수에 더하지 않았다.
- 다음은 **2-8-246**, 기준 `qa-handoff/index.before-2-8-246.html`. High·깊이8·블록당 20분 실제 심층검수·20분 이내 중간 보고·기술 오류 즉시 수정/실 Chromium 회귀·순번 연속·새 버전/SQL/main/실배포 임의 변경 금지. ZIP 없이 GitHub 공식 파일 직접 사용.
