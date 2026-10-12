# 근무모아 2차·깊이 8단계 2-8-246 공식 완료 보고

**최종 판정: 공식 완료 (High·깊이8).** 공식 누적 제품 결함 **527→528종**, 신규 **1종**(관리자 전용 일반 조회 RPC 보호 목록 누락; 인사 복구 기준값 1종+동적 용량 메타데이터 5종). 동일한 권한 분류 allowlist 누락이 **같은 단일 소스 위치**에서 발생했으므로 화면/실패 건수 기준으로 결함 수를 2~6종으로 중복 집계하지 않음.

## 1. 검수 연속성·무결성
- 마지막 유효 완료 2-8-245 → 이번 **2-8-246** → 다음 **2-8-247**. 결함 527 + 1 = **528종**.
- 실제 심층검수 **2026-10-13 08:31 KST ~ 2026-10-13T08:54:28.661+09:00**, 20분 이상 GitHub 원본 검증, 역할/세션 source 정적 분석, 여러 실제 Chromium RED/ GREEN, 다중 탭 native dialog / 권한 해제 도중 요청, 기존 8계층 회귀, 소스 diff/해시 검사, 재검 및 인계.
- 불변 시작본 `qa-handoff/index.before-2-8-246.html`: SHA-256 `be95422d3b79f9cc2348196a07b46e44d5269a353fc73dec98cdc065381029da`, **1,169,443 bytes**.
- 최종 QA `index.html` 및 `qa-handoff/index.working-2-8-246.html`, 다음 불변 시작본 `qa-handoff/index.before-2-8-247.html`: SHA-256 `8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d`, **1,169,644 bytes**.
- Git 변경은 QA `qa-2-8`만. 운영 `main` `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로; SQL 변경, 실배포 **없음**, `APP_VERSION ver20260927-0944` 및 `version.json` 유지.

## 2. 신규 제품 결함 1종: 관리자 전용 일반 read RPC의 불완전한 허용 목록
- 245차에서는 대표 관리자 읽기 RPC 5개가 `ADMIN_PRIVILEGED_READ_RPCS` 목록에 추가됐지만, 실제 관리자 기능에서 사용하는 다음 **6개**가 누락됨.
  1. 인사 복구 지점 복원의 최신 revision 조회 `get_personnel_restore_revision_v1`.
  2. 관리자 용량 화면의 동적 보조 조회 `get_company_event_capacity`.
  3. `get_holiday_work_eligibility_capacity`.
  4. `get_annual_leave_capacity`.
  5. `get_overtime_storage_capacity`.
  6. `get_memo_dday_storage_capacity`.
- 관리자 2차 인증 unlock 해제 후에도 공통 `rpc()`에서 위 6종은 일반 read로 간주하여 클라이언트가 요청을 송신함. 서버 측 권한 판단/실제 DB 처리와 구분해야 함.
- 실제 Chrome RED 인사 revision [#38322894855](https://github.com/eco-i/eco-i.github.io/actions/runs/38322894855): 모바일/PC 각 1건 전송. 동적 용량 5종 RED [#38323230263](https://github.com/eco-i/eco-i.github.io/actions/runs/38323230263): 모바일/PC 각각 **5건 전송**, 총 10개 실패 assertion이지만 **별도 10종 결함으로 집계하지 않음**.
- 수정: 중앙 `ADMIN_PRIVILEGED_READ_RPCS`에 6개 이름을 등록. 기존에 구현된 요청 전 권한 검사·최종 fetch 경계·응답 도착 후 권한 검사들이 새 RPC에도 적용되게 함. 일반 직원 개인 메모 조회 및 적법한 관리자 조회는 보존.
- 실제 Chrome GREEN 인사 revision [#38323036969](https://github.com/eco-i/eco-i.github.io/actions/runs/38323036969): **19 PASS/0 FAIL**. 보조 용량 5종 [#38323322734](https://github.com/eco-i/eco-i.github.io/actions/runs/38323322734): **27 PASS/0 FAIL**.
- 요청 대기 중 계정 read-only, 관리자 unlock 회수, admin 역할 강등으로 늦은 응답을 폐기하는 검사 [#38323389313](https://github.com/eco-i/eco-i.github.io/actions/runs/38323389313): **18 PASS/0 FAIL**.
- 실제 서로 다른 Chrome 2탭 + native confirm 사이 관리자 인증 회수: 인사 revision [#38323157946](https://github.com/eco-i/eco-i.github.io/actions/runs/38323157946), 보조 용량 [#38323513571](https://github.com/eco-i/eco-i.github.io/actions/runs/38323513571): 각각 모바일/PC **2 PASS/0 FAIL**.

## 3. 민감 화면과 세션의 추가 실사용 브라우저 검증
- 실제 두 탭에서 관리자 unlock 회수 시 감사로그·인사 복구지점·용량 내역·안전백업의 **숨은 DOM 문자열도 폐기**, 관리자 PIN 상태 캐시 초기화, 도구 숨김, 유효한 본인 로그인 세션은 유지: [#38324406058](https://github.com/eco-i/eco-i.github.io/actions/runs/38324406058) **18 PASS/0 FAIL**.
- Native Chrome confirm이 떠 있는 동안 다른 탭이 unlock 회수하는 경로의 화면·캐시 purge [#38324315744](https://github.com/eco-i/eco-i.github.io/actions/runs/38324315744) **18 PASS/0 FAIL**.
- 초기 UI purge 테스트에서 B탭에 전체 앱을 동시에 부팅시켜 로그인 복구 루틴이 권한 저장소에 개입했거나, B탭이 admin unlock write를 관찰하기 전에 삭제하여 사전 조건이 무효인 사례가 존재. 단순 제품 결함으로 집계하지 않고 **B탭을 같은 origin의 실행 스크립트 없는 passive 문서로 분리**, 키 값을 양 탭에서 확인한 뒤 삭제하도록 하네스 수정. 유효한 재현 조건에서 최종 GREEN 위 두 회차 확인. 초기 불량 fixture 결과는 제품 결함/회귀 실패에서 제외하되 이력을 숨기지 않음.

## 4. 깊이8 전체 Chrome 회귀(최종 동일 SHA)
- [#38323566153](https://github.com/eco-i/eco-i.github.io/actions/runs/38323566153) **209 PASS / 0 FAIL**.
- [#38323876681](https://github.com/eco-i/eco-i.github.io/actions/runs/38323876681) **209 PASS / 0 FAIL**.
- [#38323995971](https://github.com/eco-i/eco-i.github.io/actions/runs/38323995971) **209 PASS / 0 FAIL**.
- 기존 전체 QA 범위의 2026~27 교대조 계산(2,920 독립 사례), 대정비 10/1~15, 연차 500 fuzz, 월간 31일 달력, PIN/인사/근태/지문·이미지 형식, storage·Web Locks 실제 멀티탭, 320·360·390·430·768·1024·1440 px 반응형 브라우저 등 검수. QA 전용 browser fetch mock과 일부 로컬 스토리지 시뮬레이션을 사용하며 운영 DB의 실제 권한 검증을 뜻하지 않음.
- 소스 독립 무결성 [#38323467567](https://github.com/eco-i/eco-i.github.io/actions/runs/38323467567) + [#38323909769](https://github.com/eco-i/eco-i.github.io/actions/runs/38323909769): 불변 원본 및 최종 SHA, 정확한 **1개** 소스 diff hunk, 새 권한분류 6개만 변화, inline JS 2개 파싱, DOM ID 457개 중복 없음, **PASS**.

## 5. 미검증 범위·차기
- **운영 Supabase/RLS·실 backend 인증 다중 사용자·실제 DB side-effects, 물리 Android 네이티브 카메라/파일 선택기, iOS Safari, 확인된 persisted BFCache, 운영용 백업/복원은 이번 QA 환경에서 직접 검증하지 못함.** 웹 브라우저 prefetch 차단은 서버 RLS를 대체하지 않음.
- 다음 2-8-247은 `qa-handoff/index.before-2-8-247.html` 시작. **High·깊이8 고정, 블록당 최소 20분 실제 검수, 20분 이내 중간 보고, 기술 결함 즉시 수정·실 Chromium 회귀, 번호 연속**, APP_VERSION/SQL/main/운영배포 임의 변경 금지. GitHub 직접 연결, ZIP 불필요.
