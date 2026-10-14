# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 253 완료

- 마지막 유효 완료 **2-8-253**, 다음 시작 **2-8-254**, 누적 독립 제품 결함 **536종** (253 신규 **0종**).
- GitHub `eco-i/eco-i.github.io`, QA `qa-2-8`; 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL/실배포/APP_VERSION 변경 없음. `ver20260927-0944`.
- QA `index.html`, `qa-handoff/index.working-2-8-253.html`, 시작 `qa-handoff/index.before-2-8-254.html` 모두 **SHA-256 `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`**, **1,174,027 bytes**, Git blob `f530e495859f46f0eaa669acdbc8e7a3f6907bdf`. 이번 블록 제품 HTML 수정 없음.
- 공식 시작본 `qa-handoff/index.before-2-8-253.html`도 위와 동일.
- 실제 High·깊이 8 검수 **2026-10-14 21:01~21:22 KST, 21분 이상**. 20분 이내 중간보고 실시, 소스/검사 수준 축소하지 않음.
- 동일 SHA 독립 Chromium 8계층 **214 PASS/0 FAIL ×3**: [#38561386795](https://github.com/eco-i/eco-i.github.io/actions/runs/38561386795), [#38562361154](https://github.com/eco-i/eco-i.github.io/actions/runs/38562361154), [#38562368802](https://github.com/eco-i/eco-i.github.io/actions/runs/38562368802).
- PC/모바일 648 세션 상태 [#38561513667](https://github.com/eco-i/eco-i.github.io/actions/runs/38561513667) PASS; 네이티브 확인창+deferred 구 권한 RPC [#38561188198](https://github.com/eco-i/eco-i.github.io/actions/runs/38561188198) 16/0.
- 실제 파일 입력·업로드·취소·중복 [#38562062844](https://github.com/eco-i/eco-i.github.io/actions/runs/38562062844) 12/0, 이미지 압축 형식·용량 [#38561729394](https://github.com/eco-i/eco-i.github.io/actions/runs/38561729394) 24/0.
- Native prompt 세션 철회 독립 18개 Chromium 컨텍스트 [#38562424749](https://github.com/eco-i/eco-i.github.io/actions/runs/38562424749) 72/0; 2026~2027 A/B/C/D 교대근무/대정비 전수 [#38562781753](https://github.com/eco-i/eco-i.github.io/actions/runs/38562781753) 6542/0.
- 관리자 UI 역할 철회 [#38562707240](https://github.com/eco-i/eco-i.github.io/actions/runs/38562707240) 16/0; 실제 브라우저 cold boot quota/재로드 [#38562895758](https://github.com/eco-i/eco-i.github.io/actions/runs/38562895758) 19/0; SHA/JS2/DOM457/RPC75 분류 [#38562260129](https://github.com/eco-i/eco-i.github.io/actions/runs/38562260129) 20/0.
- 근무표 초기 확장 검사 [#38562587921](https://github.com/eco-i/eco-i.github.io/actions/runs/38562587921)는 하네스가 `비`를 유효 교대분류에서 빠뜨린 오류. 기준 정정 후 6542 PASS; 제품 오류 아님. 신규 독립 결함 0종.
- 운영 Supabase/RLS/인증 다중사용자, 물리 Android 카메라/피커, iOS Safari, persisted BFCache, 운영 백업 복원 미검증. 실제 headless Chrome 사용, 네트워크 RPC는 stub.
- 공식 보고서 `qa-handoff/QA_2-8-253_REPORT.md`, 증거 `QA_253_EVIDENCE_AUDIT.json`, SHA `QA_2-8-253_SHA_MANIFEST.json`.

## 필수 운영 규칙
- **다음은 2-8-254**, `qa-handoff/index.before-2-8-254.html`에서 시작. 반드시 `CURRENT_STATE.json` 및 공식 보고서 먼저 확인. 공식 마지막 유효 번호 바로 다음부터 연속.
- High·깊이8, 블록당 **최소20분 실제 심층검수**, 20분 안 KST 시각 포함 중간보고, 발견 즉시 수정+RED→GREEN→독립 실 Chromium 회귀·SHA 검증, 하네스와 제품 결함 분리.
- `main`·SQL·APP_VERSION·실배포 임의 변경 금지. **ZIP 파일 요청·제안 금지.**
- **채팅 길이 최적화는 출력량만**: 1MB HTML·Actions 전체 로그·JSON·거대 diff는 GitHub에 두고 채팅에는 필요한 SHA/건수/결과/링크/시간만 표시. 검수 깊이·횟수·시간 절대 축소 금지. 채팅 최대 한도 자체 해제는 아님.
