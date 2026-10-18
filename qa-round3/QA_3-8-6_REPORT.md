# ★★★근무모아 3차·깊이 8단계 종합검수 — 3-8-6 공식 보고서★★★

## 공식 상태
- 검수 운영 기준: `main` SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313`.
- 검수 전용: `qa-3-8`. 완료 블록: **3-8-6**, 다음: **3-8-7**.
- 이번 블록 신규 제품 결함 **0종**. 3차 누적 제품 결함 **3종**(3-8-2-001 / 3-8-5-001 / 3-8-5-002), 2차 역사적 누적 540종은 별도.
- 이 블록 판정: **검증된 범위 PASS**. 동시성 실병렬/일반 직원 실계정/실휴대폰 조작은 **미검증**. 전면적인 3차 CLEAN/배포 완료를 의미하지 않는다.
- 운영 배포·운영 SQL 영구 변경·직원 실기록 영구 변경 **0건**.

## 8단계 영향·회귀 검사
1. **기준·이력 고정**: GitHub `qa-round3/CURRENT_STATE.json`, 전 블록 3-8-5 보고서를 대조. 운영 HEAD와 QA HEAD 독립 확인.
2. **관리자 권한·RLS/ACL**: `_require_admin`의 유효 세션, 현재 active·관리자 플래그 검사 코드 확인. `anon`, `authenticated` DB 역할에 `maintenance_schedule_state.UPDATE` 및 `holiday_work_entries.INSERT` 직접 권한 모두 없음 확인. 유효하지 않은 토큰으로 정비 관리 RPC 호출 시 `SESSION_EXPIRED` 거절 **롤백 실증**. 일반 직원 실제 활성 로그인 계정으로 타인/관리자 조작 금지 시험은 미수행.
3. **CAS·다른 탭 수정**: 활성 임시 관리자 세션 `admin_save_maintenance_schedule`을 가상 변경 후 이미 오래된 revision=0으로 다시 저장 시 `STALE_MAINTENANCE_SCHEDULE` 검증. 기존 revision/기록 보호.
4. **법정·사내 휴일 보호**: 관리자 저장에서 2026-10-05 특별 편성 기간 및 2035-02-12 창립기념일 제외 시도는 모두 `INVALID_EXCLUDED_HOLIDAY` 차단.
5. **기존 휴일근무 이력 충돌**: 2028-10-05 법정 공휴일에 가상 휴일근무 등록 후 해당 공휴일 근무일 전환 시 QA 함수가 `HOLIDAY_WORK_HISTORY_CONFLICT` 거부. 거절 때 기존 휴일근무/개정번호 불변. 가상 기록 삭제 뒤 제외 성공, `_is_holiday_work_day`가 false로 변화, 그 날짜에 신규 휴일근무 등록 시 `NOT_HOLIDAY`. 원상복구 시 다시 휴일 true.
6. **추가 휴일 이력 충돌**: 2028-10-06 관리자 추가 휴일 저장 후 가상 휴일근무 등록. 해당 추가 휴일 삭제 시 QA 함수가 충돌 거부·이력 보호. 휴근 기록 삭제 후 추가 휴일 삭제 가능. 종료 시 `_data_assert_personnel_data_consistency()` 통과. 전부 **BEGIN/ROLLBACK** 단일 트랜잭션에서 검증.
7. **동시성 보호 보강**: 지난 `3-8-5-001` 서버 수정안의 선행 검사만으로는 공휴일 변경과 새로운 휴일근무 등록의 **체크-삽입 경쟁**을 완전히 배제할 수 없음. QA 전용 `qa-round3/fixes/QA_3-8-6_holiday_work_serialization.sql`에 3개 RPC 결합 수정 후보 저장:
    - `admin_save_maintenance_schedule`: 기존 singleton 정비 상태 `FOR UPDATE`와 **기존 휴근 기록 충돌 거부**.
    - `admin_save_holiday_work`, `save_my_holiday_work`: 업무 휴일 여부 판정 및 INSERT보다 **먼저 singleton 정비 상태 `FOR SHARE`**. 관리자/직원 정상 등록 경로와 정비 변경의 트랜잭션 잠금 순서를 동일하게 유지하도록 의도.
    - 3개 함수 SQL을 운영 DB의 **롤백 트랜잭션 내에서만 컴파일/실행**했고 위 변경·거부·원복/시대보호·CAS 경로 모두 PASS. **두 독립 SQL 연결/실제 기기의 충돌 타이밍은 실증하지 못했으므로 동시성 완전 해결 주장 금지.** 직접 복원/기타 INSERT 경로는 향후 검토 필요.
8. **클라이언트 관리자 입력 검증**: 실제 QA `maintenance-20261018.js`의 `maintenanceValidate`와 `maintenanceDayHoliday`를 분리 실행해 2028/2035 기존 공휴일 제외, 창립기념일·2026 특별 편성 보호, 중복 제외, 기간 밖, 등록 공휴일, 겹치는 기간·수동 중복 포함 **17건 PASS**. 지난 블록 QA 클라이언트 패치(저장실패 안내 유지) 문법·격리 표시 시험 결과를 전제하되 실브라우저 입력/클릭 재시험은 미실행. 관리자 추가 휴일 삭제·공휴일 복원 경로 서버 정책과 호응 확인.

## 재현·수정안 상황
- **3-8-2-001**: 메모 2036 서버 허용. `qa-round3/fixes/QA_3-8-2_memo_year_guard.sql` 롤백 검증 완료, **운영 미배포**.
- **3-8-5-001**: 기존 휴근 이력 있는 휴일 재분류 충돌. `qa-round3/fixes/QA_3-8-6_holiday_work_serialization.sql`로 지난 서버 수정보호안을 **동시성 방향으로 보강**. 검증은 순차 서버 롤백 및 코드 잠금순서 검사까지. **운영 미배포**.
- **3-8-5-002**: 정비 관리 실패 안내 사라짐. `qa-3-8/maintenance-20261018.js`의 오류 보존 패치 유지. **운영 미배포**.
- 추가로 확인한 별개 신규 제품 결함 **0종**, 누적 **3종 그대로**.
- 이 블록은 휴근/공휴일 동시 저장의 실재 race를 별도 제품 결함으로 중복 집계하지 않고 **3-8-5-001의 잠재적인 경쟁 조건**으로 관리.

## 데이터 보호·검사 후 확인
| 운영 DB 대상 | 테스트 후 값 |
|---|---:|
| attendance_entries | 5 |
| annual_leave_settings | 2 |
| holiday_work_entries | 19 |
| personal_memos | 12 |
| overtime_entries | 20 |
| maintenance_schedule_state revision | 0 |
| maintenance periods / excluded holidays | 0 / 0 |
| 2028-10-05/10-06 가상 휴근 기록 잔존 | 0 |
| 운영 RPC에 이력 충돌 신규 guard 설치 | false |
| 운영 휴근 RPC에 추가 FOR SHARE 설치 | false |

## 테스트 한계 및 다음
- 실기기 두 대 동시 요청, 실제 일반 직원 세션, 네트워크 중단 재시도와 관리자 실제 모달 UX는 **미검증**.
- 백업복원 함수는 현재 날짜 유효성 검사를 갖고 있는지 정적 확인했고, 실제 대량 복원으로 운영 전체 기록을 바꾸는 시험은 하지 않음. 장기간 운영 데이터 보존 우선.
- 다음 **3-8-7** 권장: 관리자 공유 업데이트 이력 표시·수정·삭제 권한, 인사/근태 관리자 전환 및 공개 표시, 모바일 UI 영향/보안 회귀. 운영 반영·배포는 별도 승인 없이 금지.
