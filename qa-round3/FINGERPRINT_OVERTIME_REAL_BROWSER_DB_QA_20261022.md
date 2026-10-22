# 근무모아 기존 기능 복구 · 지문 사진 선택 + 초과근무 수정 실제 QA HTML 브라우저 연동검수

**2026-10-22 KST · 범위: 실제 Chromium QA 화면 → QA용 제한 HTTP 브리지 → 실제 폐기형 PostgreSQL · 운영 미변경 · NOT CLEAN**

## 검수 증거
- [완료된 성공 Run 39774368252](https://github.com/eco-i/eco-i.github.io/actions/runs/39774368252), Job `119809487322`, **SUCCESS / 18 assertions PASS / 0 FAIL**. `FINGERPRINT_OVERTIME_BROWSER_TO_SYNTHETIC_POSTGRES_SCOPED_PASS`.
- `qa-round3/e2e/ci/browser-fingerprint-overtime-success.py`: 원본 QA `index.html`의 **진짜 로그인 UI·날짜상세·사진 등록 버튼·네이티브 API filechooser·canvas 압축·초과근무 +10분 버튼 및 저장 버튼** 클릭.
- `qa-round3/e2e/ci/fingerprint-overtime-browser-fixture.sql`: 폐기형 PostgreSQL16에 오직 가짜 `qa_browser_fingerprint`, `qa_browser_overtime` 두 테이블과 제한 CAS 저장 함수. QA 출처 `browser-attendance-form.py`의 가짜 로그인·인사 배치/세션/조회 API 제공. 실제 기업/근무 직원 데이터·토큰·이미지/실 DB 접근 0.
- 지문: 2026-10-21 가상 과거 날짜, 현재 직원의 인사상태·지문 metadata ready 확인 → **실제 버튼** 클릭 → 파일 chooser 선택 → 브라우저에서 합성 PNG 이미지 디코드/캔버스 JPEG 변환 → 1회 fake HTTP → PostgreSQL JPEG bytea 저장 → 메타데이터 재조회 → 화면 `등록됨`, `fingerprintBackendReady===true` 확인.
- 초과근무: 2027-05-13 가상 미래 날짜, 날짜상세 +10분 실제 버튼 → Save 클릭 → fake HTTP→PostgreSQL 저장 10분, 다음 +10분→Save 클릭→20분 수정 커밋, PostgREST 형식 응답을 QA용 HTTP 브리지에서 재조회하여 실제 화면 상태도 확인. 각 의도한 변경 1회 전송, 페이지 JS exceptions 없음, 외부 Supabase 접속 차단.
- 첫 브라우저 실행 Run 39773808812의 실패는 **빈 지문 섹션이 UI에서 의도적으로 접힌 상태였는데 테스트가 미리 펼치지 않은 문제**. 두 번째 Run 39774064430 실패는 **Playwright Python 파일 picker의 `mimeType` 입력 키를 `mime_type`으로 잘못 넣은 테스트 문제**. 실제 화면/SQL 결함으로 집계하지 않음. 두 문제 수정 후 39774368252 18/18 통과.

## 실사용 장애 해결 판정 불가
- 본 검증은 **HTTP 모양만 재현한 Python 브리지 + 자체 가상 SQL**. 네이티브 Android WebView/OS 실제 picker, 운영 Supabase SQL/실 인사 배치/세션, 단말 복귀·Realtime 동시경합, 실제 직원 기록을 시험하지 않음. 따라서 '지문 등록과 초과근무 수정 운영 장애 복구 완료'로 선언하면 안 됨.
- 별도 private 실제 운영 함수 복사 SQL(서버만) 합성 PostgreSQL17/PostgREST14.18 결과: [초과근무 40/40](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771123060), [지문 37/37](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771691566). 이번 실제 UI 18/18과 *동일한 서버를 관통한 단일 E2E가 아니므로* 합산하여 full E2E CLEAN이라고 하지 않음.
- 모바일 복귀 이벤트 `pagehide/pageshow`/BFCache **모의** 사진 교체 시험은 [추가 Run 39774707035](https://github.com/eco-i/eco-i.github.io/actions/runs/39774707035)로 별도 실행. 최종 검증 결과 확인 전 **PASS 기록 금지**; 실제 Android OS picker의 동등성은 통과하더라도 입증 불가.
- 운영 `main`, 운영 DB, 사용자의 기존 지문·초과근무 기록 및 서버 함수 **이번 검수 변경 0**. QA의 지문 읽기 오류 안전 분류는 이전 `qa-3-8` 코드에만 존재, 운영 미배포.

## 공식 상태
- 사용자 장애 복구 우선. **3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 누적 신규 제품결함 37종 / NOT CLEAN**.
- 운영 최신 설치되지 않은 직접 호출 RPC **21종** 여전히 존재. 직원 실제 기록/백업·복원 SQL을 임의로 설치하면 안 됨.
- 다음 실증 기준: Android 실제 픽커 재현 또는 신뢰할 수 있는 모바일 브라우저 생명주기 검증, 전/후 `fingerprintBackendReady`·session·month load/Realtime 조화, 초과근무 사용자 실패 시 정확한 오류/해당 기록 정보 확보. 실제 운영 write test는 사용자 감독/별도 승인 후 허용해야 하며 기존 행을 변경하지 않는 가상 계정이 우선.

## 추가 QA 2026-10-22 21시 전후 — Android-like picker 이벤트 및 **월별 목록 수정 버튼**
- [Run 39774707035](https://github.com/eco-i/eco-i.github.io/actions/runs/39774707035) **SUCCESS, 브라우저 20/20 PASS**, 기존 18개에 실제 파일 chooser가 열린 상태에서 synthetic `pagehide/pageshow(persisted:true)` 이벤트를 보내 기존 지문 사진 교체의 expected revision(CAS), DB bytea 재저장·메타 재조회·단일 write 성공을 추가. Android 실제 OS picker는 아님.
- 정상 초과근무 상세 수정 10→20 외에도 실제 사용자가 누르는 월간 목록의 **수정** 버튼(메인 `#overtimeSummaryMain`→가상 목록 `#overtimeListBody [data-overtime-list-edit]`→날짜상세)을 통해 20→30으로 고쳐 저장하는 시나리오를 도입.
- [Run 39781365923](https://github.com/eco-i/eco-i.github.io/actions/runs/39781365923) FAIL: 목록 수정에서 상세 열기·30분 초안까지 완료, 첫 Playwright `expect_response`는 15초 내 지정 응답 미관측. **원인 미확정, 지속 제품 결함으로 단정 금지**.
- Playwright 응답 리스너 의존 대신 실제 protected write 건수·DB 값을 검사하도록 진단을 보강한 [Run 39781727235](https://github.com/eco-i/eco-i.github.io/actions/runs/39781727235) **SUCCESS, 브라우저 27/27 PASS**. 기존 20개 + 월간 목록 수정 버튼 표시, 정확한 편집 날짜/기존 20분 확인, 초안 30분, `save_my_overtime_day_v2`로 수정 1회 전송, PostgreSQL 30분 보존·동기화 확인. 이전 timeout의 재현성이 확인되지 않았으므로 제품 결함 38종으로 집계 금지. 단발 성공이 영속 신뢰성을 증명하지 않음.
- 테스트 안정성: `workmoa-qa-fingerprint-overtime-browser.yml`을 동일한 full Chromium+가짜 PostgreSQL 시나리오 **연속 3회 실행**, 매회 두 QA synthetic 테이블만 `TRUNCATE ... RESTART IDENTITY`하고 27개 assertion 실행하도록 변경. [Run 39781994803](https://github.com/eco-i/eco-i.github.io/actions/runs/39781994803) 실행 확인. **최종 결과 확인 전 81/81 PASS 주장 금지**.
- 운영 `main`과 QA `qa-3-8`의 저장 코드 함수 `handleFingerprintPhotoInput`, `selectFingerprintPhoto`, `saveOvertimeDay`, `fetchCurrentOvertimeDay`, `loadOvertimeList`, `fingerprintPickerStillCurrent` 등 일부 핵심 함수 본문이 동일함을 소스 직접 대조 확인. QA에는 운영에 없는 `fingerprintReadFailureText` 안전진단이 추가됨.
- 주의: **이 모든 브라우저 테스트는 합성 로그인·합성 SQL·Python HTTP 브리지**이고 실제 운영 서버를 브라우저에서 호출하지 않음. 이전 **운영 SQL 원본만 가상 PostgREST에서 성공 40/40/37/37**한 결과와도 독립임. 운영 기능 '복구' 또는 전체 3차 CLEAN 아님. 3-8-54 계속 BLOCKED. 운영 직원 기록/DB/배포 수정 0.
