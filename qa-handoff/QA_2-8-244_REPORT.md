# 근무모아 2차·깊이 8단계 종합검수 — 2-8-244 공식 완료 보고

**판정:** High, 깊이 8단계. 실제 Chromium에서 서로 다른 클라이언트 권한 경계 결함 3종을 RED로 재현, `qa-2-8`만 수정 후 GREEN·전체 회귀. 최종 동일 SHA로 독립 전체 Chromium 검수 **203 PASS / 0 FAIL, 2회 연속**. 실제 운영 Supabase DB·RLS, 물리 모바일 네이티브 파일/카메라와 iOS Safari는 미검증.

## 1. 공식 상태
- 완료 블록 **2-8-244**, 다음 **2-8-245**, 공식 누적 제품 결함 **522 → 525종**(신규 3종).
- 실제 검수 시작 **2026-10-12 23:34:17 KST**, 완료 **23:56:10 KST**, 약 22분의 실제 GitHub 코드 분석·브라우저 결함 재현·수정·독립 검증·인수인계.
- 불변 시작 `qa-handoff/index.before-2-8-244.html`: SHA-256 `fce60b1d8932c5f4d4b232d1c1cd319a13bf2b4f265aec05f0424e3b7d64e8b4`, 1,167,315 bytes.
- 최종 `qa-handoff/index.working-2-8-244.html`, 검수 브랜치 `index.html`, 다음 `qa-handoff/index.before-2-8-245.html`: SHA-256 `9bfce02ca8be15ae1a59eebec2d3b05d1563784719ebec6308b7537e8fb9d9ab`, 1,168,824 bytes.
- `APP_VERSION ver20260927-0944` 유지. SQL 변경 없음. 운영 `main` 커밋 `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. 운영 배포 없음.

## 2. 신규 제품 결함 ① 강제 PIN 변경 게이트에서 일반 업무 조회 RPC가 전송됨
- PIN 초기화가 강제되는 동안 243차에서 보완된 `guardMandatoryInitialPinGateRpc`는 mutation/sensitive-read만 차단했고 일반 `list_my_memos` 인증 조회는 그대로 전송.
- 실제 RED [#38264305073](https://github.com/eco-i/eco-i.github.io/actions/runs/38264305073): 모바일·PC 각각 메모 조회 1회 송신. 같은 상황에서 민감 export는 기존 검사로 차단되며 초기 PIN 상태확인은 정상 송신.
- 수정: `guardOrdinaryAuthenticatedReadRpcSession`에서도 강제 PIN 게이트 검사를 실시하되 `initial_pin_status_v1`, `is_initial_pin`, `get_initial_pin_me_v1`, `get_me`, `get_me_personnel_v1`의 PIN 회복에 필요한 신원/상태 조회는 허용. 기존 자기 PIN 변경 `change_own_pin_v2`도 정상 허용.
- 집중 GREEN [#38264680384](https://github.com/eco-i/eco-i.github.io/actions/runs/38264680384): 강제 PIN 중 업무조회 0건, 정상 PIN 상태조회 허용.

## 3. 신규 제품 결함 ② 관리자 해제 표식이 폐기되어도 권한 RPC를 전송
- 보호된 `admin_reset_data_v2`와 관리자 export/preview 경로는 세션 token만 확인하고 `adminUnlockMatches` 재검사 없이 요청을 전송할 수 있었음.
- 실제 RED [#38264305073](https://github.com/eco-i/eco-i.github.io/actions/runs/38264305073): 모바일·PC에서 관리자 표식을 RPC 대기 중 제거하자 `admin_reset_data_v2` 송신 1건 재현.
- 수정: `guardAdminPrivilegeRpcSession` 도입, `admin_*` 보호 mutation과 관리자 민감 조회용 명시적 RPC에 대해 `activeAdminMode()` 검사. 기존 사용자가 명시적으로 승인한 미저장 관리자 초안에 한해서만 원래의 제한된 deferred draft-save 허용 조건 유지. 관리자 권한이 없는 상태에서 별도의 원격 특권 작업을 보내지 않음.
- 집중 GREEN [#38264680384](https://github.com/eco-i/eco-i.github.io/actions/runs/38264680384): 관리자 표식 폐기 시 전송 0건, 표식 정상 복구 후 합법적 관리자 요청 1건 허용.

## 4. 신규 제품 결함 ③ 관리자 권한이 요청 중 해제되어도 늦은 민감 응답이 그대로 반환
- 관리자 백업 `export_admin_data_v1`가 시작할 때 unlock이 유효하더라도, 서버 응답 대기 중 unlock이 폐기되면 기존 `assertRpcResponseOwnerCurrent`는 token+epoch만 확인하여 민감 응답을 caller에 그대로 넘겼음.
- 실제 RED [#38265124479](https://github.com/eco-i/eco-i.github.io/actions/runs/38265124479): 모바일·PC에서 늦은 관리자 export 및 admin reset 응답 각각 반환.
- 수정: 소유권 응답 fence에서도 `guardAdminPrivilegeRpcSession(name,options)` 재확인. `ADMIN_PERMISSION_REVOKED`를 네트워크 오류/미확정 저장으로 잘못 분류하지 않게 catch 구분.
- 실제 Chromium GREEN [#38265400195](https://github.com/eco-i/eco-i.github.io/actions/runs/38265400195): 모바일·PC 각각 권한 폐기 후 관리자 응답 차단, 정상 관리자 export 응답 허용, **6 PASS / 0 FAIL**.
- 이미 서버에 전송한 RPC의 DB-side effects를 되돌린 것으로 해석해서는 안 됨. 이 수정은 브라우저 측 늦은 응답 수용/표시를 차단함. SQL/RLS 서버 규칙은 따로 검증이 필요.

## 5. 전체 깊이8 실측 결과
- 집중 강제 PIN·관리자 권한 [#38265400457](https://github.com/eco-i/eco-i.github.io/actions/runs/38265400457): **12 PASS / 0 FAIL**.
- 관리자 지연 응답 [#38265400195](https://github.com/eco-i/eco-i.github.io/actions/runs/38265400195): **6 PASS / 0 FAIL**.
- 전체 Chromium 최종 SHA 고정 1회 [#38266109470](https://github.com/eco-i/eco-i.github.io/actions/runs/38266109470): **203 PASS / 0 FAIL**.
- 최종 같은 후보의 독립 반복 [#38266345029](https://github.com/eco-i/eco-i.github.io/actions/runs/38266345029): **203 PASS / 0 FAIL**.
- 독립 소스 무결성 [#38266038263](https://github.com/eco-i/eco-i.github.io/actions/runs/38266038263): 시작·최종 SHA/byte 고정, 코드 변경 **8개 diff hunk**, 원본 삭제 6줄 모두 의도된 보안 가드·이전 설명문 변화, inline JS 2개 구문, DOM ID 457개 유일성 통과.
- 전체 회귀에는 기존 로그인·인사/관리자·지문사진/민감 백업/일반조회, Web Locks/멀티탭, 2,920개 근무조 사례, 연차 500개 fuzz 집합, 2026년 10월 대정비, 320~1440 px 7종 UI와 월간 달력 31일이 포함. 브라우저 fetch stub을 사용하는 시험은 실제 Supabase 인증/RLS 증거가 아님.

## 6. 결함 종류 구분 및 다음 블록
- 신규 제품 결함은 **3종**. 초기 scope suite의 실패 assertion 6개, 사후 무결성 스크립트의 허용 주석 3줄 누락으로 인한 검증 도구 실패는 별도 제품 결함이 아님. 도구 수정 후 원본 SHA·정확한 diff PASS 확인.
- 운영 Supabase DB/RLS, 실제 인증된 다중 사용자 backend, 물리 Android 카메라·파일선택, iOS Safari, persisted BFCache, 실제 운영 백업/복원은 직접 미검증.
- 다음 **2-8-245**는 `qa-handoff/index.before-2-8-245.html` 시작. High·깊이8, 실제 블록당 최소20분, 20분 이내 중간보고, 오류 즉시 수정/실 Chromium 회귀, 번호 연속. 새 버전/SQL/main/배포 임의 변경 금지. ZIP 불필요, GitHub 직접 이용.
