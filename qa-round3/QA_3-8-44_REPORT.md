# 근무모아 3차·깊이8 — 3-8-44 공식 검수 보고서

## 판정
- **3-8-44 범위 완료 / 신규 MEDIUM 제품 결함 1종(3-8-44-001) 재현 및 QA 수정. CLEAN 아님.**
- **3차 누적 신규 결함 36종**(3-8-43의 35종 + 1). 2차 540종은 독립 이력.
- 최종 `qa-3-8/index.html` blob **`ab638a84e6c211a3845889c9ab9b69a1f2b4f1ea`**. QA 제품코드 최종 수정 commit **`ba5a242ee66ac8aeacf7c5f7b255f8ac7e81989e`**. 이전 43 완료 blob `44639c7e2f31f7037b4a10999c580348c083fd1e`; 중간 즉시 처리 프로토타입 commit `e20368da5d149a55a721324bfe12af8df9ad37ea`는 최종본 아님.
- **실제 최종 커밋 소스 격리·정적 1,473/1,473 assertions PASS.** 실제 Chrome·Web Locks·Android/iOS·Supabase E2E는 0건이며 이를 통합 검증이라 표시하지 않음.
- APP_VERSION `ver20261018-2313` 불변. SQL 수정 없음. 운영 main 및 실제 직원 DB/근태·지문/실계정 RPC/배포 모두 접근·변경 없음.

## 깊이 8 검수 추적
1. GitHub `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, 43 보고서, `EXIT_CRITERIA.md`를 직접 읽어 마지막 완료 43/다음 44/누적 35종과 QA 코드 blob 검증.
2. **중요 불변식:** local pending guard가 남으면 초기 세션 복원/세션 검사에서 동일 token을 거부. 그런데 열린 탭의 storage event handler는 이 키를 무시하여 화면을 늦게 정리할 수 있다는 불일치 발견. 원본 실제 핸들러 함수와 모의 storage event 실행으로 유효 guard 존재 시 logout 호출이 0임을 재현.
3. **수정 대상:** guard 키가 현재 세션과 일치하는 local token에만 해당 이벤트 처리. 기존 per-token logout, shared suppression, shared session 변경 이벤트는 변경하지 않음. 성공 로그인 중 guard는 매우 잠깐 생겼다 사라지므로, 즉시 logout 방식의 오탐/경합 위험을 검토해 80ms 지연 재검증으로 보정.
4. **최종 코드 구현:** guard storage 이벤트 수신 → 현재 session token/epoch 캡처 → 80ms timer → epoch/토큰 소유권 유지 확인 → 실제 현재 저장소 상태 기반 `storedSessionTombstoned(current)` 재확인 → 남아 있으면 deferred admin draft proof cleanup 및 local `logout(false)`. guard가 사라졌거나 신규 세션 epoch/토큰으로 바뀌면 아무것도 하지 않음.
5. **최종 코드 이벤트 1,152/1,152 PASS:** mobile 2 × PC tab-scoped 2 × current token 일치 2 × guard 상태(absent/present/read error) 3 × token 변경 2 × epoch 변경 2 × event newValue(set/remove) 2 = **192 scenarios**, 각각 timer 예약/즉시 logout 부재/80ms 설정/최종 logout 횟수/server-call flag/권한 증거 cleanup의 6 assertions. 동기 이벤트가 실제 80ms 환경에서 전달됨을 보인 것이 아니라 함수 timer 모델.
6. **기존 storage-event 회귀 102/102 PASS + guard 저장소 정상 재인증 180/180 PASS:** suppression·exact token logout·unrelated events × 모바일/PC 임시/다른 토큰 및 다른 저장소 32×3+6; 모바일/PC remembered/PC temporary×기존 guard 유무×3 정상/epoch write 실패/guard removal 실패×legacy logout 존재 유무×5 관찰값=180. 차단된 token의 update handoff 및 cold restore 안전 규칙 재확인.
7. **Realtime 채널 async reconnect 32/32 PASS + JS/DOM/버전 정적 7/7 PASS:** `scheduleRealtimeReconnect` 소유권/지연 `removeChannel`/새 channel 교체/오프라인 조합; 2 inline JS 문법, script 개수, 488 ID 개수/고유성, APP_VERSION 및 세 login guard 보존. 기존/신규 코드를 함께 확인.
8. 최종 QA 제품코드 commit, 이슈, 보고서, `CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md` 갱신 및 양 브랜치 HEAD 재확인. `EXIT_CRITERIA.md`의 실제 브라우저/E2E 게이트는 미충족 상태로 유지하고 숫자를 채우기 위한 무한 edge-case 확장을 배제.

## 남은 위험 및 3-8-45
- 80ms debounce는 모의 타이머만 확인. 로그인/로그아웃 경합 중 다른 탭의 localStorage clear/guard write/remove와 오래된 버전 JS가 생성하는 storage event를 **실제 브라우저 다중탭에서 시험하지 못함**. `logout(false)`의 공유 suppression/tombstone 기록이 경쟁 로그인에 미칠 실제 영향도 격리 브라우저에서 확인 필요.
- 3차 종료 기준은 `qa-round3/EXIT_CRITERIA.md`에 보존. 여전히 실제 브라우저 다중탭/PWA, 관리자 PIN/지문·근태 동작, **독립 QA Supabase**의 subscribe-after-snapshot/E2E, 구버전 호환성, 마지막 통합 회귀 및 2개의 상이한 CLEAN 확인이 필요.
- 다음 **3-8-45**는 보안·데이터 무결성 우선으로 `logout(false)`와 신규 local guard event의 타이밍 경합, 마이그레이션된 동일 token 구버전 탭 동작 및 QA-only 실 브라우저 실행 가능성의 선행조건을 집중 확인. 어떤 경우에도 운영 main과 실 직원 DB에 연결하거나 실 데이터를 테스트로 쓰지 않음.

작성 KST 2026-10-20 18:35:02.
