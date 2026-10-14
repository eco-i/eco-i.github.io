# 근무모아 2차 · 깊이 8 — 2-8-254 공식 완료 보고

**시작 (KST):** 2026-10-14T22:22:31.235+09:00  
**완료 (KST):** 2026-10-14T22:45:44.062+09:00  
**실제 심층검수:** 23.2분 (20분 이상). **중간보고:** 22:32 및 22:39 KST.

## 공식 연속 상태
- 마지막 완료 블록 **2-8-254**. 다음 시작 블록 **2-8-255**.
- 독립 신규 제품 결함 **1종**. 공식 누적 **536 → 537종**.
- `qa-2-8` 검수 브랜치에서만 `index.html` 수정. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변.
- SQL/운영 배포/`APP_VERSION` 변경 없음, `ver20260927-0944`.

## 신규 결함: 공유 세션 변경 확인창을 취소한 직후 이전 토큰 RPC 발신 경쟁
- `scheduleSharedSessionReload`에서 유일하게 남은 직접 `if(!confirm(...))`은 네이티브 대화창 반환 후 `markNativeDialogReturn()`을 호출하지 않음. Chrome의 cross-renderer `localStorage` 가시성 지연 중 사용자가 기존 편집 내용을 저장하면 폐기된 로그인 토큰으로 보호 쓰기 RPC가 나갈 수 있음.
- **RED 실 Chromium** [#38572152898](https://github.com/eco-i/eco-i.github.io/actions/runs/38572152898): 세션 삭제 테스트에서 `save_my_memo_v2`가 이전 토큰으로 전송됨. **15 PASS, 1 FAIL**. 비동기 응답 처리에서 `SHARED_SESSION_CHANGED`를 던지더라도 요청 자체는 이미 나간 점이 핵심.
- 앱 수정: 직접 confirm 결과를 `switchNow`에 받고, 반환 즉시 `markNativeDialogReturn()` 호출. 이후 기존 확인/취소·deferred 로직 그대로. **단 1개 지점, 3줄 추가/1줄 삭제**, UTF-8 **+65바이트**.
- **GREEN** [#38573327790](https://github.com/eco-i/eco-i.github.io/actions/runs/38573327790) 16/0, 동일 이슈 취소 모달 8회×4종 반복 [#38573244291](https://github.com/eco-i/eco-i.github.io/actions/runs/38573244291) **128/0**, 안전한 정상 deferred 저장 대조 포함.
- 추가 **18 Chromium 컨텍스트 native 사진 교차탭 스트레스 72/0** 통과.

## 8단계 전수 및 독립 회귀
- **214개 전계층 검사 × 4회 모두 214 PASS / 0 FAIL, 동일 final SHA**: [#38573028764](https://github.com/eco-i/eco-i.github.io/actions/runs/38573028764), [#38573575362](https://github.com/eco-i/eco-i.github.io/actions/runs/38573575362), [#38573933390](https://github.com/eco-i/eco-i.github.io/actions/runs/38573933390), [#38573941015](https://github.com/eco-i/eco-i.github.io/actions/runs/38573941015).
- PC/모바일 토큰 범위 + tombstone **648상태** PASS: [#38571923751](https://github.com/eco-i/eco-i.github.io/actions/runs/38571923751).
- 새로운 근무표/연가 계산 정량 테스트: 2026~2027년 A/B/C/D/일근, 주2, 야간 22:00~익일08:00, 00:00~08:00, 중복연가, 병가 조건, 휴/비, 2026년 9월12일 기점 및 2027 전년 등 **PC 17,010 + 모바일 17,010 = 34,020 검증, 모두 통과**: [#38573341080](https://github.com/eco-i/eco-i.github.io/actions/runs/38573341080).
- 실제 사진 FileList 단일 업로드/중복 및 cancel **12/0**, JPEG 변환/크기·투명도·비정상 파일 **24/0**, 관리자 UI 권한회수 **16/0**, cold boot·할당량 **19/0**, native cross-tab **72/0**, handoff **16/0**: [#38573327790](https://github.com/eco-i/eco-i.github.io/actions/runs/38573327790).
- SHA/HTML 인라인 JS 2개 구문, 457 고유 DOM ID, 명시 RPC 75종 인증 경계 및 정확한 1개 패치 **21/0**: [#38573488452](https://github.com/eco-i/eco-i.github.io/actions/runs/38573488452).

## 소스 해시/불변 조건
| 아티팩트 | SHA-256 | UTF-8 바이트 | Git blob |
|---|---|---:|---|
| `qa-handoff/index.before-2-8-254.html` | `32379ce57e0d5dac03686b82fa4b2c78c9427473cb1d35dda47dc41fce250aeb` | 1,174,027 | `f530e495859f46f0eaa669acdbc8e7a3f6907bdf` |
| `qa-handoff/index.working-2-8-254.html` | `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b` | 1,174,092 | `5e0de9676d1a0f71054c790927efbd4f4a67762b` |
| QA `index.html` | `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b` | 1,174,092 | `5e0de9676d1a0f71054c790927efbd4f4a67762b` |
| 다음 불변 `qa-handoff/index.before-2-8-255.html` | `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b` | 1,174,092 | `5e0de9676d1a0f71054c790927efbd4f4a67762b` |

[SHA 계산 실증 #38572929097](https://github.com/eco-i/eco-i.github.io/actions/runs/38572929097)에서 3줄 추가/1줄 삭제 원본 비교 확인.

## 하네스 실패와 제품 결함 구별
- [#38571700298](https://github.com/eco-i/eco-i.github.io/actions/runs/38571700298): 독립 연가 하네스에서 `00:00~08:00` 테스트용 레코드가 실제로는 종일 부재로 남아 있던 입력 오류. `absence_mode:'time'`로 정정해 전수 34,020 GREEN. 제품 결함 미산입.
- [#38572643299](https://github.com/eco-i/eco-i.github.io/actions/runs/38572643299): 수정 전 SHA를 pin한 회귀기 기대값 불일치. 후보 SHA 고정 갱신 후 통과.
- [#38573566107](https://github.com/eco-i/eco-i.github.io/actions/runs/38573566107): 동시 탭 자동 재진입에 의해 테스트기 `page.evaluate` 문맥 파괴 (진행된 188 검사는 PASS). 동일 최종 SHA를 가진 별개 Chromium 작업에서 214/0의 전체 완주 4회 확보. 해당 건 제품 결함으로 오계상하지 않음.

## 미검증 범위 및 차기
실제 Chromium PC·모바일 에뮬레이션, OS native confirm, 두 탭 및 로컬 파일입력 사용. RPC는 모의 응답이므로 운영 Supabase/RLS·인증 다중사용자, 실제 스마트폰 카메라/파일 선택, iOS Safari, persisted BFCache, 운영 백업/복원은 직접 확인하지 못함.

**다음 블록 2-8-255**. 불변 시작본 `qa-handoff/index.before-2-8-255.html`. High·깊이8, 블록 최소20분 실제 검수, 20분 안 KST 중간보고, 결함 즉시 수정과 반복 회귀, ZIP 없음.
