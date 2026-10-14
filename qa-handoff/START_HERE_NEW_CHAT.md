# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 254 완료

- 마지막 공식 완료 **2-8-254**, 다음 시작 **2-8-255**, 누적 독립 제품 결함 **537종** (254 신규 **1종**).
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 `main`. 운영 HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL/배포/`APP_VERSION` 변경 없음, `ver20260927-0944`.
- 이전 기준 `qa-handoff/index.before-2-8-254.html`: SHA-256 `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb`, 1,174,027 bytes, blob `f530e495859f46f0eaa669acdbc8e7a3f6907bdf`.
- 수정 검수본 `index.html` (QA 한정), `qa-handoff/index.working-2-8-254.html`, 다음 시작 불변 `qa-handoff/index.before-2-8-255.html`: 동일 **SHA-256 `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b`**, **1,174,092 bytes**, Git blob `5e0de9676d1a0f71054c790927efbd4f4a67762b`.
- High·깊이8 실제 심층검수 2026-10-14 **22:22~22:45 KST (23.2분)**, 20분 이내 중간 보고.
- **254 신규 독립 제품 결함 1종**: `scheduleSharedSessionReload`의 네이티브 로그인 전환 confirm 직후 `markNativeDialogReturn()`이 누락돼 교차 탭 로그인 변경이 지연된 동안 옛 세션 토큰으로 쓰기 RPC 발신 가능. RED 실 Chromium [#38572152898](https://github.com/eco-i/eco-i.github.io/actions/runs/38572152898): 15 PASS/1 FAIL, 이전 토큰 `save_my_memo_v2` 전송 확인. `switchNow=confirm(...)` 반환 다음에 `markNativeDialogReturn()`을 넣어 수정, 파일 한 지점 (+65바이트, 3줄 추가/1줄 삭제). GREEN [#38573327790](https://github.com/eco-i/eco-i.github.io/actions/runs/38573327790) 16/0, 8회×4종 추가 [#38573244291](https://github.com/eco-i/eco-i.github.io/actions/runs/38573244291) 128/0.
- 동일 final SHA 전체 Chromium 8단계 **214/0 ×4**: [#38573028764](https://github.com/eco-i/eco-i.github.io/actions/runs/38573028764), [#38573575362](https://github.com/eco-i/eco-i.github.io/actions/runs/38573575362), [#38573933390](https://github.com/eco-i/eco-i.github.io/actions/runs/38573933390), [#38573941015](https://github.com/eco-i/eco-i.github.io/actions/runs/38573941015).
- PC/모바일 로그인 token scope/tombstone 648 [#38571923751](https://github.com/eco-i/eco-i.github.io/actions/runs/38571923751). **2026~2027 연가/야간/겹침 34,020 검증** [#38573341080](https://github.com/eco-i/eco-i.github.io/actions/runs/38573341080). 실제 파일 피커12·이미지24·native 사진 stress72·관리자UI16·cold boot19·handoff16, 총159/0 [#38573327790](https://github.com/eco-i/eco-i.github.io/actions/runs/38573327790). SHA/JS/DOM/RPC 무결성 21/0 [#38573488452](https://github.com/eco-i/eco-i.github.io/actions/runs/38573488452).
- 초기 하네스 오류: 날짜별 00:00~08:00 사례가 all_day로 남은 테스트 입력, 수정 전 SHA pin, 세션 보안 리로드 순간 page.evaluate 문맥 파괴 1회. 제품 결함에 오계상 금지. 같은 final SHA로 독립 214/0 전체완주 4회 확보.
- 환경 한계: 실제 headless Chromium PC/Android 에뮬레이션, native confirm, FileList, 다중 탭, mock RPC. 운영 Supabase/RLS·진짜 복수 사용자, 물리 Android 카메라, iOS Safari, persisted BFCache, 운영 백업/복원은 미검증.
- 공식 `qa-handoff/QA_2-8-254_REPORT.md`, `QA_254_EVIDENCE_AUDIT.json`, `QA_2-8-254_SHA_MANIFEST.json`, `START_2-8-255_AFTER_254.txt` 참조.

## 다음 검수 필수 원칙
- **다음 블록은 2-8-255**, `qa-handoff/index.before-2-8-255.html` 시작. GitHub 공식 상태 `CURRENT_STATE.json` 검증 후 마지막 완료 번호 다음만 진행.
- High·깊이8, 블록별 **최소20분 실제 검수**, KST 20분 내 중간보고, 오류 즉시 수정/RED→GREEN/독립 회귀. 테스트 하네스 오류와 독립 제품 결함 구분.
- QA/운영 브랜치 엄격 분리, SQL/APP_VERSION/배포 임의 변경 금지. **ZIP 요청·제안 금지.**
- 채팅 길이 최적화는 대용량 HTML/Actions 원본 로그/JSON의 출력량만. 실제 검수 범위·깊이·시간·독립 반복은 줄이지 말 것. 채팅 최대 길이 자체를 보장할 수는 없음.
