# 근무모아 3차·깊이8 — 3-8-38 공식 검수 보고서

## 판정
- **3-8-38 범위 완료: MEDIUM 신규 결함 1종(3-8-38-001) 모의 재현 및 QA 수정. CLEAN 아님.**
- 3차 누적 **30종** (기존 29 + 1), 2차 기존 540종 별도.
- QA `index.html` 이전 blob `084696ce5ef54748bcb0043a14504cbae10ebe26` → 현재 `a9eeafdc9e1531b54423c9067c31762a6cb5601e`. 제품코드 커밋 `fb6d027d720ae1eb41c3989735f3ef19f1794fd4`; `APP_VERSION=ver20261018-2313` 불변.
- 운영 `main` HEAD `6c784210e048426f18a486d5602652626d97574d` 조회 확인; 직원 DB / 운영 Supabase / 실제 로그인 RPC·SQL·배포 접근 0.

## 깊이8 검수 내용
1. 공식 state·new-chat 인계·3-8-37 보고서와 QA blob 일치 확인. 버전/운영 분리.
2. 구버전 aggregate logout 재기록을 방어하는 local fresh-login epoch 및 초기 `storedSessionTombstoned` 리터럴 키 사용·상수 선언 순서를 실제 HTML에서 확인. 5초 미래 허용·60초 유효성 기준 검토. epoch 저장키의 독립 정리정책은 향후 보완 대상으로 분리.
3. **원본 재현:** 모바일 / PC 로그인 유지 / PC 임시 3가지에서 이전 같은 토큰 세션과 로그아웃 표식을 둔 뒤 epoch 저장 실패 주입. 원본 `storeLoginSession=false`이면서 `storedSessionTombstoned=false`, 기존 로그인 저장키 잔존 확인. 실제 원본 함수를 실행한 mock 순서이며 브라우저 실기기 재현 아님.
4. **국소 수정:** `completeFreshLoginLogoutReset`이 epoch 검증을 logout 증거 삭제보다 먼저 수행하도록 세 경로 공통화; 후속 처리 실패 시 이전 epoch 복원 시도. 서버 UUID token의 기존 처리와 `clearLogoutTombstone=false` 자동업데이트 handoff 경로는 유지.
5. **최종 QA blob 원본 함수 격리 59/59 assertion PASS:** 모바일/PC 기억/PC 임시, exact/legacy 로그아웃 기록, epoch 실패, 정상 재로그인, suppression 삭제 실패, 저장소에 이전 token 없음, 서버 UUID 토큰. 원본 실패 재현은 수정본 PASS 숫자에서 제외.
6. **Realtime 실제 `requestRealtimeCatchup` 함수+지연 Promise 모의 6종 PASS:** 성공·기존 작업 중 새 signal 도착·읽기 실패·낡은 session callback·오프라인 보류·숨김 탭 미시작. 신규 signal은 현재 세대 catch-up에 지워지지 않음. 실제 Realtime 채널/다중기기 전파 시험은 하지 않음.
7. 최종 HTML 인라인 JS 2개 구문 분석 PASS, literal HTML id 488개 중복 0, 보정 helper 1개/실제 3 로그인 경로 통합 3곳, `APP_VERSION` 변경 없음. 이러한 정적 점검은 완전한 브라우저 기능 검증과 구분.
8. GitHub `qa-3-8`만 코드 수정 및 이슈/보고서/state/인계 갱신, `main` HEAD 별도 확인. 직원 DB·운영 배포는 분리.

## 미검증과 다음 3-8-39
- **실제** Chrome old/new 버전 2탭 + Web Locks 및 localStorage quota/private browsing 차단·복원실패 복합 시나리오, 급격한 기기 시계 변경/재동기화, Android/iOS PWA/최초 PIN/동일 토큰 재로그인, QA-only 격리 2계정 Realtime SUBSCRIBED/INSERT 연속 경합.
- 강제 저장 실패 후 epoch rollback 자체가 거절되는 희귀 복합 고장과 legacy writer 실경합의 원자성 보장은 미입증; 실제 직원 데이터로 실험 금지.
- 다음 **3-8-39**: epoch cleanup/pruning 및 다중 탭 실패 조합, Realtime 재조회 Promise 역전·새 signal 세대, 모바일 초기 복원 권한을 QA-only로 재검수. 프로덕션 무변경.

작성 시각 (KST): 2026-10-20 16:38:07
