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
