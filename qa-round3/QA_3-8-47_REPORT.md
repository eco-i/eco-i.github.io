# 근무모아 3차·깊이8 — 3-8-47 공식 검수 보고서

## 공식 결과 및 안전 경계
- **3-8-47: CODE-SCOPED CLEAN**, 신규 제품 결함 **0종**. 3차 누적 신규 결함 **37종 유지**, 2차 과거 540종 별도.
- 마지막 코드 수정은 **3-8-45**. 이번 블록은 제품 JS/HTML/SQL 수정 **0건**. QA `index.html` blob **`08867d7117ad9ae5a8247eda8d223687af2b8411`**, `maintenance-20261018.js` blob **`f8e8e469503d0abf53844aa85188b15b09a95238`**, APP_VERSION `ver20261018-2313` 모두 변경 없음.
- QA 실제 원본 함수 + 가짜 페이지 객체/가상 사용자/차단된 네트워크 모의상태로, **6개 독립 경계·265/265 scoped assertions PASS**. 일부 모의 구현은 주변 의존성 stub이며 완성 앱 브라우저·Supabase E2E가 아님.
- 운영 `main` commit **`6c784210e048426f18a486d5602652626d97574d`** 불변. 운영 직원 DB/근태·지문 파일, 실제 RPC/SQL/배포를 열람·실행·변경하지 않음.

## 깊이 8 · 이전 46과 구별되는 코드/비동기 실제 함수 검증
1. **공식 인계/무결성:** GitHub 46 완료 보고, `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `EXIT_CRITERIA.md` 직접 확인. 공식 46 완료/47 시작, 3차 결함 37, 코드 blob 및 qa/main HEAD 검증.
2. **근태 삭제 stale-authority race:** 실제 `deleteRecord`에 정상 본인/관리자 삭제, 비관리자 타직원, 조회전용·인사미확인, native confirm 취소 및 그 사이 세션 epoch 변경, 최신 근태 원본 변경/조회실패, 조회 도중 관리자 박탈/readonly/화면 hidden/세션 교체, 서버 오류·불명확 성공 형식·지연 RPC 완료 **17 cases / 48 assertions PASS**. 허용 호출만 `delete_attendance_personnel_v2`가 정확한 `p_expected` CAS snapshot과 함께 전송되는지 확인. 구형 UI에서 없는 원본을 전달하는 기타 비정상 진입은 서버 실계정 검증하지 않음.
3. **본인 PIN 변경의 지연 완료:** 실제 `changeOwnPin` 원본에 정상/강제 초기 PIN 변경 후 재복원, 불명확 RPC 결과, timeout·강제 PIN 재조회, SESSION_EXPIRED, token/epoch 소유권 교체, PIN 형식/재입력 불일치 **10 cases / 28 assertions PASS**. 이전 계정 지연 성공이 새 세션에 성공 메시지를 표시하지 않음.
4. **사진 picker 취소/change 이벤트 누락/BFCache 유사 복귀:** 실제 `scheduleFingerprintPickerReturnRecovery`, `finishFingerprintPickerWithoutSelectionEvent`, `clearFingerprintPickerContext`에 무파일 취소, 선택된 FileList에 change 이벤트 누락, 중복 change 수신, 문서 hidden/취소 뒤 오래된 picker·교체된 context, 다른 session token, catch-up 예약/상태 정리 **10 cases / 60 assertions PASS**. 브라우저 자체의 `pageshow.persisted`/Android camera 이벤트를 물리 시뮬레이션한 것은 아니며 타이머 함수 모의.
5. **비활성 계정 소유권:** 실제 `enforcePersonnelDisabledSession`→`handleDisabledAccountSession`에 로그인 유무×personnel 조회 상태×active/readonly/disabled×실제 소유권 일치·불일치 **36 cases / 72 assertions PASS**. 옛 직원의 늦은 계정 disabled 응답이 다른 로그인 소유자까지 로그아웃시키지 않음.
6. **RPC 늦은 성공/오류 소유권:** 실제 공통 `rpc` 내부의 request/response owner fence를 fake `fetch` 응답과 함께 실행. mutation/관리자 PIN·민감 read의 토큰 교체, epoch 교체, shared mismatch, 관리자 해제, 강제 PIN/readonly/세션 만료 서버 오류, network exception, stale failure **13 cases / 32 assertions PASS**. 과거 계정 HTTP 오류를 새 사용자 UI에서 처리하지 않음.
7. **사진 압축 중 상태 변동:** 실제 `handleFingerprintPhotoInput` 원본에 정상 가상 업로드 경로, 압축 도중 token·session epoch·page lifecycle 변경, background/readonly/선택 날짜 변경, personnel/fingerprint backend unreadiness, shared mismatch, Realtime 상태 재조회 실패, 미래일/미배치 거절 **13 cases / 25 assertions PASS**. 화면/권한 변경 뒤 fake `save_my_fingerprint_photo` 전송 0. **실제 사진/DB 전송 없음**.
8. **제품코드 정적 회귀:** HTML script **6개 구문 OK**, 분리 maintenance JS **구문 OK**, DOM id **488개 고유**, 4개 핵심 mutating endpoint(근태 삭제/본인 PIN/관리자 PIN/지문사진) `SESSION_GUARDED_MUTATION_RPCS` 포함, APP_VERSION 불변, QA와 main 분리 확인. 첫 번째 모의 검수에서 필요한 stub 누락 및 잘못된 테스트 기대값은 **테스트 하네스 문제로 수정 후 재실행**, 제품 결함으로 집계하지 않음.

## 3차 종료 기준
- 46→47은 **서로 다른 코드 위험 영역**에서 연속 2회 CODE-SCOPED CLEAN이라는 의미까지 확인. 46의 연차/교대·등록·CAS 일반 경계와 달리 47은 삭제·PIN 지연 결과·picker 회수·계정 정지·RPC 응답 경계.
- 그러나 2회 모두 source-based isolated/mock 결과이며, **실제 브라우저 두 탭, 물리 Android/iOS, 완성된 앱 UI, 별도 QA Supabase 인증/Realtime/RPC·DB 동시성 시험은 아직 실행하지 않았다.** `EXIT_CRITERIA.md`의 전제인 독립 QA 환경 없는 상태에서 실 E2E 전체 CLEAN이나 운영 배포를 승인하지 않는다.
- 특히 3차 5번의 휴일 변경↔휴근 이력 SQL 동시성 HIGH와 10~11번 정비 저장 비동기 HIGH는 실제 격리 서버/두 세션 연동 통과 증거가 없다. 신규 결함으로 중복 계산하지 말고 E2E 위험 잔여로 남긴다.
- **권고 다음 단계:** 같은 유형 mock 블록을 계속 늘리기보다 독립 QA Supabase(운영 직원 DB/인증정보와 완전 분리)와 격리 실 브라우저/가짜 직원 계정 구축 뒤 핵심 양방향 테스트 실행. 3-8-48은 환경·검증 게이트 확보 및 실제 E2E 실행 가능한 경우에만 의미 있게 진행. 환경이 없으면 `UNVERIFIED` 유지하고 최종 배포 전 승인받을 위험을 분리한다. 사용자 배포 지시 없이는 `main` 병합 금지.

기록 KST: 2026-10-20T20:13:21+09:00.
