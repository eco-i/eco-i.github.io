# 근무모아 2차·깊이8 — 2-8-258 공식 완료 보고

**검수 시작 KST:** 2026-10-15 11:01:05  
**공식 검수 완료 KST:** 2026-10-15 11:22:03  
**실제 검수 시간:** 20분 58초 (최소 20분 충족). KST 진행 보고 11:05, 11:06, 11:13, 11:14, 11:16, 11:18, 11:20, 11:21.  
**High 지침 / 2차 / 깊이 8단계 고정.**

## 공식 연속 기록
- 이전 완료 **2-8-257**, 이번 **2-8-258 완료**, 다음 **2-8-259**.
- 이번 신규 독립 제품 결함 **1종**, 공식 누적 **539 → 540종**.
- 작업 브랜치 `eco-i/eco-i.github.io:qa-2-8`만 수정. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경/실배포/APP_VERSION 변경 없음. `APP_VERSION=ver20260927-0944`.

## 신규 제품 결함 1종 — 복원 파일 비동기 처리 중 다른 탭의 세션 변경을 수신하기 전 미리보기 RPC 출발
- PC/모바일 Chrome 2탭에서 한 탭의 `localStorage` 로그아웃 제거·교체가 완료됐더라도 다른 탭의 저장소 값이 직후 수십 ms 동안 옛 값으로 관측될 수 있음. 개인·관리자 `prepare*DataRestore`가 `await file.text()` 이후 즉시 `stillCurrent` 및 `dataRestorePickerContextStillCurrent`를 체크하고 서버 `preview_data_restore_v2`를 호출하여 해당 가시성 지연 구간에 낡은 세션 요청을 허용할 수 있었음.
- 실제 원본 **RED** [#38668983587](https://github.com/eco-i/eco-i.github.io/actions/runs/38668983587): 256 inherited restore-race **39 PASS / 1 FAIL**, desktop shared token remove 직후 preview RPC 호출. 독립 동일 원인 반복 [#38669216746](https://github.com/eco-i/eco-i.github.io/actions/runs/38669216746): 12실행 중 1회 실패. 두 실패는 같은 독립 원인 한 종으로 계상.
- [가시성 진단 #38669318057](https://github.com/eco-i/eco-i.github.io/actions/runs/38669318057): 48개 2탭 관측 중 7회 현 탭에 기존 shared token이 잠시 잔존, 해당 구간 old-token preview RPC 1회 재현. 이미 새로운 토큰을 관측한 상태에서의 비정상 전송은 미확인. 실제 운영 Supabase/RLS 접근·데이터 누출/복원 성공은 **검증하거나 주장하지 않음**.
- 수정: `qa-handoff/index.working-2-8-258.html`의 개인/관리자 `prepare*DataRestore` 양쪽 `await file.text()` 직후 **220ms 짧은 전달 안정화 대기**를 둔 다음 기존 세션 epoch·shared 소유권·page lifecycle 점검 재실행. 불필요한 서버 preview 요청의 창을 축소하는 방어 보강이며 브라우저/운영 서버의 모든 극단적 지연을 절대적으로 보장하는 것은 아님.
- [실제 변경 범위/독립 무결성 #38669846503](https://github.com/eco-i/eco-i.github.io/actions/runs/38669846503): **13 PASS/0 FAIL**, 원본을 수정 후보에서 정확히 복원하는 2군데 외 제품 코드 불변; UTF8 +522 bytes; 2개 inline JS 정상, DOM ID 457, RPC명 71, 버전 고정.
- **GREEN** [#38669593228](https://github.com/eco-i/eco-i.github.io/actions/runs/38669593228): 복원 세션 경합 **14회 × 40 = 560 PASS/0 FAIL**, 개인·관리자 restore guard **각 100 PASS**. 추가 [#38669681084](https://github.com/eco-i/eco-i.github.io/actions/runs/38669681084)에서도 복원 14회 및 프런트/전체 회귀 통과.
- [독립 통제 RED→GREEN #38670140217](https://github.com/eco-i/eco-i.github.io/actions/runs/38670140217): Chrome에 교차 렌더러 저장소 가시성 지연 140ms를 적용한 PC/모바일 × 개인/관리자 × 삭제/교체 총 **16/0**, 원본 8개 RED 재현 / 수정본 8개 GREEN 차단.

## 전체 8단계 기능·보안 회귀
- [QA 수정본 전체 #38669681084](https://github.com/eco-i/eco-i.github.io/actions/runs/38669681084): Full, Backend/edge, Frontend **3 Job 전부 success**. Chromium 전체 **214 PASS/0 FAIL**. 백업 구조 **6,144**, 독립 codec fuzz **16,384**, 세션·tombstone **648**, 근무달력/연가 2026~2027 **34,020**. native confirm **16**, 2탭 stress **128**, picker **12**, 사진 stress **72**, 이미지 **24**, cold boot **19**, 관리자 UI **16** = frontend **287 PASS/0 FAIL**.
- 새로운 [HTML/사용자 문자열 삽입 방어 #38668948405](https://github.com/eco-i/eco-i.github.io/actions/runs/38668948405): PC·모바일 사내일정, 근무자, 백업 파일명, 백업 만든 사람 이름의 특수 HTML/스크립트 문자열 **92 PASS/0 FAIL**. 같은 QA 수정본에서도 92/0.
- 새로운 [실제 브라우저 백업 다운로드→JSON 읽기/복원 #38669122742](https://github.com/eco-i/eco-i.github.io/actions/runs/38669122742): 한국어·한자·이모지·HTML 텍스트가 보존된 개인/관리자 백업 **22 PASS/0 FAIL**, 수정 후보 회귀도 통과.
- QA 수정본에서도 RPC 응답 계약 **184/0**, 한국 자정/연말 및 타임존 **72/0**, 변형 백업 유효성/원형 방어 유지.
- [원본 19분 반복 #38668796571](https://github.com/eco-i/eco-i.github.io/actions/runs/38668796571): **1,148초**, **14회차**, **196개 스위트 실행 모두 성공**. 이 실행 성공은 앞선 원본 간헐적 RED를 부정하는 근거가 아님.
- [QA 수정본 9분 반복 #38669769440](https://github.com/eco-i/eco-i.github.io/actions/runs/38669769440): **547초**, **7회차**, **70개 스위트 실행 모두 성공** (Full Chrome, 백업, scope, 연가, 세션, picker, 콘텐츠 안전, RPC와 자정).
- 초기 [#38669593228](https://github.com/eco-i/eco-i.github.io/actions/runs/38669593228) Full Job 실패는 candidate 새 파일크기 1,175,136 대신 이전 1,174,614 byte를 기대하는 **QA 테스트 하네스의 고정 크기 오류**. `QA_258_ADAPT.cjs`의 새 용량 반영 후 [#38669681084](https://github.com/eco-i/eco-i.github.io/actions/runs/38669681084) 전체 통과. 통제 지연 테스트 최초 [#38670077283](https://github.com/eco-i/eco-i.github.io/actions/runs/38670077283)는 앱 bootstrap이 완료되기 전에 `state`를 덮어쓴 fixture 오류; 300ms bootstrap 안정화 후 [#38670140217](https://github.com/eco-i/eco-i.github.io/actions/runs/38670140217) **16/0**. 둘 다 제품 결함 별도 집계하지 않음.

## SHA·무결성
| 대상 | SHA-256 | UTF8 bytes | Git blob |
|---|---|---:|---|
| 이전 공식/불변 `qa-handoff/index.before-2-8-258.html` | `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9` | 1,174,614 | `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3` |
| QA 최종 `qa-handoff/index.working-2-8-258.html` | `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` | 1,175,136 | `7077d4c27abf1b847471e32f462df0efd7cbd08f` |
| `index.html` (qa-2-8만) | `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` | 1,175,136 | `7077d4c27abf1b847471e32f462df0efd7cbd08f` |
| 다음 시작 `qa-handoff/index.before-2-8-259.html` | `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af` | 1,175,136 | `7077d4c27abf1b847471e32f462df0efd7cbd08f` |

## 미검증 범위
실 headless Chrome PC·mobile 에뮬레이션, 2탭, 원시 native UI/dialog/file input, 모의 RPC. **운영 Supabase/RLS 진짜 다중계정, 물리 Android 카메라, iOS Safari, 지속 BFCache, 운영 DB 백업·복원 직접 테스트는 하지 못함.** 더 엄격한 보안 보증이나 실운영 데이터 누출 입증은 본 검수 범위 외.

**다음은 2-8-259.** High·깊이8, 실제20분 이상, 20분 내 KST 중간보고, 결함 즉시 수정+RED/GREEN+독립 회귀, ZIP 제공 요구 금지, 운영 `main`/SQL/APP_VERSION 임의 변경·배포 금지, 상세 기록 GitHub 저장.
