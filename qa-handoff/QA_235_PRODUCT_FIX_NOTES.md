# QA 2-8-235 수정 내역
- 고유 신규 제품 결함 1종: 234 Web Locks 보호가 PC `sessionStorage` 임시 로그인/관리자 인증·인증해제·로그아웃·자동 인계까지 잠금 요구하며 미지원 브라우저에서 정상 흐름을 차단.
- `storeLoginSessionForFreshLogin`, `storeAdminUnlockForFreshLogin`: PC 비영구 경로는 직접 단일탭 저장, 모바일/PC 지속공유 로그인은 Web Locks 보호.
- `safelyClearStoredLoginSession`: 현재 PC 탭 고유 토큰은 Web Locks 미지원에서도 정확한 토큰만 정리, 공유로그인 변경은 계속 잠금 필수.
- `ensureAdminUnlockForRestoreWithScope`: PC 비영구 restore만 탭 인증 검증 실행, shared restore는 전역 잠금 사용.
- `revokeAdminUnlockForToken`: PC 비영구 세션 admin proof 철회는 탭 고유 저장소에서 즉시 반영.
- 앱 초기 실행 `restoreUpdateSessionHandoff`: Web Locks 요청 거절/미지원 때 sessionStorage handoff 중 `persistent:false`에 한해 복구. legacy 공유 handoff는 금지.
- 4개 Chromium 탭 400 잠금 경합/2개 탭 150잠금, 저장소 quota/삭제 실패 복원, 관리자 proof 자동 handoff 등 검증.
- 최종 HTML SHA-256 `f67887f5427da8331eaa134fbaeec73493815ac52e4c1cbcbbcaec1e42dbc50e`, APP_VERSION `ver20260927-0944`, SQL/운영 배포 없음.
