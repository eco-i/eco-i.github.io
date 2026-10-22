# 사용자 장애 우선 복구 · 사내일정 v4 운영 RPC 복원 (2026-10-22)

**상태: 운영 함수 2종 설치·카탈로그/권한/기존 기록 보존 확인. 실제 사용자 브라우저 저장 재확인 필요. 종합 NOT CLEAN.**

## 장애 원인
- 사용자 실제 증상: 사내일정 신규등록 시 '사내일정 동시수정 보호 SQL이 아직 적용되지 않았거나 서버 스키마 갱신 중' 오류.
- 운영 사이트 `main/index.html`은 저장·삭제 `save_company_event_v4`/`delete_company_event_v4` 호출, 운영 SongdoFood 실제 서버에는 구 `v3`만 설치. **사이트/서버 계약 불일치가 확인된 직접 원인.**
- 비공개 선행 v4 합성후보 SQL은 실제 운영 `company_events.event_date` 및 `audit_logs.action_type` 구조와 달랐으므로 **기존 가상 후보를 그대로 설치하지 않음**.

## 검증 및 승인 적용
- 운영 실제 컬럼/기존 v3 관리자검증·기간검증·감사 이력을 읽기 전용으로 확인하고 신규 운영형 비공개 후보 구성. 원본 SQL 설치차단 `WORKMOA_DRAFT_ONLY...` 유지, 오직 일회용 Postgres17.11+PostgREST14.18에만 임시 REVIEW COPY 컴파일.
- [비공개 GitHub Actions Run 39761409847](https://github.com/ahnbest23-hash/workmoa-backend-private/actions/runs/39761409847), Job `119766219605`, **48/48 PASS**. 실제 HTTP 등록/수정/삭제·STALE 409·ABA·가짜 A/B 관리자 동시수정 200+409·감사 롤백·권한/RLS 거절(가상직원) 확인. 이전 첫 시도는 QA fixture FOR SHARE 권한 문제로 실패, 수정 후 통과.
- 사용자 명시 승인 이후 **SongdoFood** 운영 마이그레이션 `20261022101444_workmoa_company_events_v4_cas_restore_20261022` SUCCESS. `save_company_event_v4`, `delete_company_event_v4` 2종 설치, postgres 소유, 고정 search_path, SECURITY DEFINER, 기존 내부 관리자 권한 검증과 timestamp CAS·감사 로직.
- 이전 v3 두 함수는 정의 변경 없이 anon/authenticated 브라우저 EXECUTE 회수, 새로운 v4는 anon/authenticated 실행 허용. 구형 탭은 새로고침 필요. PostgREST schema reload NOTIFY. 별도 테이블 권한/기존 행 직접 수정 없음.
- 운영에서 설치 전후 **사내일정 5건 동일**, 마지막 updated_at 동일, 감사기록 **127건 동일**. 직원/지문/메모/일정 내용 직접 조회·변경 0. 운영 `main` index/code는 변경하지 않음.
- 원래 누락 RPC 역사적 26종 중 기존 승인 메모 3종 + 이번 사내일정 2종 = **5종 운영 설치**, **21종 운영 미설치**. 과거 `live-rpc-contract-snapshot.json`의 당시 26/31 호출 지표는 역사적 증거로 그대로 유지.
- 더 상세한 검증/운영 승인 범위는 비공개 `ahnbest23-hash/workmoa-backend-private/COMPANY_EVENTS_V4_AUTHORIZED_PRODUCTION_RESTORE_20261022.md`.

## 실제 사용자 확인/잔여 장애
- 실제 사용자 관리자 세션에서 달력 2026-10-30 사내일정 등록이 성공하는지는 **아직 사용자 실사용 재확인 전**. 실패 중 작성한 내용을 복사·보호 후 저장 다시 눌러보고, 실패하면 새로고침·재로그인 필요할 수 있음.
- 지문사진·초과근무 v2 함수는 운영 서버에 존재하지만 실제 업로드·수정 성공은 별도 검증되지 않음. 기존 사용자 장애 불편의 원인을 같은 RPC 누락으로 단정하거나 CLEAN 선언 금지.
- **공식 상태: 3-8-53 완료 / 3-8-54 미시작·BLOCKED / 3차 신규 결함 37종 / 전체 NOT CLEAN**. 검수 진도보다 사용자 사용기능 복구 우선.
