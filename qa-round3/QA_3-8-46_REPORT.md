# 근무모아 3차·깊이8 — 3-8-46 공식 검수 보고서

## 공식 판정
- **3-8-46: CODE-SCOPED CLEAN (신규 제품 결함 0종, 제품코드 수정 0건).** 3차 누적 신규 결함 **37종 유지**. 2차 540종 별도.
- 기준 QA `index.html` blob **`08867d7117ad9ae5a8247eda8d223687af2b8411`** (3-8-45 이후 불변), `maintenance-20261018.js` blob **`f8e8e469503d0abf53844aa85188b15b09a95238`**. `APP_VERSION=ver20261018-2313` 유지.
- 실제 3-8-45 QA 원본에서 발췌한 함수와 *가상 상태/비동기 RPC 응답*을 연결한 **총 1,062/1,062 assertions / checks PASS**. 실제 화면·로그인 서버·실 기기 E2E 통과 아님. 이 46 CLEAN은 2개의 상이한 마지막 CLEAN 중 **첫 번째 코드 범위 결과에 한함**.
- 운영 `main` baseline SHA **`6c784210e048426f18a486d5602652626d97574d`** 불변, 운영 DB·실 직원/지문·RPC/SQL·배포 변경 0. API mutating calls는 수행하지 않음.

## 위험 기반 깊이8 검수 (이전 43~45 storage event 경계와 *다른 기능 영역*)
1. **GitHub 인계 무결성:** `CURRENT_STATE.json`·45 보고서·`START_HERE_NEW_CHAT.md`·`EXIT_CRITERIA.md` 직접 읽음. 45 완료/46 시작, 37종, QA 코드 blob/production main HEAD 대조.
2. **근태 쓰기 RPC 세션·권한:** 원본 `guardMutationRpcSession`, `guardMandatoryInitialPinGateRpc`, `guardAdminPrivilegeRpcSession` 및 실제 RPC whitelist 추출. 근태 생성/삭제·병가 연차차감·지문 등록/삭제/확인·연차/장기·휴근·계정변경·본인/관리자 PIN 총 **12종 endpoint**, 초기 PIN 강제변경×관리자 권한×조회전용×토큰 불일치×shared mismatch **384/384 scenarios PASS**. 권한 상실·오래된 token은 mutation 전 거부.
3. **근태 저장 2단계 최신성 검사:** 실제 `saveAttendance`의 중복 preflight→휴근 window 재확인→쓰기 직전 관리자/조회전용/세션 epoch/page lifecycle 가드 실행. 관리자 권한 처음부터 없음·중간 상실, 조회전용 전환, 두 preflight 단계 사이 epoch 변동, 화면 백그라운드, 정상 본인/관리자 작성 **11/11 scenario PASS**. 불허 상황의 mock RPC 전송 0, 정상에서 정확히 1회.
4. **연차-근태 시간 연동:** 실제 `annualLeaveUsageBreakdown`, `annualLeaveSegmentsForRecord`, `annualLeaveWorkSegments`, `attendanceTimeWindowForRecord` 실행. 주 11h/야 11h/주2·일근 8h/휴·비 0, 야간 자정 통과·식사시간 제외, 중복 기록 구간 union, 2026-09-12 개시 기준, 병가 차감 flag, 10분 단위 320개 임의 구간의 근무시간 교집합과 교차 확인. **336/336 PASS**.
5. **정비기간 근무조-연가 연동:** 실제 `shiftForGroup`→`shiftForEmployee`→`annualLeaveFullDayMinutes` 함수 연결(인사배치·공휴일/maintenance 서버 구성은 명시적 fake). A/B/C/D 및 DAY, 2026-10-01~15 정비 경계, C조 10/15 야간, 주말·10/9 가상 공휴일, 10/17~26 기본 근무순환, 2030 override 우선순위. **201/201 PASS**. SQL/실제 DB holiday source를 읽어 검증한 것은 아님.
6. **지문 변경 이력·CAS:** 실제 `fingerprintTimestampEqual`과 `applyFingerprintMutationHint`에 timezone/microseconds, stale updated_at, 출근/퇴근 교체·삭제·전체 삭제, 확인 표시 mutation의 optimistic local hint 적용 **75/75 PASS**. 지문 이미지 처리·실제 picker 촬영·서버 동시성은 범위 밖.
7. **Realtime 비동기 catch-up:** 실제 `requestRealtimeCatchup` 함수에 없음/초기 PIN/hidden/shared mismatch/사진 picker/오프라인/저장 중/중첩 refresh/성공·실패·더 새 INSERT signal 11분기 ×5 검증 **55/55 PASS**. mutation 중 누적 신호는 보류되고 실패·새 신호 발생시 pending 유지.
8. **정적/보호 경계:** QA HTML inline script 6개, maintenance JS 1개 **syntax PASS**; DOM ID **488/488 unique**. 실제 소스에 직접 나타난 33종 변경 RPC는 `SESSION_GUARDED_MUTATION_RPCS` 집합 **33/33 등록**. 최종 HTML blob·maintenance blob/버전 불변 확인. 3차 종료 게이트와 실제 browser/QA Supabase 미검증 사항 재확인.

## 환경·증빙 구분
- **확인:** 원본 함수/원본 SQL 아닌 *프런트엔드* + 모의 인사배치/세션/서버응답의 함수 수준 격리 회귀, 정적 syntax/DOM/RPC 목록, 양 브랜치 분리.
- **미실행:** Chrome 같은 출처 2탭 Web Locks/new-old 탭, 실제 전체 앱 관리자 PIN·권한 변경 중 저장/삭제 UI, Android/iOS PWA/네이티브 카메라, Supabase 격리 프로젝트 2계정 Realtime, SQL 동시 commit/rollback, 마지막 실제 데이터 무결성 확인. 운영 DB를 통해 우회 실험하지 않음.
- **유의:** 원본 함수 의존성을 일부 stub했으므로 최종 통합 E2E라고 표시하지 않음. 실제 고위험 미검증을 CLEAN 숫자로 지우지 않는다. `EXIT_CRITERIA.md`는 여전히 **미충족**.

## 다음 범위 3-8-47 / 종료 억제
- 46과 동일한 랜덤 근태/연차 시나리오 재반복 금지. **계정 정지/관리자 PIN 교체·근태 삭제·백업/지문사진의 임시 저장, BFCache, Realtime 지연 응답**에서 서로 다른 권한·데이터손실 경계를 코드상 집중 확인.
- 실제 분리 QA Supabase/브라우저가 없으면 명확히 `UNVERIFIED`로 남기고, 지엽적 블록 증가 대신 사용자와 잔여 고위험 테스트/배포 승인 조건을 구분.
- 전체 3차 완료·main 배포 **승인 아님**.

기록 KST: 2026-10-20T19:59:12+09:00.
