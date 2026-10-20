# 3-8-39-001 — 64개 상한 정리로 유효한 로그아웃 토큰 차단 기록 소실

- **심각도 MEDIUM**, 발생 조건: 같은 로컬 저장소에 아직 60초 이내인 서로 다른 로그아웃 토큰 기록이 65개 이상 축적되는 다량 세션 전환 시나리오.
- QA 실제 함수 재현: 원본 `pruneUpdateHandoffLogoutTokenKeys`가 timestamp 정렬 후 `.slice(64)`로 최신 64개만 남겨 오래된 **아직 fresh인** token-specific 로그아웃 기록을 제거. `updateHandoffTokenWasLoggedOut('local:65')`가 거짓, `storedSessionTombstoned('local:65')`도 거짓으로 전환. 그 토큰을 잠든 PC 임시 탭 `sessionStorage` 또는 모바일 공유 저장소가 보유하면 다음 bootstrap `storedSessionToken`이 이를 다시 후보로 인식할 수 있음. 다른 공유 suppression이나 서버 측 세션 만료가 별도로 있으면 최종 입장은 차단될 수 있으므로 서버 로그인/권한 탈취 입증은 **아님**.
- 1~64개에서는 재현되지 않으며 65,66,100,200,256,512개에서 원본 함수 격리 재현. 현실 운영에서 1분간 이 정도의 다른 토큰이 생기는 일은 매우 드물지만 **유효 로그아웃 증거를 숫자 제한으로 삭제하는 보안 불변식 위반**으로 구분.
- QA 수정: `index.html` `pruneUpdateHandoffLogoutTokenKeys`에서 count-based eviction 제거; 60초 유효성 기준으로 **만료된** 기록만 정리. 시계가 미래값으로 보정된 기록은 기존 fail-closed 정책상 오래 남을 수 있으며 초고빈도 다량 토큰의 저장 공간 trade-off 존재.
- 최종 QA 제품 코드 blob `5ef9c5c4d2e94498e7285b55079454e37ac16d96`; commit `26c6fbeaadaa0e787968d69fee7d9b4995188fb6`.
- 최종 실제 커밋 소스 격리 검증: 모바일·PC 임시·PC 유지 × 토큰 수 10종 × timestamp 상황 4종 × 로그인 차단/재복원/정리 4 assertion = **480**, HTML 인라인 script parse 2 + JS block 수 1 + ID 개수/중복 2 + 버전 1 + 기존 로그인 epoch 수선 보존 1 = **487/487 PASS**. 별도 Realtime 지연 Promise 원본 함수 8/8 PASS. 합계 서로 독립된 **495 유효 assertion**.
- 모의 환경 한정. 실제 65개 live Supabase 세션, PWA·Android/iOS·Web Locks, 구버전 다중탭/QA-only 별도 DB 서버 인증 시험은 하지 않음.
- `main` 및 실 근무·지문 직원 DB 조회/수정·RPC·배포 변경 없음.
- 작성: 2026-10-20 16:56:48 KST
