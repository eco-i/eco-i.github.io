# 근무모아 2-8-241 중간 검수 인계 (공식 미완료)
- 검수: 2차·깊이8·High. **기존 공식 완료 240**, 다음 진행 중 241. **공식 누적 제품 결함 516종 유지**. 242를 아직 시작하지 않는다.
- 출발 시각: 2026-10-12 19:25:29 KST. 최소 20분 실제 검수 및 20분 이내 중간 보고 원칙.
- GitHub QA 브랜치 `qa-2-8`. 운영 `main`·배포·SQL·APP_VERSION `ver20260927-0944` 일절 수정 안 함.
- 241 공식 불변 시작본 `qa-handoff/index.before-2-8-241.html` SHA-256 `53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34`, 1,164,815 bytes.
- **새 제품 결함 잠정 1종**: 공유 로그인 A의 로그아웃 suppression 마커가 있는데 Web Locks 미지원/백그라운드 storage 이벤트 미수신으로 localStorage의 A 자체가 남은 경우, 살아 있는 탭의 adminUnlockMatches, sharedPersistentSessionMismatch, fingerprintBlockingPromptSessionSnapshot, fingerprintCurrentSharedSessionMismatch, sessionContextCurrent 및 사전 RPC 가드가 A를 유효하다고 오인.
- 결함을 실제 Chromium에서 재현한 [#38236470791](https://github.com/eco-i/eco-i.github.io/actions/runs/38236470791): `stored='',shared=A,suppressed=A,activeAdmin=true,owner=false,sensitive=false,snapshot=shared,sessionContext=true,mutationDenied=false,backupDenied=false,readDenied=false`.
- 수정: `storedSessionTombstoned(token)`의 최초 구간에서 정확히 같은 토큰의 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY`를 즉시 폐기 판정. 기존 모든 동기 인증/관리자 소유권 검사가 동일 helper를 호출하므로 확대 차단. 저장/배포 경로는 건드리지 않음.
- 수정된 QA 후보 `index.html` + `qa-handoff/index.working-2-8-241.html` SHA-256 `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`, 1,165,130 bytes. 241 최초 기준 파일 불변.
- **현재 Chromium 회귀 [#38236923169](https://github.com/eco-i/eco-i.github.io/actions/runs/38236923169): 187 PASS / 0 FAIL**. old A의 관리자/UI/RPC 가드 차단 및 독립 PC 탭 B 유지, 새로운 모바일 공유 로그인 C·2차 관리자 unlock 보존.
- 후속 실제 4탭 suppression fanout 확장 회귀 수행 중. 실제 완료 판정 전에 적어도 2번 전체회귀 PASS + 20분 실제검수, 원본·후보 정확한 바이트 비교, 공식 보고서·증거·매니페스트·242 시작본 필요.
- 제품 결함 / 검수 하네스 오류 / 미검증 운영환경을 별도로 기록. 실 운영 Supabase RLS, 실제 인증 멀티유저, 물리 Android 사진 선택/카메라, iOS, BFCache persisted, 실 백업복원 미검증.

## 2026-10-12 19:44 KST 추가 검수 결과
- 고정 후보 SHA-256 `1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5`, **1,165,130 bytes**, QA 루트 `index.html`과 후보 원본 Git blob 일치.
- 코드 직접 감사: 240 원본에서 `storedSessionTombstoned`의 정확히 **1곳 소스 치환**을 적용한 문자열이 241 완료 후보 HTML 전체와 정확히 일치.
- Chrome 최종 독립 회귀 [38237417756](https://github.com/eco-i/eco-i.github.io/actions/runs/38237417756), [38237595145](https://github.com/eco-i/eco-i.github.io/actions/runs/38237595145) **각 194 PASS / 0 FAIL**, 각각 후보 SHA 동일. 4탭 실제 suppression event, no-Web-Locks 새로고침, PC 독립/동일 토큰, 새 모바일 로그인 확인.
- GitHub 비교 `30c691891fc9f3b3d515db4d2c65f1edabb1818d...qa-2-8`: 241 관련 변경 파일 11개 중 SQL 0개, 제품 `index.html` 변경은 4행 추가만. `main` 배포 변동 없음.
- `qa-handoff/QA_241_FINALIZE.cjs` 및 전용 사전검증 workflow 준비. [finalize preflight #38237932223](https://github.com/eco-i/eco-i.github.io/actions/runs/38237932223) 통과. **공식 CURRENT_STATE는 아직 240 완료 / 누적 516종**으로 유지해야 함.
- **19:46 KST 이전에는 공식 완료 금지**(블록 최소20분 실검수). 공식 보고서 및 242 시작본은 최종화 workflow가 SHA·시간·기존 상태를 다시 확인한 뒤 기록.
