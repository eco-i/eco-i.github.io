# 근무모아 3차·깊이8 — 3-8-34 공식 검수 보고서

## 결과
- **3-8-34 범위 한정 완료. 신규 제품 결함 1종 MEDIUM (3-8-34-001) 재현·QA 수정·격리 검사 PASS. CLEAN 아님.**
- 3차 신규 결함 **26종** (= 33 완료 25 + 이번 1). 2차 이력 540종은 별도.
- **131/131 유효 격리·정적 검사 통과:** 이관 실패/다중 token/33 인계 보호 실제 함수 78 + 복원 경로 12 + Realtime reconnect 16 + 최종 JS/HTML·보안가드 정적 25. 수정 전 재현 실패 및 잘못 지목한 탐색용 함수명은 PASS로 계산하지 않음.
- 기준선: 33 완료 HTML blob `d55a32fcbcad3110db76c8725b4b088fca7362d1`, 수정 HTML blob `c754f9ff2be9e82768b550eb7ea3852f9b82d687`, 코드 커밋 `47b6bb57dc042e5eed254bf02de5c62852683939`. 앱 버전 `ver20261018-2313` 불변. `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 확인.

## 깊이 8
1. **공식 상태·보호:** QA `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, 33 공식 보고서/독립 재검증을 직접 읽고 33→34, 누적 25, QA index 기존 blob 일치 확인. 모든 테스트 메모리 mock만 사용, 실제 계정/DB 불접촉.
2. **로그아웃 tombstone 실패 원인 분석:** 레거시 aggregate의 유효 OLD logout을 새 token별 키로 옮길 때 `storageSet` 실패 결과를 무시하고 원본을 지운 뒤 `updateHandoffTokenWasLoggedOut(OLD)`이 거짓 판정을 하는 원본 JS 격리 재현.
3. **QA 수정:** 각 유효 표식의 이전 성공 여부 `migrated` 누적. 하나라도 새 키 쓰기 실패면 원본 보존. 새 key가 없을 때 같은 token의 유효한 레거시 logout 증거를 재조회. 본 수정 외 근태 로직·전 직원 저장소·SQL·버전은 손대지 않음.
4. **실제 함수 mock 78/78:** 원본 오류 재현 확인 후 수정본에 정상/실패/부분 실패/다시 성공하는 이관, 잘못된 JSON, 과거·미래 타임스탬프, 타 토큰 차단 방지, 본인/다른 사람 탭·레거시 handoff, 56개 가변 다중 token quota 경계 검증. 이번 78건은 커밋 직전 동일 변경본 실행; 커밋 후 SHA 대조함.
5. **복원 actual-function 12/12:** 수정 완료 HTML의 `restoreUpdateSessionHandoff` 실제 함수를 가짜 session/localStorage에 넣어 quota 시 OLD logout이 PC 임시 handoff 복원을 차단하는지, 정상 복원·다른 사용자·만료·버전 상이·malformed·admin 보호를 점검. 독립 브라우저 E2E는 아님.
6. **Realtime reconnect actual-function 16/16:** 커밋 코드에서 `scheduleRealtimeReconnect` 함수 추출. 정상 제거/재연결, 토큰·epoch·직원·PIN·오프라인 변경, 이미 새 채널 소유, 예약 교체, 이전 채널 remove 중 전환 등의 타이머·Promise fake 실행. 서버 Supabase 채널 연결을 한 것은 아님.
7. **정적/기존 패치 25/25:** 커밋 HTML의 인라인 JS 2개 파싱, 488 literal DOM id 중복 0, 버전/운영 SHA 유지. 3-8-30~33 로그인/관리자 unlock/Web Locks 재시도/초기 PIN/Realtime/중첩 모달/대기중 저장/감사·날짜선택기 함수 가드 존재 검증. 정적 존재 검사는 해당 모든 기능의 실행 검증을 의미하지 않음.
8. **QA GitHub 결과/후속:** 신규 결함 상세 `qa-round3/issues/3-8-34-001_LEGACY_LOGOUT_TOMBSTONE_MIGRATION_LOSS.md`, 본 보고서, 상태/인계 기록 업데이트. 운영 `main` 수정·배포 0, 직원 DB·RPC·SQL 접근/변경 0. 실제 통합 테스트 없이 전체 서비스 CLEAN 주장하지 않음.

## 미검증
- 실제 Chrome/Android/iOS 저장용량 부족/탭 간 quota 변화, live Web Locks + 다중 로그인/로그아웃, 서버 계정/Realtime 권한하향 및 관리자 PIN 연속 변경.
- 다른 구버전 탭이 legacy aggregate를 이관 중 다시 쓰는 물리 동시 경합, 같은 token 재로그인의 storage 실패 시 UI 복원·권한 소유권. 저장소 read 자체가 불가능하거나 기록이 처음부터 영속 저장되지 않은 환경.
- 이번 격리·정적 PASS는 실제 직원 DB의 정상 운전을 인증하지 않는다.

**다음 블록 3-8-35:** same-token fresh login / 구버전 aggregate writer 재진입, 여러 탭 자동업데이트 handoff의 세대 소유권과 완전 저장소 장애 fallback, 새 Realtime 세션 구독 완료 시 catch-up/refresh 타이밍을 QA 전용 추가 검증. 운영본 및 직원 DB 계속 보호.
