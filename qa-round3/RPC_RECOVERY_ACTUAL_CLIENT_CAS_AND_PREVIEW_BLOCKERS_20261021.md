# 근무모아 — 최신 RPC 복구의 실질적 동시수정·권한 차단항목 검토 (2026-10-21)

**판정: 서버 구현 착수 전 해결해야 하는 설계 의사결정 4묶음 확인.** 이번 작업은 운영 `main` HTML 공개 호출 계약과 기존 QA 설계표의 정밀 재대조이지 **새 함수 SQL 구현/실제 E2E/취약점 악용 실증이 아님**. 이전 37종 공식 결함에 이번 계약 위험을 자동 신규 집계하지 않는다.

## 1. 새로 확인한 구체적인 계약 공백

### (A) 인사발령 취소 — `admin_cancel_personnel_batch_v2` (운영 HTML 10359–10373)
- UI는 `personnelBatchSourceSnapshot`을 만들고 `list_personnel_assignments`로 취소 직전 인사상태를 다시 읽은 다음 `personnelBatchSourceStillSame`으로 비교한다. 이 *사전* 검증 자체는 존재한다.
- 그러나 마지막 서버 호출 **10371행**에서는 `{p_token,p_batch_id}`만 전송한다. 이중 읽기 사이 또는 마지막 읽기→쓰기 사이에 제3자가 발령을 수정하고 여전히 `active`로 유지했을 때, 서버에 전달된 인자로는 **관리자가 원래 확인한 발령 버전**을 식별할 수 없다.
- 서버가 현재 상태를 락으로 검사하고 `active`·미래발령 제약을 강제할 수는 있다. 하지만 **사용자가 본 이전 내용과 동일한지**는 클라이언트 expected 값이 없으므로 일반적으로 비교할 수 없다.
- **필수 설계 선택:** 클라이언트와 서버가 공유하는 expected snapshot/revision 입력을 정하고 트랜잭션 내부 원자 비교를 수행하도록 계약을 *공식 변경*하거나, 다른 동등한 증명 가능한 승인·버전 매커니즘을 정의한다. 버전 없는 구버전 함수 forwarding 금지.
- **독립 QA 반증 시험:** 관리자 A가 과거 버전을 본 뒤 B가 내용을 수정하고 active 유지→A 취소 요청. B 변경을 무단 취소하거나 이력을 오염시키면 불합격. 미래일 검증·권한변경·취소/편집 이력 롤백도 확인.

### (B) 휴일근무 허용 토글 — `admin_set_holiday_work_enabled_v2` (운영 HTML 9451–9472)
- UI는 관리자·근무 가능자·최신 인사·설정 로드 상태를 확인하고 체크박스를 보류시킨 뒤 확인창을 보여 준다.
- 하지만 실제 RPC **9466행**은 `{p_token,p_employee_id,p_enabled}`만 전송한다. 원래 보았던 허용 상태나 revision을 전달하지 않는다.
- 서버에서 ID·관리자 권한·근무가능 유효성·업데이트 락 검사는 가능하나, **서로 다른 관리자의 충돌된 의도**를 그대로 식별하기는 어렵다. 마지막 요청 우선 방식을 채택하면 오래된 화면의 설정으로 덮어써질 수 있다.
- **필수 설계 선택:** `p_expected_enabled` 또는 불변 버전 식별자의 공식 API 계약을 정해 stale 설정을 거부하고 사용자에게 최신 상태 재확인을 요구하는 방향을 우선 검토한다. 마지막쓰기승리 허용 여부는 임의 결정 금지.
- **독립 QA 반증 시험:** 두 관리자가 같은 직원의 사용가능 여부를 반대로 변경할 때 최신 명시 승인 없이 묵시적으로 덮어쓰지 않는지, disable 후 이전 휴일근무 기록이 보존되는지, 권한 철회 중 요청이 차단되는지.

**두 경우 모두 클라이언트 인자 공백이 명백한 것이지, 서버 함수가 실제로 재현되어 위험 동작을 일으킨 사실은 아니다. 최신 이름 2종은 운영에서 미설치이므로 동작 실증 자체가 불가능했다.** 현재 계약표를 몰래 확장하거나 기존 정적 게이트를 GREEN으로 조작하지 않는다.

## 2. 별도 서버 경계 2묶음

### (C) 개인/관리자 공용 복원 미리보기
- 단일 `preview_data_restore_v2`가 **개인 2곳(10998, 11020), 관리자 2곳(11084, 11110)** 에서 호출된다. `strictDataRestorePreviewRpc`는 수신 결과의 `backup_type`을 `personal` 또는 `admin`과 비교하지만 **이것은 클라이언트 후처리**.
- 서버의 반드시 필요한 판단: 호출 당시 유효한 세션/현재 관리자 권한, 요청 payload의 출처·데이터 섹션·직원 범위, 관리자 복원 미리보기 정보의 비관리자 응답 차단, 미리보기 DB 무쓰기. UI의 선택된 scope나 payload 내부 주장만 신뢰하면 안 된다.
- `SECURITY DEFINER` 권한상승 함수에서 RLS 활성화 그 자체로는 서버의 행 접근 통제를 입증하지 못한다. 함수 EXECUTE GRANT/내부 권한검사와 실제 토큰·세션 철회 시험을 별도 수행해야 한다.

### (D) 미리보기→PIN/인사/데이터 복원·초기화 실행
- `get_personnel_restore_revision_v1` → `admin_restore_personnel_snapshot_v3`, `preview_current_personnel_pin_reset_v1` → `admin_reset_current_personnel_pins_v3`, `preview_admin_reset_data_v2` → `admin_reset_data_v2`, `preview_data_restore_v2` → `restore_my_data_v2` 또는 `admin_restore_data_v2`, `preview_safety_backup_restore_v2` → `admin_restore_safety_backup_v2`의 의존관계를 확인.
- 앱 반환 검증기가 요구하는 revision은 **32자리 16진 문자열**. *형식*의 유효성은 다른 관리자와 경합 시 원자성·충돌내성·권한 경계의 보증이 아니다.
- **독립 QA 필수:** 미리보기 이후 다른 관리자가 해당 범위를 수정한 경우 실행 불가/전체 롤백; 잘못된 PIN·권한상태·유효하지 않은 복원 자료는 기록 변경 0, 감사·연관 기록과 복원 전 스냅샷 일관성 확인.

## 3. 다음 실제 복구를 위한 선후관계

1. **비공개 구현 소스와 격리 테스트 실행환경 승인/확보**: 공개 저장소에는 운영 함수 본문·RLS 정책·실제 직원 DB·키·Auth/PIN을 보관하지 않는다. 현재 최신 SQL 정의 **26종 0**, 단독 QA 완전 원본 스키마 없음.
2. **공통 서버 인증·권한·트랜잭션 경계 검토**: 현재 사용자/관리자 권한·PIN·업무시점·EXECUTE/GRANT·RLS·오류 계약. 클라이언트에서만 통과하는 테스트와 서버 권한 검증 구분.
3. **두 expected-state 부재 해결 및 API 변경 승인**: 변경이 결정되면 main/QA 호출 인자 계약과 정적 CI를 조정할 필요가 있지만 승인 전 어느 것도 수정하지 않는다.
4. **실 SQL 함수 26종의 비공개 작성/검토 및 독립 QA 구현**: 정본 없는 임의 함수를 운영 동등 구현으로 간주하지 않음; preview는 읽기전용, mutation은 검증과 변경이 동일 트랜잭션.
5. **실제 PostgreSQL/PostgREST/Auth/RLS 및 가상 직원 두 계정 경합 E2E**: 실제 근태 UI→서버→DB 재조회, P0/P1 8개 영역, rollback·복원, 최소 권한과 로그 감사를 실증한 다음 `3-8-54` 조건 재평가. 비용·프로젝트 생성·민감 소스 이동·운영 SQL 설치/배포는 별도 명시 승인 필요.

## 4. 증거와 결과 분리

- [함수별 미해결 의사결정 기록](e2e/ci/rpc-recovery-unresolved-decision-register.json): 정확한 RPC 이름, 운영 소스 줄번호, 현재 인자, 준비 단계, 필요한 가상 DB 경합 테스트. **모든 판단은 미해결/차단**으로 표시.
- 원본 근거: [26종 클라이언트 인자표](e2e/ci/missing-rpc-recovery-contracts.json), [실제 클라이언트 성공 응답 계약](e2e/ci/rpc-recovery-client-response-contracts.json), [이전 운영 기존 함수 read-only 감사](LIVE_BACKEND_FUNCTION_BODY_SECURITY_REVIEW_READONLY_20261021.md).
- 공식 Supabase 보안 문서: https://supabase.com/docs/guides/api/securing-your-api 및 https://supabase.com/docs/guides/database/functions — **GRANT/EXECUTE와 RLS는 서로 다른 경계**이고 함수 보안은 내부 SQL 실행 권한과 연결되므로 독립 QA에서 직접 검증해야 함.
- **이번 조사 수행:** 공개 GitHub 프런트·QA 상태 파일 읽기, 안전한 비민감 문서/JSON만 `qa-3-8`에 추가. 새로운 라이브 Supabase 카탈로그 조회도 하지 않음. `main`, 실제 직원·근태·지문·세션 데이터, SQL/RPC 설치/실행·운영 배포 변경 0.
- **공식 상태 고정:** 마지막 **3-8-53**, 다음 **3-8-54 미시작·BLOCKED**, 3차 결함 **37종**, **전체 NOT CLEAN / 운영 배포 미승인 / 운영 미설치 RPC 26종 그대로**.
