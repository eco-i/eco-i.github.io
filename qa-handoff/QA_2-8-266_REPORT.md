# 근무모아 2차·깊이8 공식 QA — 2-8-266 COMPLETE / CLEAN

**공식 판정:** 2-8-266 완료, 다음 2-8-267. 신규 확인 제품 결함 0종; 공식 누적 결함 540종.
검수: High·깊이8, 실제 Chromium PC/mobile emulation, stubbed RPC, 이전 제품 HTML 수정 없음.

## 실행 및 증빙
- [전체 본검수 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38722557451): Full·Backend·Frontend·Independent·Integrity·Depth-eight **6 Jobs SUCCESS**. 실행 2026-10-15 19:45:47~20:06:58 KST.
- **실제 장시간 지속검수 1,257초(20분57초)**: 2026-10-15 **19:45:59~20:06:55 KST**, **8 rounds × 23 기존 회귀 스위트 = 184 묶음 PASS, 실패 0**. 각 회차 266 전용 브라우저 세션 폐기 방어 검사도 반복 수행.
- 신규 266 독립 Chrome 계정 세션 폐기 표식·복원 권한 보호 **60 PASS/0 FAIL**, 6개 환경.
- 신규 지문 기록 RPC 계약 [독립 검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38723208259): 날짜(윤년/허위 날짜)·중복 날짜·출퇴근 사진/확인 상태 불일치·타임스탬프 오류 검증 **156 PASS/0 FAIL**, 6개 환경.
- 2026~2027년 근무패턴·대정비·연도 전환 독립 **30,606 PASS/0 FAIL** (6개 환경). 24개월 달력/모바일/저장소 권한 제한 **1,401 PASS/0 FAIL**. 시간대/KST 자정·2026-10-15 종료 경계 **765 PASS/0 FAIL**. 소스·QA 인계 SHA/버전 **21 PASS/0 FAIL**.
- [과거 8개 QA 계약 교차 회귀](https://github.com/eco-i/eco-i.github.io/actions/runs/38722568171): **20,301 PASS/0 FAIL**. 로그인, 730일 교대, 공휴일 대휴, 연차, 접근성, 글씨 확대, 2027 절기, 브라우저 경계.
- [다중탭 RED/GREEN 및 복원 경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38722562566): **80+480=560 PASS/0 FAIL**.
- [실사용 로그아웃 프로토콜 4개 병렬 Job](https://github.com/eco-i/eco-i.github.io/actions/runs/38722623946): **4 shards × 4 rounds × 40 = 640 PASS/0 FAIL**.
- 테스트 수는 서로 중복되는 검사 실행 횟수이며 신규 제품 결함 수와 다르다.

## 265부터 이어진 검수 예외의 처리
- 265 레거시 테스트에서 간헐 재현된 **원시 localStorage SESSION_KEY 직접 삭제**는 실제 앱 로그아웃과 달리 해당 세션의 폐기 표식을 기록하지 않았다. 해당 관측 증거는 265 공식 보고서에 보존한다.
- 266 어댑터는 기존 원본 테스트를 보존하면서 **실제 제품 로그아웃의 exact-token tombstone 기록 후 키 제거** 순서로 모의한다. 임의로 RAW 키만 직접 삭제하는 외부/비정상 조건의 모든 경우를 검증했다고 해석하지 않는다.
- 266에서는 인증 폐기 표식이 유지된 경우의 stale token 재유입/복원 거부를 별도 60건 검사했고 PASS. 미검증 조건의 제품 무결함을 보증하지 않는다.

## 형상관리
- `index.html`, `qa-handoff/index.before-2-8-266.html`, `qa-handoff/index.working-2-8-266.html`, `qa-handoff/index.before-2-8-267.html` 모두 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- 제품 HTML/SQL 변경 없음, 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, APP_VERSION `ver20260927-0944` 유지, 운영 배포 안 함. qa-2-8에는 QA 시험 코드·증빙·인계만 저장.

## 실제 운영 환경 미검증
실운영 Supabase 인증/RLS 다중계정, 물리 Android 카메라/OS 파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원은 직접 검증하지 않았다.

## 다음
2-8-267 시작 `qa-handoff/index.before-2-8-267.html`; High·깊이8·실제 20분+·20분 이내 KST 중간보고·제품 결함 발견 즉시 수정/RED-GREEN 회귀. ZIP 금지, main/SQL/APP_VERSION/운영 배포 무단 변경 금지.
