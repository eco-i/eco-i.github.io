# 근무모아 2차·깊이8 — 2-8-253 공식 완료 보고

**검수 시작 (KST)** 2026-10-14T21:01:03.502+09:00. **공식 완료 (KST)** 2026-10-14T21:22:29.521+09:00. 총 21.4분 실제 소스 추적·8계층 검수·실 Chromium 테스트·회귀·인계, 블록당 최소20분 준수. KST 중간보고 21:08, 21:15, 21:19.

## 공식 상태
- 마지막 유효 완료 **2-8-253**, 다음 시작 **2-8-254**.
- 독립 신규 제품 결함 **0종**. 누적 제품 결함 **536종 유지**.
- 시작 `qa-handoff/index.before-2-8-253.html`, 검수 `qa-handoff/index.working-2-8-253.html`, QA `index.html`, 다음 불변 `qa-handoff/index.before-2-8-254.html` 동일 SHA-256 `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`, **1,174,027 bytes**, Git blob `f530e495859f46f0eaa669acdbc8e7a3f6907bdf`. **제품 HTML 수정 없음**.
- `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL/APP_VERSION/운영 배포 변경 없음. `version.json` `ver20260927-0944`.

## 깊이 8 브라우저 회귀 실증
- 동일 SHA의 독립 Chromium 8계층 전체 **214 PASS/0 FAIL × 3**: [#38561386795](https://github.com/eco-i/eco-i.github.io/actions/runs/38561386795), [#38562361154](https://github.com/eco-i/eco-i.github.io/actions/runs/38562361154), [#38562368802](https://github.com/eco-i/eco-i.github.io/actions/runs/38562368802).
- PC/모바일 로그인 토큰 범위 324상태+로그아웃 tombstone 324상태 **648 PASS**: [#38561513667](https://github.com/eco-i/eco-i.github.io/actions/runs/38561513667).
- 실 Chrome 네이티브 취소/로그인 대상 2차 변경·삭제 중 deferred 저장 가드 **16/0**: [#38561188198](https://github.com/eco-i/eco-i.github.io/actions/runs/38561188198).
- 지문 사진 실제 브라우저 이미지 압축/파일 이름/20MB 제한/PNG 투명도/비정상 파일 **24/0**: [#38561729394](https://github.com/eco-i/eco-i.github.io/actions/runs/38561729394).
- 진짜 브라우저 FileList change/로컬 지문 사진 저장 1회/중복 이벤트 무시/취소 잠금 해제, PC·모바일 **12/0**: [#38562062844](https://github.com/eco-i/eco-i.github.io/actions/runs/38562062844).
- 252에서 수정한 지문 사진 native confirm과 다른 탭 세션 철회 18개 독립 Chromium 컨텍스트 **72/0**: [#38562424749](https://github.com/eco-i/eco-i.github.io/actions/runs/38562424749).
- 2026~2027년 A/B/C/D 8일 반복 근무, 대정비 예외, 일근 공휴일 등 **6,542/0**: [#38562781753](https://github.com/eco-i/eco-i.github.io/actions/runs/38562781753).
- PC 관리자 실 UI 권한 박탈/Quota 시나리오 **16/0**: [#38562707240](https://github.com/eco-i/eco-i.github.io/actions/runs/38562707240).
- 실제 cold boot/지연 RPC/할당량 오류 및 재로드 구 권한 부활 차단 **19/0**: [#38562895758](https://github.com/eco-i/eco-i.github.io/actions/runs/38562895758).
- SHA/HTML 바이트, 인라인 JS 2개 컴파일, 고유 DOM ID 457개, RPC 명칭 75종의 호출/변경 보호 분류 등 정적 **20/0**: [#38562260129](https://github.com/eco-i/eco-i.github.io/actions/runs/38562260129).
- 8계층 기본 회귀에는 휴가·근태 시간 연산/교대 달력/PC 모바일 320~1440px/초기 PIN/관리자 권한/지문·다중탭·Web Locks 등 포함.

## 검수 도중 발생한 하네스 문제와 제품 결함 구별
- 근무표 2개년 확장 테스트 초기 [#38562587921](https://github.com/eco-i/eco-i.github.io/actions/runs/38562587921) 실패는 테스트 기대값에서 야간 이후 비번 `비` 2일을 `휴`로만 잘못 분류한 **검사기 기준 오류**. 현장 패턴 `주2+야2+휴2+비2` 로 바로잡고 코드 변경 없이 6,542개 모두 GREEN. 이 결과를 제품 결함에 추가하지 않음.
- 그 외 제품 오류 재현 없음. 그래서 작업용 HTML·앱 코드와 SHA를 수정하지 않음.

## 환경 한계
- 실제 브라우저는 headless Chromium이지만 RPC는 stub/mock. 운영 Supabase SQL·RLS·인증된 복수 사용자, 물리 Android 카메라/파일 선택, iOS Safari, persisted BFCache, 운영 백업/복원은 이 블록에서 직접 실증하지 못함.
- 운영/검수 브랜치 엄격 분리, SQL/APP_VERSION/실배포 불변, ZIP 요청·제안 없음. 도구 원문·장문 로그의 채팅 출력만 최소화했으며 검사 깊이·실제 20분·독립 반복은 축소하지 않음.

## 다음 블록
**2-8-254**, 공식 불변 기준 `qa-handoff/index.before-2-8-254.html`. High, 깊이8, 각 블록 최소20분 실제검수, KST 20분 내 보고, 발견 즉시 수정·회귀.
