# 근무모아 3차·깊이8 — 3-8-42 공식 검수 보고서

## 공식 판정
- **3-8-42 범위 완료: MEDIUM 결함 1종(3-8-42-001) 원본 함수 mock 재현·QA 수정. CLEAN 아님.**
- 3차 누적 신규 결함 **34종** (41 완료 33 + 1). 2차 별도 540종.
- QA 코드 `index.html` blob: 기존 `24aac098a0a178b28c6be3c97d368286144b5531` → **`6c9727dcb3f39d1c2f3063fafbdbe6838cfb345b`**; 코드 commit **`2bcdb23791dd67523b2dbce51284c7acbc5fa523`**. 앱 버전 `ver20261018-2313` 유지.
- 최종 커밋된 소스 격리/정적 **557/557 assertions PASS**, 실제 서버/물리 브라우저 종단간 테스트 결과로 확대해석하지 않음.

## 깊이 8 검수 내용
1. GitHub `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-41_REPORT.md` 직접 조회: 공식 41 완료, 다음 42, 3차 33종, QA baseline blob 대조.
2. 41에서 도입한 `staffAttendance_updateLocalLoginPending_v1:<token>`을 정상 완료 시 제거하는 경로, `storedSessionTombstoned` 초기 bootstrap(리터럴 키), `storeLoginSession(...,false)` handoff 복원을 검토. guard는 TTL 없이 보수적으로 유지되며 재로그인 정상 완료만 해제하는 현재 정책 명시.
3. **수정 전 실제 함수 재현:** pending guard는 남아 있으나 키 선택적 `getItem` 예외가 `storageGet`에서 빈 값으로 변환. 동일 `local:7`이 `storedSessionTombstoned=false`, `storedSessionToken` 복원, `storeLoginSession(...,false)=true`가 되는 경우를 모바일·PC remembered·PC temporary 3범위에서 재현. 실 브라우저 자체 결함이나 실제 직원 서버 인증 우회는 입증하지 않음.
4. **국소 QA 수정:** cold boot 및 현재 세션 체크에서 pending guard 직접 읽기 예외는 차단(true), handoff 읽기 예외는 복원 거부(false). 정상 local login fresh path와 서버 UUID 경로는 그대로 유지.
5. **최종 실제 커밋 소스 로그인 회귀 480/480 PASS:** 3 저장 범위×기존 guard 2×logout 증거 4×오류/정상 4×관찰값 5. 정상 재로그인은 guard를 회수하고, epoch 실패/검증 readback 실패/guard removal 실패 시 차단 유지 확인.
6. **pending guard 판독 54/54 + JS/DOM 7/7 PASS:** 3 범위×6 상태(없음, 있음, 매우 오래됨, guard 키 선택적 read 예외, 전체 shared read 예외, guard 쓰기 거절)×3 관찰값(차단 함수/boot/handoff). 정적 검사는 inline script 2개 파싱, script 개수, HTML ID 488개·중복 없음, 앱버전 보존, 세 login guard 경로 보존.
7. **Realtime 실제 소스 지연 Promise mock 16/16 PASS:** 신호 추가 여부×서버 refresh 성공/실패×옛/현 세션 소유권×기존 catchup flag. 이전 세션의 늦은 완료가 최신 상태를 지우지 않는 조건 재확인. 물리 Realtime 채널/네트워크 통합 검증 아님.
8. 제품 변경은 `qa-3-8/index.html`에만 적용, 별도 이슈/본 보고서/CURRENT_STATE/인계 갱신. `main` HEAD와 운영 DB 무변경을 GitHub로 확인; 실 직원/근태/지문 데이터 접근 및 실 RPC/SQL 0.

## 남은 위험 및 3-8-43 범위
- 읽기 자체 거부를 fail-closed 처리했으므로 브라우저 저장소 장애의 실제 UX·복구 안내, guard가 오래 남는 상황, local epoch 키 정리/시계 보정은 모의시험만으로 완전 확정할 수 없음.
- 이전 버전 탭이 새 pending guard 규칙을 무시하고 같은 `local:` 토큰으로 저장/복원하는 실제 혼합버전 레이스는 미검증. 협력하지 않는 이전 코드에 대해 최신 버전만으로 완전한 원자성 보장은 불가.
- Chrome/Android/iOS PWA 두 탭/네이티브 picker/첫 PIN, QA-only 테스트 계정 Supabase Realtime 흐름/실제 Web Locks를 **실행했다고 주장하지 않음**.
- 다음 **3-8-43**은 정상 로그인/로그아웃 복구와 guard 만료·초기 화면 전환의 사용자 가용성, Realtime 채널 구독·재연결/세션 교체, 남은 미검증의 종료 기준에 집중. 의미 없는 세부 모의 블록 증식 방지. 실 직원 DB 및 `main` 불변 유지.

작성 시각(KST): 2026-10-20 18:03:01
