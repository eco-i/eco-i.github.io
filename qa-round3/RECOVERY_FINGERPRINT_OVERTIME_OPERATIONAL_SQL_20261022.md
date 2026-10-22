# 근무모아 기존 기능 복구 우선 — 지문등록·초과근무 수정 직접검증 (2026-10-22 KST)

**공식 상태: 기능 운영 실사용 재현/복구 미완료, 격리된 *운영 SQL 자체* 테스트 초과근무 40/40 PASS·지문 37/37 PASS; QA 진단 9/9 PASS. 3-8-54는 미시작·BLOCKED, 전체 NOT CLEAN.**

## 이번에는 mock 함수 재작성 대신 실제 운영 SQL 복사·가상 서버에서 실행

- 운영: `eco-i/eco-i.github.io/main`, SQL SongdoFood Supabase. 운영에서 `pg_get_functiondef` 등 **함수 정의 메타데이터만 SELECT**, 실제 직원 기록/지문 바이트/토큰/초과근무 기록/세션 행 조회·수정 **0**.
- **초과근무** 비공개 `qa/OVERTIME_REAL_SQL_REPLAY_DO_NOT_DEPLOY.sql.txt`: 현재 운영 `list_overtime_entries`, `save_my_overtime_day_v2`, `save_my_overtime_entry_v2`, `save_my_overtime_day`, `save_my_overtime_entry` **5개 함수 정의의 읽기 전용 복사**. 원본은 `WORKMOA_DRAFT_ONLY_OVERTIME_LIVE_FUNCTIONS` 하드스톱, 가상 CI에서만 marker를 정확히 대체한 ephemeral REVIEW COPY 사용. fixture `qa/overtime_live_sql_fixture.sql`, test `qa/overtime_live_sql_http_check.py`, runner `qa/run_overtime_live_sql_lab.sh`.
- [비공개 초과근무 Run 39771123060](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771123060), Job `119798628966` **SUCCESS, 40/40 PASS** (`OVERTIME_EXACT_OPERATIONAL_SQL_POSTGREST_PG_SCOPED_PASS`). 실제 PostgreSQL17/PostgREST14.18 HTTP, 가짜 직원: 조출/야근 신규등록, 시간 수정, 완료체크, 슬롯 삭제, 같은 값 재저장, 오래된 snapshot 수정 거부, 두 HTTP 동시수정 직렬화(한쪽 성공/다른쪽 실패), 감사실패 전체 롤백, 만료/조회전용 거부, 재조회 일치.
- **지문** 비공개 `qa/FINGERPRINT_OPERATIONAL_SQL_DO_NOT_DEPLOY.sql.txt`: 현재 운영 `save_my_fingerprint_photo`, `list_my_fingerprint_records`, `get_my_fingerprint_photo`, `delete_my_fingerprint_photo`, `_fingerprint_assert_write_context` **5개 함수 정의 읽기 전용 복사**, 원본 `WORKMOA_DRAFT_ONLY_FINGERPRINT_OPERATIONAL_SNAPSHOT` 하드스톱. 가상 CI에만 복사 적용, 익명/직원 계정 가짜, 그림 바이트는 합성 PNG magic+바이트(실제 이미지 렌더와 동일하다고 주장하지 않음). fixture `qa/fingerprint_operational_fixture.sql`, test `qa/fingerprint_operational_http_check.py`, runner `qa/run_fingerprint_operational_lab.sh`.
- [비공개 지문 Run 39771691566](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39771691566), Job `119800536596` **SUCCESS, 37/37 PASS** (`FINGERPRINT_OPERATIONAL_SQL_POSTGREST_PG_SCOPED_PASS`). 실제 PostgreSQL17/PostgREST14.18 HTTP에서 사진 첫 등록→메타 재조회→바이트 회수→교체·퇴근추가→삭제·최종 빈 행 삭제, 동시 첫 업로드 충돌, 오래된 revision 거절, 미완료 PIN/조회전용/비활성/만료 세션 거절, 무효 base64 롤백.
- **두 결과 모두** 실제 Android/PWA 갤러리 picker·WebView BFCache, production Auth/인사테이블 데이터, 로딩경합/Realtime, 실제 사용자 저장성공까지 보장하지 않음. 서버와 사이트가 같은 함수 정의/인자·권한 사용 중이라도 화면의 freshness/동시요청 가드로 인해 동작이 막힐 수 있음. 사용자에게 '복구 완료' 주장 금지.

## QA-only 브라우저 실패진단 강화

- 운영 `main/index.html`에서 지문 메타데이터 읽기 `loadFingerprintRecords`는 실패를 잡아 `fingerprintBackendReady=false`와 동일한 포괄적인 서버 연결 메시지로 처리하여 원인 구분이 어려웠음.
- 오직 `qa-3-8/index.html`에 `fingerprintReadFailureText(error)` 및 current opened date에서만 분류 결과 표시. PGRST202/스키마 캐시, 지문 응답형식, 로그인/PIN, 시간초과·네트워크, 권한, 기타 일반 오류를 구분. **오류 원문, 응답본문, 로그인 토큰·사진 바이트 미표시**. 실제 쓰기 함수/인자, 관리자·세션 가드 변경 없음.
- `qa-round3/tests/fingerprint-read-diagnostics.test.cjs`, [QA Run 39772397452](https://github.com/eco-i/eco-i.github.io/actions/runs/39772397452) **9/9 PASS**. 첫 [39772317881](https://github.com/eco-i/eco-i.github.io/actions/runs/39772317881) 8/9은 테스트 기대 한국어 문구 불일치였음. 테스트 기대만 수정 후 전체 PASS.
- 이 QA 화면 패치는 **진단 가시성 개선**일 뿐 원인을 수정한 것이 아니며, 사용자 운영 `main`으로 병합·배포하지 않음. 운영 기능 복구 승인으로 오해 금지.

## 남은 문제·다음 행동

1. 지문: Android 갤러리/카메라 photo-picker 반환→pagehide/pageshow 및 `fingerprintPickerStillCurrent`, `fingerprintBackendReady`, `pageLifecycleFreshnessPending`, `loadFingerprintRecords` 전후 다시 조회, Realtime 타이밍을 **QA 브라우저에서 재현**. 검증 없이 반복 재시도나 blind flag override 금지.
2. 초과근무: 실제 `saveOvertimeDay` / 목록 `save_my_overtime_entry_v2` 주변 `personnelMutationReady`, `overtimeDetailDateWritable`, `overtimeBackendReady`, 최신일 snapshot 및 화면 재동기화가 저장을 막는지 브라우저+격리 API에서 확인. 지문·초과근무 함수가 존재하고 실제 원본 SQL이 가상 서버에서 통과했다는 사실과 **실운영 화면 성공은 다름**.
3. 누락 21종 RPC(휴근5·연차/장기재직2·인사7·복원7)는 여전히 **운영 미설치**. 사용자 사내일정 승인 복구 이후의 수치. 각각 위험도별 별도 승인 전 운영 DDL 변경 금지.
4. 3-8-54 미시작/보류, 공식 3차 신규제품결함 37종, 전체 NOT CLEAN. 운영 `eco-i/eco-i.github.io/main` HEAD SHA `6c784210e048426f18a486d5602652626d97574d` 기준 변경 없음. 실제 직원 DB 행 변경, 운영 RPC 변경, Supabase migration **이번 작업 0**.
