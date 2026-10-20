# 근무모아 3차·깊이8 공식 인수인계

- **3-8-42 공식 완료: MEDIUM 결함 1종 원본 실제 함수 저장소 mock 재현·QA 수정, 최종 557/557 scoped assertion PASS. 다음 3-8-43.** 3차 누적 **34종**(2차 540종 별도). CLEAN 아님.
- GitHub 저장소 `eco-i/eco-i.github.io` / 검수 브랜치 `qa-3-8` / 운영 `main`. 새 채팅: `qa-round3/CURRENT_STATE.json`, 본 파일, `qa-round3/QA_3-8-42_REPORT.md`부터 직접 확인.
- **3-8-42-001 MEDIUM:** `local:<id>`의 지난 실패 로그인 `staffAttendance_updateLocalLoginPending_v1:<token>` guard는 실제 존재하지만 선택적 `localStorage.getItem` 예외가 나면 `storageGet`이 빈 값으로 변환해 `storedSessionTombstoned=false`, `storedSessionToken` 구토큰 채택, `storeLoginSession(...,false)` handoff 복원 허용. 모바일/PC 기억/PC 임시 3범위 실제 QA 소스 함수+모의 storage 예외로 재현. 실 운영 서버 UUID login 인증 우회 증명 아님.
- **국소 수정:** `storedSessionTombstoned`의 pending guard 판독은 직접 try/catch해 읽기 예외에도 보수적으로 차단(true); `storeLoginSession(...,clearLogoutTombstone=false)`의 해당 guard 읽기 예외에도 복원 거부(false). 정상 guard 없을 때 로그인/업데이트 동작 유지, local preview만 적용. 읽기 장애 시 사용자 로그인이 거부될 수 있는 fail-closed tradeoff 명시.
- 제품 이슈 `qa-round3/issues/3-8-42-001_LOCAL_LOGIN_GUARD_READ_ERROR_FAILS_OPEN.md`, 보고서 `qa-round3/QA_3-8-42_REPORT.md`.
- QA HTML 최종 blob **`6c9727dcb3f39d1c2f3063fafbdbe6838cfb345b`**, 코드 commit **`2bcdb23791dd67523b2dbce51284c7acbc5fa523`**. 이전 41 blob `24aac098a0a178b28c6be3c97d368286144b5531`. APP_VERSION `ver20261018-2313` 불변.
- **최종 커밋 실제 소스 격리·정적 557/557 PASS**: 3범위×2 기존 guard×4 logout 증거×4 정상/저장실패 시나리오×5 assertions = **480**; 3범위×6 guard 상태(없음/있음/오래됨/선택적 get 예외/전부 read 예외/set 실패)×3 assertions = **54**; inline JS parse 2, script 수 1, HTML IDs 488개수/고유 각1, 버전1, 이전 로그인 3경로1 = **7**; 지연 Realtime Promise·신호·세션 소유권 = **16**. 원본 실패 재현 및 무효한 시험 케이스는 합산하지 않음. 실제 종단간 서버/다중 브라우저 미검증.
- 운영 `main` baseline SHA **`6c784210e048426f18a486d5602652626d97574d`**. 직원 DB/근태/지문/실 RPC·SQL 및 운영 배포 0; 다음 작업 전후 GitHub main SHA 재확인.
- **다음 3-8-43:** guard 저장소 오류에서 사용자 정상 재로그인 회복·stale guard/clock skew, Realtime SUBSCRIBED/reconnect 세션 귀속 및 종료기준 검토. 오래된 버전 탭은 새 pending guard를 모르므로 완전 cross-version 동기 보장 불가. 운영 DB는 절대 접근하지 말고 QA 모의실험·격리 계정만.
- 원칙: 연결 안정성 우선·채팅 용량 최소화·상세 GitHub 보고·ZIP 불필요. 3차 검수 블록을 무제한 증식시키지 않도록 실제 위험/미검증/종료조건 구분.

