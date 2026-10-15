# ★★★근무모아 2차·깊이 8단계 — 2-8-260 공식 완료 (CLEAN)

**검수 시작:** 2026-10-15 13:00:36 KST  
**검수 완료:** 2026-10-15 13:21:07 KST  
**실제 검수 시간:** 20분 31초(1,231초), High·깊이8 고정. 20분 이내 KST 중간보고 준수.

## 공식 결과
- 마지막 공식 완료 **2-8-260**, 다음 시작 **2-8-261**.
- 신규 독립 제품 결함 **0종(CLEAN)**. 공식 누적 제품 결함 **540종 유지**.
- 저장소 `eco-i/eco-i.github.io`, 검수 브랜치 `qa-2-8`에서만 검수 증빙·테스트 파일·동일원본 작업본 업데이트.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL 변경 없음, 운영 배포 없음, `APP_VERSION` **`ver20260927-0944`** 고정.
- QA `index.html`, `qa-handoff/index.before-2-8-260.html`, `qa-handoff/index.working-2-8-260.html`, 다음 불변 `qa-handoff/index.before-2-8-261.html` **전부 동일 바이트**. SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, UTF-8 1,175,136 bytes, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`.

## 전체 8단계 완전 회귀
- [병렬 전체 Full/Backend/Frontend](https://github.com/eco-i/eco-i.github.io/actions/runs/38679584146) 세 Job **전부 성공**. Full real Chromium **214 PASS/0 FAIL**; edge/backup parser **3,171/0**, RPC 계약 **184/0**, 한국시간 자정·연말 **72/0**, HTML 문자열 삽입 **92/0**, native 브라우저 백업 파일다운로드·JSON 왕복 **22/0**, 259 신규 Event DDAY **3,156/0**, 지문/이미지 **2,846/0**, 인사/신원 **2,990/0**.
- 백엔드 모의계약: 백업 속성 **6,144/0**, codec fuzz **16,384/0**, 2탭 restore race **40/0**, 개인/관리자 restore guard **각 100/0**, session/tombstone **648 경계**, 연차·근무달력 **34,020 케이스**.
- 실제 Chromium 브라우저 UI: native dialog **16/0**, handoff stress **128/0**, native 파일선택 **12/0**, 사진·세션 stress **72/0**, 이미지 압축 **24/0**, 부팅 **19/0**, 관리자 UI **16/0**. Frontend **287 PASS/0 FAIL**.

## 260 신규 독립 심층 검사
- [휴근/초과근무 PC·모바일 3,854건](https://github.com/eco-i/eco-i.github.io/actions/runs/38679370865) **3,854 PASS/0 FAIL**: 날짜/시간/휴게시간 연산, 순서, 음수·분수, 직원 범위, 중복 레코드, 의도된 PostgREST 정수 문자열 호환성.
- [반응형 7폭×2테마](https://github.com/eco-i/eco-i.github.io/actions/runs/38679521802) **112/0**: 320·360·390·430·768·1024·1280px, 라이트/다크, 로그인화면과 2027년 12월 달력 정상 렌더 및 가로 오버플로 0px.
- [감사로그/용량/장기재직 데이터](https://github.com/eco-i/eco-i.github.io/actions/runs/38679713476) **5,420/0**: 변경 이력, DB·Storage 용량 응답, 장기재직 제외기간 유효성, 악성 HTML 문자 입력 무실행.
- [8개 OS 시간대와 DST 경계](https://github.com/eco-i/eco-i.github.io/actions/runs/38679810515) **224/0**: 8개 실제 Chromium timezone × PC/mobile × 2026~27 UTC 14 시점; 국내 날짜는 OS가 해외 표준시이거나 DST를 쓰더라도 한국 날짜로 일관.
- [차단된 저장소/Web Locks](https://github.com/eco-i/eco-i.github.io/actions/runs/38679964473) **84/0**: 14 브라우저 기능 조합, 로컬·세션 저장소 일부/전체 차단, Web Locks 미제공 상태에서 JS 기동 오류·로그인 버튼·화면 배치 점검.
- 260 신규 독립 계수 검사 합계 **9,694 PASS/0 FAIL** (3,854 + 112 + 5,420 + 224 + 84).
- [258 세션 보호 2탭 RED→GREEN 재검증](https://github.com/eco-i/eco-i.github.io/actions/runs/38679842497) **560 예상 결과 PASS/0 FAIL**: 원본 RED/QA 수정본 GREEN 5×16=80, 복원 세션 소유권 교차 레이스 12×40=480. 이번 새 제품 결함과 별개인 기존 수정사항의 회귀.
- [독립 소스·SHA·JS 무결성](https://github.com/eco-i/eco-i.github.io/actions/runs/38680316783) **21 PASS/0 FAIL**. 전기록 SHA, UTF-8 크기, 2개 inline script, 457개 실제 DOM IDs, RPC명 71개, 258 보호 패치 두군데 등 체크.

## 지속 실검수 (실행시간·반복 규모 확인됨)
- [깊이8 19분 전체 지속](https://github.com/eco-i/eco-i.github.io/actions/runs/38679267891) 실제 **1,143초(19분 3초), 9회차 × 18개 = 162개 브라우저 테스트 묶음 연속 PASS/0 FAIL**. 변형 시드와 2026·27 달력, 사진·백업·권한·세션·시간을 매 회차 실검수.
- [신규 독립 8분 엣지 지속](https://github.com/eco-i/eco-i.github.io/actions/runs/38680032891) 실제 **481초(8분 1초), 22회차 × 5개 = 110개 브라우저 테스트 묶음 연속 PASS/0 FAIL**.

## 시험 코드 전용 오류 구분
- 최초 [무결성 시험](https://github.com/eco-i/eco-i.github.io/actions/runs/38680262642)에서는 **정적 HTML 소스의 `id=` 문자열을 정규식으로 셀 때 JS 템플릿 문자열 안의 2건까지 포함**하여 459건으로 집계했고, 실제 브라우저 DOM 457 ID 검사와 불일치. **제품 오류가 아닌 QA 오라클 오류**. 라이브 DOM 457개 정상, 소스 텍스트 459개인 차이를 시험 기준에 반영한 뒤 [21/0 완료](https://github.com/eco-i/eco-i.github.io/actions/runs/38680316783).

## 직접 검증하지 않은 범위
- GitHub Actions Ubuntu **실제 headless Chromium PC·mobile 에뮬레이션**, 2탭·native dialogs/file picker·mock/stub RPC로 검증한 범위.
- 운영 **Supabase/RLS 실인증 다중사용자**, 물리 Android 카메라·파일 선택기, iOS Safari, 장기 지속 BFCache, 실제 운영 DB 백업·복원은 **직접 시험하지 않았음**. 실서비스의 모든 환경/보안 결함 부재를 주장하지 않음.

## 다음 인계
- 다음 블록 **2-8-261**, 시작본 `qa-handoff/index.before-2-8-261.html`, SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`.
- High·깊이8·블록별 실제 20분 이상, KST 답변 시각 및 20분 이내 중간보고, 결함 발견 즉시 수정/RED→GREEN+독립 회귀, 번호 연속.
- ZIP 다운로드/업로드 요구 금지. 운영 `main`, SQL, APP_VERSION, 배포 무단 변경 금지. 대량 원본·실검수 증빙은 GitHub 보관.