# ★★★근무모아 3차 종합검수 3-8-7 — **진행 중** 긴급 인계

> 채팅방 최대길이 안내로 작업 중단. **3-8-7 완료 아님 / CLEAN 아님.** 최종 공식 완료는 **3-8-6**, 재개 블록 **3-8-7**.

## 기준
- 운영 main HEAD 검수시 `6c784210e048426f18a486d5602652626d97574d`; 앱 `ver20261018-2313`. 재개시 재확인.
- QA branch `qa-3-8`; 지난 6개 보고서 `qa-round3/QA_3-8-{1..6}_REPORT.md`.
- 3차 확정 제품 결함 누적 **3종**(3-8-2-001, 3-8-5-001, 3-8-5-002), 지난 3-8-6에서 신규 0.
- 운영 배포/운영 실DB 변경 **수행하지 않음**; 현재 블록은 전부 GitHub/DB 읽기만 수행.

## 3-8-7 현재까지 읽기 조사 (검수 PASS 아님)
- GitHub `site-update-history.js`, `site-update-history.css`, `index.html`, `db/migrations/20261018_shared_update_history.sql`, 후속 release history SQL, 구 QA 보고서 확인.
- Supabase `site_update_history`: **총 22행, 현재 공개 20행, soft-delete 2행** (`ver20261017-2320`, `ver20261017-2311`; 둘 다 revision 2). 다른 행 revision 1.
- 실제 서버 RPC 3개 조회: `list_site_update_history_v1`(유효 로그인 세션 요구, `is_deleted=false`만 공개), `admin_edit_site_update_history_v1`, `admin_delete_site_update_history_v1`(서버 `_require_admin`, revision 낙관적 일치 확인, 감사로그, soft delete).
- 최신·초기 migration의 업데이트 이력 seed는 `ON CONFLICT (version) DO NOTHING`: 기존 행이나 tombstone 복원/덮어쓰기 방지의 코드 설계 확인. **중복 seed를 실제 트랜잭션에서 재실행하는 검증은 아직 미수행**.
- 웹 UI 공유 모듈: 일반 사용자에게 목록만, 관리자에게 수정·삭제 버튼; 저장 시 revision/token; HTML escape; `requestSeq`와 session token 경계; 페이지 실패 시 오래된 목록을 숨기고 재시도.
- HTML에 레거시 `UPDATE_HISTORY` 배열/`renderUpdateHistory`가 여전히 있음. 현재 `openUpdateHistory`는 외부 `window.siteUpdateHistory.open`을 우선하며 미존재하면 연결 오류만 표시함. 레거시 renderer가 호출되는지, 배포된 외부 스크립트 실패 시 삭제 이력이 다시 노출될 경로가 있는지는 **향후 확인 필요**.
- `site-update-history.css`는 상대적 단위와 flex-wrap, 포커스 스타일 포함. **실제 모바일/PC 화면 렌더링 미검증**.
- DB `site_update_history`의 PK(version), items 1~20, revision >=1 제약 확인. row-level 트리거는 0개. DB 실테스트는 아직 수행하지 않음.

## 남은 필수 검사 — 3-8-7 재개
1. 실제 서버 `BEGIN ... ROLLBACK`: 유효 임시 관리자 세션으로 목록 20행→미삭제 이력 수정 성공→stale revision 충돌→soft delete→목록에서 제외→중복 seed `ON CONFLICT DO NOTHING` 후 tombstone 유지→기존 내용 수정여부/감사로그/전체 rollback 확인.
2. 무효 세션 및 일반직원 권한 (실제 비관리자 세션이 없으면 미검증 명시). 직접 권한/RLS 확인.
3. 브라우저 JS 실제 모듈을 격리 실행하여 관리자/직원 렌더 차이, mutation guard, HTML escape/XSS, 실패 메시지, session 변경, 중복 저장 방지, 정상 취소·삭제 동작, null/invalid RPC 응답.
4. `index.html`의 레거시 이력 배열/렌더가 절대 호출되지 않으며 삭제기록을 부활시키지 않는지 정적/실행 확인.
5. PC/모바일 width 관련 CSS 정적 검사, 실제 기기/렌더링은 별도 검수.
6. 발견된 결함은 QA 브랜치에서만 수정·검증·보고 후 상태 갱신. **종료 확인 전 CURRENT_STATE.last_completed_block=3-8-6 유지**.
7. 완료 시 보고서 `QA_3-8-7_REPORT.md`, 그 뒤에야 `CURRENT_STATE.json`을 3-8-7/다음 3-8-8로 옮길 것.

## 연결 안정성
- 사용자 최대 스트레스는 응답없음·연결끊김·채팅방 조기 포화. 짧은 단위/20초 내 의미 있는 상황보고, 툴 출력 간결, 영구 결과 GitHub 체크포인트 저장. ZIP 요청하지 말 것.
