# 근무모아 3차·깊이8 — 3-8-18 공식 보고서

## 공식 판정
- **3-8-18 정의된 검수 범위 완료: 신규 확정 제품 결함 0종 (범위 한정 CLEAN).** 이는 전체 사이트 무결함이나 실제 단말 E2E CLEAN을 뜻하지 않음.
- **3차 누적 신규 결함 11종 유지** (2차 이력 540종 별도). 이번 블록에 QA 기능 수정/SQL 작성 없음.
- GitHub 검수 qa-3-8, 운영 main. QA 최신 index.html blob `778529b59b550ee1f3bf4e8e3b0ea27463427276` 유지; 운영 기준 main SHA `6c784210e048426f18a486d5602652626d97574d`, APP_VERSION `ver20261018-2313` 불변.
- **운영 DB 쓰기/직원 기록 변경 0건.** 이번 블록에서 실제 Supabase에 접근한 SQL은 `pg_proc`·`pg_trigger` 메타데이터 SELECT와 상수식 SELECT만. 실직원 기록·실감사행 SELECT도 미실행, 관리자 로그인/RPC 실행 미실행.

## 깊이 8단계 검수
1. **인계/브랜치**: GitHub CURRENT_STATE, START_HERE_NEW_CHAT, QA_3-8-17_REPORT를 qa-3-8에서 직접 읽어 17 완료/18 시작/11종 확인. QA index.html blob 일치, main...qa-3-8 behind=0 검증.
2. **실서버 RPC 함수 계약 메타데이터**: Supabase `SongdoFood` 프로젝트의 `pg_proc`에서 `public.list_recent_audit_page(p_token uuid,p_limit integer default 50,p_offset integer default 0)` 함수 정의를 읽기 전용 확인. 내부 `perform public._require_admin(p_token)` 이후 `order by l.created_at desc,l.id desc`, `limit greatest(1,least(coalesce(p_limit,50),100))`, `offset greatest(0,least(coalesce(p_offset,0),1000))` 확인. 따라서 QA가 요청하는 `p_limit=52`는 함수 정의상 허용(상한 100). SELECT 상수식에서도 52를 도출함. **관리자 토큰을 사용하는 실제 RPC 호출은 하지 않았으므로 E2E 성공으로 기록하지 않음.**
3. **서버 감사 유지 정책**: `audit_logs_keep_latest_1000` AFTER INSERT trigger 및 `_trim_audit_logs_to_1000`의 함수 정의를 카탈로그에서 읽기 전용 확인. 자동 정리는 `order by created_at desc,id desc offset 1000`의 오래된 행만 삭제. 프런트 1,000건 보관·52건 겹침 조회와 수치 계약 일치.
4. **QA 실제 코드 데이터 흐름/보호**: `loadAuditPage`, `openAudit`, `strictAuditRpcRows`, `updateAuditControls`를 GitHub QA HTML에서 직접 추출. 요청 시 이전 행 ID를 첫 행으로 겹쳐 확인하며 `AUDIT_PAGE_SIZE=50`, 회복용 스냅샷 최대 2회, 행 갱신 전 세션 epoch/관리자 모드 확인, 진행 중 새로고침 잠금 유지. 실제 DB 변형 없이 검토.
5. **현행 서버의 정상 삽입/오래된 기록 정리 시뮬레이션**: 121/300/1000건 데이터, 새 행 삽입/보관 상한에서 최오래된 행 절단/다건 INSERT, 발생 시점, 두 조회 단계 등 **162/162 동적 검사 PASS**. 성공 응답은 현재 모의 서버 상위 표시 범위와 정확히 일치, 중복 없음. 실패·보류된 응답은 실패로 처리하며 오인 통과 없음.
6. **권한·세션·Realtime 지연 응답**: 실제 감사 함수 추출 V8 mock Promise로 **16/16 PASS**. 로그인 교체·관리자 권한 상실 중 응답 무효화, 닫기/재열기 과거 결과 폐기, 팝업 더보기 offset 49+52, 실패 후 행 보존, deferred Realtime catch-up 예약, 로딩 중 버튼 비활성화, 실패 시 해제 확인. 이 검증은 실 Supabase 다중 세션이 아닌 격리 실행임.
7. **모바일/코드 경계 정적 검증**: HTML의 486개 리터럴 DOM ID 중 중복 0, inline 실행 스크립트 2개 구문 컴파일, 접근성 aria-hidden/Tab/Escape 처리, audit 버튼 IDs, width=device-width 및 viewport-fit=cover, 90dvh modal 상한, 사용자문구 escapeHtml, 로딩 상태 잠금, 50/1,000 상수, 권한/계정 검사 등 **30/30 PASS**. 실제 물리 기기 픽셀 렌더 또는 전체 앱 Chromium 테스트는 아님.
8. **종합 판정/보호**: 정상 서버 모델 실코드 mock 162 + 지연/세션 16 + 정적 30 = **208/208 PASS**, 이번 블록 신규 확정 제품 결함 0, 누적 11 유지. 운영 main·직원 DB·SQL 미변경. 아래 탐색상 한계는 CLEAN과 구분하며 다음 블록에서도 유의.

## 탐색상 특수 경합과 해석
- 추가 탐색 fuzzer 300건 가운데 290건 일치, **10건에서** ‘가장 앞쪽 기록 하나를 지우는 동시에 새 기록 하나를 추가하여 전체 건수·경계 위치가 유지되는’ 인위적 조합에서 이전 머리 부분이 그대로 표시되는 결과가 나옴. 이는 ID 하나만 겹쳐 확인하는 offset 경계 감지가 동일 길이 치환을 완전히 식별할 수 없다는 알고리즘적 한계다.
- 다만 현재 실서버의 공개된 정상 자동 정리 트리거는 **오래된 1,000건 초과 행만 제거**하며, 검수한 앱에는 최신 머리 기록 수동 삭제 작업을 확인하지 못함. 따라서 **현재 정상 제품 흐름에서 재현된 신규 결함으로 확정하지 않음**. API의 일관된 DB 트랜잭션 스냅샷을 보장한다는 주장도 하지 않음. 미래에 감사로그 개별 삭제/재분류 기능을 도입하면 keyset pagination 또는 snapshot cursor 검토 필요.

## 미검증 / 다음 작업
- 관리자 인증 상태에서 실제 `list_recent_audit_page(p_limit=52)` 호출, 실제 두 관리자/직원 독립 세션 경합, 연결 지연 중 Realtime, Android/iOS 실기기, 실제 전체 사이트 Chromium 시각·포커스 E2E **미검증**.
- 실제 운영 DB 실직원/감사행 읽기조차 이번에 하지 않았음. catalog-only 52 수용 근거와 실제 성공 RPC는 명확히 구분.
- **다음 3-8-19:** 읽기 전용 조건에서 실제 RPC 계약/응답을 적절한 QA용 계정으로 확인할 방법 검토, 감사 팝업의 다중 창 관리권한 전환·Realtime catch-up 최신성, 모바일 전체 렌더 가능한 범위; 필요하면 균형 삭제·추가 위험성 재평가. main 배포/실직원 DB 쓰기 금지.
