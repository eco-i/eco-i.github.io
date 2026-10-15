# 근무모아 2차·깊이8 — 2-8-256 공식 완료 보고

**KST 시작:** 2026-10-15T09:36:11.567+09:00  
**KST 완료:** 2026-10-15T09:58:05.250+09:00  
**실제 8단계 검수:** 21.9분 (최소 20분 준수). 중간 보고 09:44, 09:47, 09:52, 09:54, 09:55, 09:57 KST.

## 공식 연속 상태
- 마지막 유효 완료 **2-8-256**, 다음 **2-8-257**.
- 신규 독립 제품 결함 **1종**, 공식 누적 **538 → 539종**.
- QA GitHub `eco-i/eco-i.github.io`, 검수 `qa-2-8`. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 유지. SQL·실배포·버전 파일 변경 없음; APP_VERSION `ver20260927-0944`.

## 1. 신규 독립 제품 결함 1종 — 백업 파일 버전 JSON 형식 자동 변환
- 원인: `parseDataBackupText`의 `Number(payload.backup_schema_version)!==1` 조건이 서버가 발급하지 않는 JSON 문자열 `"1"`, 불리언 `true`, 배열 `[1]`, 문자열 `"1e0"` 등을 버전 1로 자동 변환해 받아들임. 반면 정식 백업 export의 `strictDataExportRpc` 계약은 **JSON 숫자 1만** 허용.
- 영향: 부적합 백업 파일이 브라우저 초기 검증을 우회해 불필요하게 인증된 복원 미리보기 RPC로 넘어갈 가능성. 서버에서 실제 복원 성공, 원본 데이터 손상 또는 RLS 우회가 발생했다는 주장은 아님.
- **RED 실 PC/모바일 Chromium** [#38661163899](https://github.com/eco-i/eco-i.github.io/actions/runs/38661163899): 42 PASS/28 FAIL. 28개 실패는 모두 같은 제품 원인, **1종으로 계상**.
- QA 코드 수정: 단 한 줄 `payload.backup_schema_version!==1`로 엄격 비교. 숫자 2 이상인 경우에만 '새 버전' 안내 유지. 원본 대비 **1줄 변경, UTF-8 +33 bytes**, 다른 제품 코드 불변.
- **GREEN** [#38661329330](https://github.com/eco-i/eco-i.github.io/actions/runs/38661329330): **70 PASS / 0 FAIL**. 정상 버전 1 개인·관리자 백업 유지. 잘못된 숫자형·문자열·불리언·배열·누락 버전 차단.
- 복원 화면의 서버 요청 차단 실제 Chrome: **개인 100/0** [#38662267283](https://github.com/eco-i/eco-i.github.io/actions/runs/38662267283), **관리자 100/0** [#38662362464](https://github.com/eco-i/eco-i.github.io/actions/runs/38662362464); File.text 비동기 읽기 중 세션 교체/삭제, 정상 대조 포함.

## 2. 깊이8 실제 실행 및 독립 회귀
- **전체 Chromium 214 PASS/0 FAIL ×5** 동일 최종 SHA: [#38661339218](https://github.com/eco-i/eco-i.github.io/actions/runs/38661339218), [#38661833780](https://github.com/eco-i/eco-i.github.io/actions/runs/38661833780), [#38661838720](https://github.com/eco-i/eco-i.github.io/actions/runs/38661838720), [#38661844430](https://github.com/eco-i/eco-i.github.io/actions/runs/38661844430), [#38662807827](https://github.com/eco-i/eco-i.github.io/actions/runs/38662807827). 로그인 Web Locks·세션 폐기, 개인정보, 관리자 권한, 연가, 다중 탭, native UI, 이미지 업로드 경계, PC/모바일 및 반복 기동 등.
- 전수 백업 구조/항목 속성 **6,144 PASS** [#38661609876](https://github.com/eco-i/eco-i.github.io/actions/runs/38661609876); 독립 랜덤 백업 스키마 형식/범위/섹션/data 키 **16,384 PASS** [#38662095917](https://github.com/eco-i/eco-i.github.io/actions/runs/38662095917).
- 비동기 복원 파일 File.text 중 세션 취소·교체 **40 PASS**, PC·모바일 세션 scope/logout tombstone **648 PASS**, 2026~2027 4개 교대조 및 일근/주2, 야간 익일, 휴/비, 연가겹침 **34,020 PASS**: [#38661609876](https://github.com/eco-i/eco-i.github.io/actions/runs/38661609876).
- PC/모바일 native confirm handoff **16 PASS**, 반복 stress **128 PASS**, 실제 사진 picker **12 PASS**, 네이티브 사진 session stress **72 PASS**, 파일/JPEG **24 PASS**, cold boot **19 PASS**, 관리자 UI **16 PASS**, 총 **287 PASS/0 FAIL**: [#38661791167](https://github.com/eco-i/eco-i.github.io/actions/runs/38661791167).
- 75개 RPC명, 457개 중복 없는 DOM ID, 2개 inline JS 구문, 앱 패치 범위·권한 guard·비교 해시 **24 PASS** [#38662503423](https://github.com/eco-i/eco-i.github.io/actions/runs/38662503423).
- QA `index.html` 반영 후 PC/모바일 실제 Chrome 기동/버전/backup input/DOM **56 PASS** [#38662594315](https://github.com/eco-i/eco-i.github.io/actions/runs/38662594315); 원본·QA working·QA index·다음 257 시작 본 **5 PASS** [#38662712348](https://github.com/eco-i/eco-i.github.io/actions/runs/38662712348).

## 3. 데이터 무결성
| 아티팩트 | SHA-256 | UTF-8 바이트 | Git blob |
|---|---|---:|---|
| `qa-handoff/index.before-2-8-256.html` (원본) | `b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2` | 1,174,581 | `d8ff52e793ac1fe49b8fc473a2ba432b4ac60798` |
| `qa-handoff/index.working-2-8-256.html` | `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9` | 1,174,614 | `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3` |
| QA 브랜치 `index.html` | `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9` | 1,174,614 | `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3` |
| 다음 불변 `qa-handoff/index.before-2-8-257.html` | `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9` | 1,174,614 | `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3` |

실제 GitHub Actions SHA/numstat [#38661275506](https://github.com/eco-i/eco-i.github.io/actions/runs/38661275506) (**1줄 추가/1줄 삭제**), 최종 독립 4파일 체인 [#38662712348](https://github.com/eco-i/eco-i.github.io/actions/runs/38662712348) 검증. `main` 또는 SQL 파일 수정 없음.

## 4. 잘못된 검수 하네스 오류와 구별
- [#38661251758](https://github.com/eco-i/eco-i.github.io/actions/runs/38661251758): 제품 소스 패치 직후 이전 SHA 고정 기대값으로 실행한 구형 테스트 실패. 새 SHA/바이트 반영 후 전체 회귀 214/0 ×5.
- [#38661616929](https://github.com/eco-i/eco-i.github.io/actions/runs/38661616929): native handoff stress 하네스가 이전 블록 HTML을 읽어 SHA 불일치. 정확한 256 candidate 파일 경로로 변경 후 프런트엔드 7개 묶음 전부 PASS.
- 위 두 항목을 독립 제품 결함으로 중복 계상하지 않음.

## 5. 환경 제한, 다음 단계
현실의 Chromium PC 및 모바일 에뮬레이션, 2탭, native confirm, FileList는 실행했지만, 운영 Supabase/RLS/실제 계정 다중접속, 물리 Android 카메라/Picker, iOS Safari, 지속 BFCache, 실DB 백업/복원은 확인하지 못함.

**다음 블록 2-8-257.** 불변 시작본 `qa-handoff/index.before-2-8-257.html`. High·깊이8, 블록 실제20분 이상, KST 20분 내 중간보고, 결함 발견 시 즉시 수정·RED→GREEN·독립 회귀, 운영 브랜치/SQL/APP_VERSION/실배포 무단 변경 없음, ZIP 금지.
