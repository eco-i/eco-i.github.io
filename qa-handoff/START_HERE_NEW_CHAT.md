# ★★★근무모아 2차·깊이 8 공식 GitHub 인계 — 256 완료

- 마지막 공식 완료 **2-8-256**, 다음 **2-8-257**, 누적 독립 제품 결함 **539종** (256 신규 **1종**).
- GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL·APP_VERSION·배포 변경 없음. `ver20260927-0944`.
- QA 이전 원본 `qa-handoff/index.before-2-8-256.html`: SHA-256 `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2` / 1,174,581 bytes / blob `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798`.
- QA 최종 `index.html`, `qa-handoff/index.working-2-8-256.html`, 다음 불변 시작본 `qa-handoff/index.before-2-8-257.html`: 모두 **SHA-256 `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9`**, **1,174,614 bytes**, Git blob `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3`.
- 실제 검수 **2026-10-15 09:36 ~ 09:58 KST, 21.9분**, High·깊이8, KST 중간보고. 검수 파일 SHA 체인 5/0 재검증.
- 이번 신규 제품 결함 **1종**: 백업 복원 파일 `parseDataBackupText`의 `Number(payload.backup_schema_version)` 묵시적 변환으로 `"1"`, `true`, `[1]`도 정식 schema 1로 허용. PC·모바일 실 Chromium RED 42 PASS/28 FAIL [#38661163899](https://github.com/eco-i/eco-i.github.io/actions/runs/38661163899). 한 줄 엄격 비교로 수정, 바이트 +33. GREEN 70/0 [#38661329330](https://github.com/eco-i/eco-i.github.io/actions/runs/38661329330), 개인·관리자 복원 전송 전 차단 각100/0 [#38662267283](https://github.com/eco-i/eco-i.github.io/actions/runs/38662267283) [#38662362464](https://github.com/eco-i/eco-i.github.io/actions/runs/38662362464).
- 깊이8 전체 Chromium **214/0 ×5**: [#38661339218](https://github.com/eco-i/eco-i.github.io/actions/runs/38661339218), [#38661833780](https://github.com/eco-i/eco-i.github.io/actions/runs/38661833780), [#38661838720](https://github.com/eco-i/eco-i.github.io/actions/runs/38661838720), [#38661844430](https://github.com/eco-i/eco-i.github.io/actions/runs/38661844430), [#38662807827](https://github.com/eco-i/eco-i.github.io/actions/runs/38662807827).
- 백업 속성 **6144**, 별도 backup fuzz **16384**, 복원 file text 2탭 race **40**, PC/모바일 인증 scope/tombstone **648**, 2026~2027 교대·연가 **34020**: [#38661609876](https://github.com/eco-i/eco-i.github.io/actions/runs/38661609876) 및 [#38662095917](https://github.com/eco-i/eco-i.github.io/actions/runs/38662095917). 네이티브 확인창·사진/이미지·관리자 UI·부팅 **287/0** [#38661791167](https://github.com/eco-i/eco-i.github.io/actions/runs/38661791167). source/DOM/RPC 무결성24 [#38662503423](https://github.com/eco-i/eco-i.github.io/actions/runs/38662503423). QA index smoke56 [#38662594315](https://github.com/eco-i/eco-i.github.io/actions/runs/38662594315).
- 테스트 하네스에서 수정 전 SHA를 기대했거나 앞 블록 HTML을 지정했던 오류는 제품 결함에 계상하지 않음. 정상 수정 후 각 QA 작업 PASS.
- QA 증빙: `qa-handoff/QA_2-8-256_REPORT.md`, `qa-handoff/QA_256_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-256_SHA_MANIFEST.json`, `qa-handoff/START_2-8-257_AFTER_256.txt`.
- 실제 PC·모바일 에뮬레이션 Chromium, native dialog/file input, 2탭, mock RPC. 운영 Supabase/RLS 실제 다중사용자, 물리 Android 카메라, iOS Safari, persisted BFCache, 운영 백업/복원 직접 미검증.

## 다음 검수 규칙
- GitHub `qa-handoff/CURRENT_STATE.json`과 SHA 확인 후 **2-8-257부터** 순서대로. High·깊이8·최소 20분 실제 검수, 20분 이내 중간보고, 실제 KST 시간 명기. 오류 즉시 수정·RED→GREEN·독립 회귀. ZIP 제안 금지. `main`/SQL/실배포/APP_VERSION 임의 변경 금지. 채팅 길이 최적화는 도구 출력·중복 설명에만 적용(실검수 약화 금지).
