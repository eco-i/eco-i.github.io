# ★★★근무모아 2차·깊이8 공식 GitHub 인계 — 255 완료

- 마지막 공식 완료 **2-8-255**, 다음 **2-8-256**, 누적 독립 제품 결함 **538종** (255 신규 **1종**).
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`, 운영 `main`. `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. SQL/배포/`APP_VERSION` 변경 없음. `ver20260927-0944`.
- 기존 불변 시작본 `qa-handoff/index.before-2-8-255.html`: SHA-256 `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b`, 1,174,092 bytes, blob `5e0de9676d1a0f71054c790927efbd4f4a67762b`.
- 수정 검수 `index.html`, `qa-handoff/index.working-2-8-255.html`, 차기 불변 시작 `qa-handoff/index.before-2-8-256.html`: **SHA-256 `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2`**, **1,174,581 bytes**, Git blob `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798`.
- **High·깊이 8**, 실제 심층검수 **2026-10-14 23:26~23:48 KST(22.1분)**, 20분 이내 중간 보고.
- **신규 제품 결함 1종**: `parseDataBackupText`가 `data:[]`, `included_sections` 중복/알 수 없는 항목, 포함항목과 data 키 불일치 JSON을 미리보기 RPC 전에 차단하지 않았음. RED 실제 PC/모바일 [#38580989397](https://github.com/eco-i/eco-i.github.io/actions/runs/38580989397) 62 PASS/6 FAIL. 프런트 구조검사 5줄 추가/1줄 삭제(+489 bytes). 동일 브라우저 GREEN [#38581443453](https://github.com/eco-i/eco-i.github.io/actions/runs/38581443453) **68/0**. 유효·오류 백업 개인/관리자 6,144개 [#38582937742](https://github.com/eco-i/eco-i.github.io/actions/runs/38582937742) PASS. 실 file.text() 동안 세션 삭제/교체·malformed backup 서버 미전송 40/0 [#38582082351](https://github.com/eco-i/eco-i.github.io/actions/runs/38582082351). 부정확 백업 수용 문제를 데이터 침해·실제 복원 성공으로 과장하지 말 것.
- 동일 final SHA 8계층 Chromium **214/0 ×4**: [#38581432518](https://github.com/eco-i/eco-i.github.io/actions/runs/38581432518), [#38582233897](https://github.com/eco-i/eco-i.github.io/actions/runs/38582233897), [#38582248326](https://github.com/eco-i/eco-i.github.io/actions/runs/38582248326), [#38582260642](https://github.com/eco-i/eco-i.github.io/actions/runs/38582260642).
- PC·모바일 token scope/tombstone **648** [#38582604180](https://github.com/eco-i/eco-i.github.io/actions/runs/38582604180), 2026~2027 연가·교대 **34,020** [#38582455474](https://github.com/eco-i/eco-i.github.io/actions/runs/38582455474), native dialog/file picker **28** [#38581792459](https://github.com/eco-i/eco-i.github.io/actions/runs/38581792459), 소스/RPC/DOM 무결성 **23** [#38582726686](https://github.com/eco-i/eco-i.github.io/actions/runs/38582726686) 모두 통과.
- 테스트 하네스 오류 [#38581253505](https://github.com/eco-i/eco-i.github.io/actions/runs/38581253505): 변경 후 이전 SHA/bytes 기대값 잔존. [#38582361408](https://github.com/eco-i/eco-i.github.io/actions/runs/38582361408): 예전 247 SHA가 scope 스크립트에 잔존. 수정 후 전수 GREEN. 제품 결함 미산입.
- 실제 headless Chromium PC/Android 에뮬레이션·2탭·native confirm/FileList/모의 RPC는 실증. 운영 Supabase/RLS/실제 인증 다중사용자, 물리 Android 카메라/파일선택, iOS Safari, persisted BFCache, 운영 백업·복원 직접 실증 못함.
- 공식 보고서 `qa-handoff/QA_2-8-255_REPORT.md`, 증거 `QA_255_EVIDENCE_AUDIT.json`, SHA `QA_2-8-255_SHA_MANIFEST.json`, 인계 `START_2-8-256_AFTER_255.txt`.

## 운영 규칙
- **다음은 2-8-256**, 무조건 `qa-handoff/index.before-2-8-256.html`을 기준으로 GitHub `CURRENT_STATE.json`부터 확인. 블록 번호 건너뛰지 않음.
- High·깊이8 **매 블록 최소20분 실제 검수**, 20분 내 KST 중간보고. 재현 결함 즉시 수정+RED→GREEN·전체 독립 Chrome 회귀. 하네스 오류 별도 구별.
- **운영 `main`·SQL·APP_VERSION·실배포 임의 변경 금지. ZIP 요청/제안 금지.**
- 채팅 길이 최적화는 1MB HTML·긴 테스트 로그·JSON 덤프를 GitHub에 남기고 핵심 SHA/건수/결과만 사용자에게 표시하는 것. 실제 심층검수 깊이·범위·시간·독립 횟수 축소하지 않음.
