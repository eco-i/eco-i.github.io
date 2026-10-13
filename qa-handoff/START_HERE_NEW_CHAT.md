# ★★★근무모아 2차·깊이8 종합검수 GitHub 공식 인계 — 247 완료

- 마지막 유효 공식 완료 **2-8-247**, 다음 **2-8-248**, 공식 누적 제품 결함 **529종**(이번 신규 **1종**).
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`. 운영 `main` SHA `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경/배포 없음, SQL 변경 없음. APP_VERSION `ver20260927-0944` 유지.
- 최종 QA `index.html`, `qa-handoff/index.working-2-8-247.html`, 다음 시작본 `qa-handoff/index.before-2-8-248.html` 완전 동일 SHA-256 `2e1f6a2347ce8df2bf2abb3907cdb002fef0b0d96d474860e4e7166e1dd32776` (**1,170,255 bytes**).
- 이번 불변 원본 `qa-handoff/index.before-2-8-247.html`: SHA-256 `8f46de72958935ce22a0dd9b4f72b0fca4664ea0ba83ceaf01131d9666b8327d` (**1,169,644 bytes**).
- 제품 결함: 모바일 공유·PC 로그인 유지 세션의 shared 관리자 unlock이 해제됐는데 stale legacy sessionStorage 관리자 마커가 남아 있으면 관리 권한을 계속 승인한 문제. `adminUnlockMatches` 단일 함수에서 세션 저장소 권한을 먼저 판별하도록 수정. RED #38371591963 → GREEN #38371810438, #38372273058. PC 탭 전용 독립 로그인 유지 확인.
- 진짜 두 탭 native Chrome `confirm` 재현 #38372173867 2/0. 모바일/PC 저장소-권한 조합 각162 + tombstone 각162 = 648 상태 PASS, #38372770118.
- 민감 관리자 UI 캐시 정리와 native dialog 재회귀 #38373143028, #38373155719 각 18/0 + 18/0.
- 최종 고정 SHA 실제 Chromium 전체 깊이8 **210 PASS / 0 FAIL × 3회**: #38372546876, #38372823590, #38372992035.
- 원본 대비 소스 diff 1곳(관리자 helper 하나), 원본 및 최종 SHA/바이트 일치, inline JS 2 구문/DOM ID457개 독립 무결성 PASS #38372576639, #38373060134.
- 자세한 공식 보고 `qa-handoff/QA_2-8-247_REPORT.md`, 증거 `qa-handoff/QA_247_EVIDENCE_AUDIT.json`, SHA `qa-handoff/QA_2-8-247_SHA_MANIFEST.json`.
- 미검증: 진짜 Supabase/RLS/백엔드 권한·다중 사용자, 물리 Android camera/file chooser, iOS Safari, persisted BFCache, 운영 백업복원. 브라우저 권한검사 결과를 서버 보안 증거로 주장하지 말 것.
- 다음은 **High/깊이8/최소 20분 실제 검수/20분 내 중간보고/번호 연속**, 기술 오류 즉시 수정+실 Chrome 회귀. APP_VERSION/SQL/main/실배포 임의 변경하지 말 것. GitHub 직접 작업, ZIP 불필요.
