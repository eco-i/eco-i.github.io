# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 248 완료

- 마지막 완료 **2-8-248**, 다음 **2-8-249**, 공식 누적 제품 결함 **531종**(이번 +2종).
- GitHub `eco-i/eco-i.github.io` QA `qa-2-8` 브랜치. 운영 `main` 5c9529069a4728e72b960c61a44e8045eacc0ca0 변경·배포 없음, SQL 불변, APP_VERSION `ver20260927-0944`.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-248.html`, 다음 시작 `qa-handoff/index.before-2-8-249.html`: SHA-256 `9ac74340a527a35f1f971b4a391417dfe395f2c4714a1cb66b03562ecf85a6c0`, **1,171,231 bytes**.
- 불변 이번 시작 `qa-handoff/index.before-2-8-248.html`: SHA-256 `2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776`, **1,170,255 bytes**.
- 신규 제품 결함① PC 공유+탭 동일 토큰의 로그인 유지 표식이 유실된 모호한 세션에서 한쪽 오래된 admin unlock 마커로 재승인되는 문제: 이 범위에서는 두 admin 마커 모두 검증하는 fail-closed 정책. RED #38397092669, GREEN #38397375409 / #38398920753, 648개 상태 매트릭스 PASS #38398920563, 실제 Chrome 두 탭 native dialog PASS #38398920581.
- 신규 제품 결함② PC_REMEMBER_KEY cross-tab 삭제로 권한이 사라져도 관리자 민감 DOM/PIN 캐시가 잔존하는 문제: storage event에서 현재 권한 재평가 후 안전한 UI·캐시 제거. RED #38398742914, GREEN #38398920657 (9/0), 추가 민감 UI 및 native confirm 각 18/0 #38398920653.
- 최종 SHA 고정 전체 Chromium 깊이8 **212 PASS/0 FAIL × 3회**: #38399063267, #38399397943, #38399407162. 독립 SHA/2 source hunk/JS2/DOM457 PASS #38399075837 / #38399407162.
- 공식 보고 `qa-handoff/QA_2-8-248_REPORT.md`, 증거 `qa-handoff/QA_248_EVIDENCE_AUDIT.json`, manifest `qa-handoff/QA_2-8-248_SHA_MANIFEST.json`.
- 운영 Supabase SQL/RLS·실 백엔드 다중 사용자·물리 Android picker/camera·iOS Safari·persisted BFCache·운영 백업복원 직접 미검증.
- **High·깊이8·블록당 최소20분 실제 검수·20분 이내 중간보고·기술 오류 즉시 수정과 실 Chromium 회귀·번호 연속**. 임의 버전·SQL·main·운영 실배포 변경 금지. ZIP 요청 금지, GitHub 직접 사용.
