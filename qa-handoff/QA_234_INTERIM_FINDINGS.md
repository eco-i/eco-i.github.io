# 근무모아 QA 2-8-234 중간 검사 근거 (공식 완료 아님)

- 검수 시작: 2026-10-11 18:17:06 KST. **상태: 2-8-234 진행 중, 실재 결함 발견 및 수정 미완료.**
- 전 공식 완료 블록 2-8-233 / 공식 누적 결함 **504종 유지**. 234 신규로 발견한 잠금 경합 제품 결함 **1종 미해결**, 누적 공식 결함 수는 성공한 수정/회귀 전 갱신하지 않음.
- 기준본 SHA256 \`a9a60aee1b863ec6cbb02d1d166268668199b129720e97cb26c0e1ebeca8d8e0\`, 1,157,310 bytes. APP_VERSION \`ver20260927-0944\` 유지. SQL 변경/운영 \`main\` 배포 없음.
- GitHub Actions smoke: https://github.com/eco-i/eco-i.github.io/actions/runs/38128084435 — 34개 기본 검사 통과.
- 경합 재현: https://github.com/eco-i/eco-i.github.io/actions/runs/38128428403 — **실제 Chromium 동일 출처 서로 다른 두 탭**, \`acquireSharedSessionMutex()\` 동시 획득 150회 중 **84회 양쪽 모두 성공**. distinct owner UUID와 두 유효 잠금키 확인. 세션/관리자 unlock/로그아웃 클라이언트 직렬화 가정 깨짐. 운영 Supabase 로그인 경합을 직접 확인한 결과는 아님.
- 수정 프로토타입 1: lock snapshot 및 타 lock fail-closed → 67/150 동시 성공, 실패. 2: 6ms 동기 안정화 → 71/150 동시 성공, 실패. 추가 run → 85/150 동시 성공, 실패. **두 프로토타입 모두 폐기**, \`index.working-2-8-234.html\` 은 시작본과 동일한 공식 Git blob으로 되돌림. 진행중 완료 판정 금지.
- https://github.com/eco-i/eco-i.github.io/actions/runs/38128771571 — 비교검사에서 Web Locks 브라우저 API로 **2탭 70회 임계영역 겹침 0회**, 그러나 이는 제품 수정이 아닌 별도 하네스 실험. 수정된 제품의 회귀 성공을 뜻하지 않음. 해당 실행은 원래 mutex 충돌 85회로 의도적 실패.
- 근무표 A/B/C/D × 2026~2027년 2,920경우 독립 대조, 대정비, 야간 자정 경과 시간연차, 500개 난수 연차구간 병합, 인사 sort_order 0, 장기재직, 잘못된 RPC 시각·지문메타 거절, 실제 Chromium PNG→JPEG 압축/서명 및 비이미지 거절, 기본 화면 너비 320~1440px, XSS 이스케이프, 두 탭 storage 이벤트 / sessionStorage 독립 통과.
- 테스트 하네스 전용 오류: 새 context 미생성 Playwright 실패, assert callback API 오류 → 하네스 수정. 제품 결함에서 제외.
- 미검증: 운영 Supabase/RLS, Android 실기기/네이티브 파일 선택기, 실제 로그인·권한 변동 다중탭, BFCache, 기타 깊이 8 전체 미완료. 20분 기준 충족만으로 종료 불가.

## 다음 검수 절차
1. **234 유지, 235 진행 금지**. 공용 세션 동기화가 동시 탭에서도 원자적 직렬화되도록 구조 설계(예: navigator.locks.request 기반 비동기 통합), 로그인/로그아웃/관리자 잠금 및 손실 복구 분기를 전부 수정하고 실제 동시성 회귀 확인.
2. Web Locks 미지원 환경에서 쓰기 작업 차단 또는 안전한 지원전략 결정. 안드로이드 네이티브·구형 브라우저는 별도 검증.
3. 제품 소스 수정 후 20분 이상 깊이 8 검수 및 전체 회귀 PASS시 그때 공식 234 완료, defect 카운트 갱신, 공식 SHA/보고서와 235 시작본 commit 후 재조회.
4. 이 파일은 중간 인계용이며 공식 완료 보고서는 아님.
