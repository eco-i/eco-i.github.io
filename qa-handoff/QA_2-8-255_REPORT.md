# 근무모아 2차 · 깊이 8 — 2-8-255 공식 완료 보고

**시작 (KST):** 2026-10-14T23:26:38.698+09:00  
**공식 완료 (KST):** 2026-10-14T23:48:46.686+09:00  
**실제 심층검수:** 22.1분 (최소 20분 준수), 중간보고 23:34 및 23:45 KST.

## 공식 상태
- 완료 블록 **2-8-255**, 다음 시작 **2-8-256**, 누적 독립 제품 결함 **537 → 538종**, 이번 블록 신규 독립 결함 **1종**.
- 검수 브랜치 `qa-2-8`만 수정. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로.
- APP_VERSION 및 `version.json` **ver20260927-0944**, SQL 변경·실배포 **없음**.

## 신규 제품 결함 1종 — 백업 JSON 구조의 브라우저 1차 검증 누락
`parseDataBackupText`는 형식·범위·버전과 `included_sections`의 배열 여부, `data`의 넓은 object 유형만 확인했습니다. 그 결과 (1) JSON `data:[]`, (2) `included_sections` 중복, (3) 허용되지 않은 항목 이름, (4) `included_sections`와 `data` 키 목록 불일치를 즉시 거절하지 않고 서버 복원 미리보기 검사를 시도할 수 있었습니다. **클라이언트 입력 사전검증 결함**으로 분류합니다. 실제 운영 서버에서 이 파일로 복원이 성공한다는 의미는 아니며 데이터 손상은 실증되지 않았습니다.

- 실제 PC·모바일 Chromium **RED** [#38580989397](https://github.com/eco-i/eco-i.github.io/actions/runs/38580989397): **62 PASS / 6 FAIL**. 세 실패 유형이 PC·모바일 양쪽에서 동일하게 재현됨.
- 검수 HTML 한 영역만 수정: `data`가 배열인지 검사하고, `dataRpcExactSections`로 허용 항목/중복을 검증하고, `data`의 정확한 키 집합이 항목 목록과 일치하도록 차단. 기존 성공 백업 형식·서버 RPC 계약·확인 절차 유지. **5줄 추가/1줄 삭제**, UTF-8 +489 bytes.
- 동일 검사 **GREEN** [#38581443453](https://github.com/eco-i/eco-i.github.io/actions/runs/38581443453): **68 PASS / 0 FAIL**.
- 관리자 및 개인 백업의 유효/누락/중복/추가/범위 오류 조합 **6,144개 PASS**: [#38582937742](https://github.com/eco-i/eco-i.github.io/actions/runs/38582937742). 정상 생성 백업이 잘못 거부되지 않는지 포함.
- 파일 `text()` 비동기 읽기 도중 교차 탭 세션 삭제·교체, 정상 대조군, 부적합 백업 서버 미전송 **40/0**, 실제 2탭 PC·모바일: [#38582082351](https://github.com/eco-i/eco-i.github.io/actions/runs/38582082351).

## 심층 검수/회귀 결과
- **동일 최종 SHA**로 8계층 Chromium 전체 **214 PASS/0 FAIL ×4**: [#38581432518](https://github.com/eco-i/eco-i.github.io/actions/runs/38581432518), [#38582233897](https://github.com/eco-i/eco-i.github.io/actions/runs/38582233897), [#38582248326](https://github.com/eco-i/eco-i.github.io/actions/runs/38582248326), [#38582260642](https://github.com/eco-i/eco-i.github.io/actions/runs/38582260642).
- PC/모바일 세션 소유권 조합 324 + 로그아웃 tombstone 324 = **648** PASS: [#38582604180](https://github.com/eco-i/eco-i.github.io/actions/runs/38582604180).
- 네이티브 전환 확인창, 실제 사진 FileList·취소·중복 이벤트 검사 **16+12=28/0**: [#38581792459](https://github.com/eco-i/eco-i.github.io/actions/runs/38581792459).
- 2026~2027년 A/B/C/D/일근 야간~익일, 연가·교대·휴/비·중복 시간창 합계 **PC 17,010 + 모바일 17,010 = 34,020 PASS**: [#38582455474](https://github.com/eco-i/eco-i.github.io/actions/runs/38582455474).
- 인라인 JS 2개 파싱, 고유 DOM ID 457개, RPC 목록 75개 및 접근제어, 두 SHA, 백업 파일 parser 수정 범위 **23/0**: [#38582726686](https://github.com/eco-i/eco-i.github.io/actions/runs/38582726686).
- 불변/수정 SHA 및 변경 줄수/바이트수: [#38581313705](https://github.com/eco-i/eco-i.github.io/actions/runs/38581313705).

## 공식 기준본
| 파일 | SHA-256 | bytes | Git blob |
|---|---|---:|---|
| `qa-handoff/index.before-2-8-255.html` (원본) | `056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b` | 1,174,092 | `5e0de9676d1a0f71054c790927efbd4f4a67762b` |
| `qa-handoff/index.working-2-8-255.html` | `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2` | 1,174,581 | `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798` |
| QA `index.html` | `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2` | 1,174,581 | `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798` |
| `qa-handoff/index.before-2-8-256.html` (다음 시작 불변) | `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2` | 1,174,581 | `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798` |

## 검수 하네스 실패와 제품 결함 구별
- [#38581253505](https://github.com/eco-i/eco-i.github.io/actions/runs/38581253505)는 파일 변경 후 기존 검수기의 이전 SHA 기대값이 남아 있던 문제. 테스트 SHA/바이트 조건을 맞춘 후 전체 214/0 ×4 성공.
- [#38582361408](https://github.com/eco-i/eco-i.github.io/actions/runs/38582361408)는 247 시점 기준 SHA가 255차 재사용 스크립트에 남은 테스트 하네스 문제. 최신 SHA로 정정 후 648 상태 PASS. 두 문제를 독립 제품 결함에 포함하지 않음.

## 검수 환경 한계와 다음 단계
실제 headless Chrome (PC/모바일 에뮬레이션), 파일 선택 및 2탭 로컬 저장소 테스트. 백엔드 요청은 모의 상태이며 운영 Supabase SQL/RLS, 물리 모바일 카메라, iOS Safari, 실사용자 인증 다중접속, persisted BFCache, 운영 DB 백업·복원은 직접 검증하지 못했습니다.

**다음 2-8-256**. `qa-handoff/index.before-2-8-256.html`에서만 시작. High·깊이8 유지, 블록당 최소20분 실제검수, 20분 이내 KST 중간보고, 결함 즉시 수정·회귀, ZIP 제안 금지.
