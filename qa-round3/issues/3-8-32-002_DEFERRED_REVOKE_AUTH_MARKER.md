# 3-8-32-002 — 관리자 권한 철회 지연 콜백의 타 계정 표식 제거

- **Severity:** MEDIUM. **QA:** `revokeAdminUnlockForToken()`, `clearAdminUnlockForSession()`.
- **재현:** 이전 관리자 계정의 readonly/역할 하향 과정에서 `revokeAdminUnlockForToken(oldToken)`이 지연된 Browser Web Lock callback을 등록. 그 사이 새 관리자 로그인으로 tab/shared `ADMIN_UNLOCK_KEY`가 교체됨. 원본 callback의 `clearAdminUnlockForSession`는 임시 sessionStorage 표식을 토큰 검사 없이 제거하여 새로운 로그인 인증 표식을 삭제. 원본 실제 함수 격리에서 PC remembered/mobile 경로 재현; 서버 데이터 미사용.
- **QA 수정:** `revokeAdminUnlockForToken` 지연 콜백 안에서 old token, captured `sessionContextEpoch`, shared storage 소유권을 확인하여 오래된 정리를 차단. `clearAdminUnlockForSession` 모든 scope에서 tab unlock은 지정한 token과 정확히 일치할 때만 제거; mobile shared unlock은 session과 admin marker가 모두 해당 토큰일 때만 제거. 목적이 다른 새 세션의 표식을 강제로 지우지 않음.
- **수정 검증:** PC remembered/tab-only/mobile × stable revocation/새 token/같은 token 새 epoch/storage event 지연 **12/12 PASS**. PC tab-only는 독립적인 공유 admin 세션을 건드리지 않아야 한다는 원칙까지 확인.
- **제약:** 실제 네이티브 Browser Web Locks 다중 탭 및 관리자/직원 계정 E2E, 실기기 PWA는 미검증. QA blob `8d1793491a2ff6447011fde1b3db8eae05d05830`; 운영 main/DB 무변경.