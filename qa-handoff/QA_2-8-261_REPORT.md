# 근무모아 2차·깊이8 공식 QA — 2-8-261 CLEAN

**실제 검수:** 2026-10-15 13:27:37–13:49:21 KST = **21분44초**, High·깊이8, KST 중간보고 준수.
**공식 완료:** 2-8-261 / 다음 2-8-262. **신규 제품 결함 0종, 누적 540종 유지.**
운영 main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음. SQL/배포/APP_VERSION 변경 없음(`ver20260927-0944`). 제품 HTML 수정 없음.
최종 SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, UTF8 1,175,136 bytes. QA index/261 시작·작업/262 시작본 모두 동일.

## 실제 병렬·지속 회귀
- [19분 이상 전체 Chrome 지속검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38681632972): **1,232초 / 8회차 / 184개 테스트 묶음, 실패 0**. 교대근무, 연차, 지문·이미지, 복원 세션, RPC/코덱 fuzz, 2026·2027, 파일선택·관리자·권한 등 23개 suite 반복.
- [Full/Backend/Frontend 세 Job 전체 성공](https://github.com/eco-i/eco-i.github.io/actions/runs/38681722027): Full Chromium 214/0, 백업 속성 6,144/0, codec 16,384/0, 브라우저 native 287/0, restore race 40/0, 개인·관리자 restore guard 각 100/0, 권한/tombstone·달력/연가 매트릭스, 과거 259·260 독립 검수 등 모두 통과.
- [261 새 경계 반복](https://github.com/eco-i/eco-i.github.io/actions/runs/38682192510): **544초 / 111회차 / 444개 Chrome 테스트 묶음 전부 PASS**.
- [다중탭 저장소 복원 RED→GREEN](https://github.com/eco-i/eco-i.github.io/actions/runs/38682218842): 통제 원본 RED·수정본 GREEN 5×16=80, 수정본 2탭 경합 12×40=480, **560개 PASS**.

## 이번 261 신규 독립 검사 — 총 19,536개 PASS / 실패 0
- [2년 4조2교대 독립 패턴](https://github.com/eco-i/eco-i.github.io/actions/runs/38681804040): **10,210/0**, 2026-2027 730일, A/B/C/D 8일 순환, DAY 주말/공휴일, 2026-10-01~15 대정비 및 마지막 날 C 야간.
- [로그인/신원 보안계약](https://github.com/eco-i/eco-i.github.io/actions/runs/38681843534): **4,220/0**, UUID, 잘못된 만료 일시, 계정 및 그룹 필드, 로그인 실패 센티널.
- [대체공휴일 발생 대휴](https://github.com/eco-i/eco-i.github.io/actions/runs/38681991808): **128/0**, 전야 4h/당야 1.5h/당주 5.5h, 실제 근무배치·인사발령 교체 시 개인별 발생분 분리, HTML 이스케이프.
- [계정/연차/장기재직](https://github.com/eco-i/eco-i.github.io/actions/runs/38682115722): **4,490/0**, 2026 잔여 연차·2027 부여/이월·계정 readonly·퇴사/재직 자료 검증.
- [화면 글자 21단계 범위](https://github.com/eco-i/eco-i.github.io/actions/runs/38682293699): **360/0**, 320~1280px, 라이트/다크 × 5 글자크기, 가로 넘침 0px.
- [한국천문연구원 2027년 24절기](https://github.com/eco-i/eco-i.github.io/actions/runs/38682537948): **64/0**, [KASI 공식 달력자료](https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027)와 전부 일치.
- [로그인·4탭 키보드/ARIA](https://github.com/eco-i/eco-i.github.io/actions/runs/38682720526): **64/0**, 4개 화면 전환·focus·로그인 라벨 검증.
- [소스 무결성](https://github.com/eco-i/eco-i.github.io/actions/runs/38682888172): **21/0**, 버전, JS 구문, GitHub 현재/원본 SHA 등.
- [262 인계 절차 Dry-run](https://github.com/eco-i/eco-i.github.io/actions/runs/38683078684): CI 작업공간에서만 가상 상태로 PC/mobile SHA·기동 **39/0**, 원격 공식 상태 변경 없이 검증.

## 하네스 오류와 검증 제한
- [최초 로그인 검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38681703744)는 과거 PostgreSQL 타임존 없는 시각도 호환 허용하는 제품 계약을 테스트가 잘못 부정한 QA 기준 오류. 테스트만 수정하고 4,220/0 정상 재검증. **제품 결함 미계상**.
- 실 환경은 Ubuntu headless **실 Chromium PC/mobile 에뮬레이션**과 모의 RPC. **운영 Supabase/RLS 진짜 다중계정, 물리 Android 카메라/파일 선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원**은 직접 검증하지 않았음.

## 다음
시작파일 `qa-handoff/index.before-2-8-262.html`. 다음 2-8-262부터 **High·깊이8·블록별 실제20분+·20분 이내 KST 중간보고**, 기술 결함 즉시 수정/RED→GREEN·회귀, 번호 연속, ZIP 금지, main/SQL/APP_VERSION/운영배포 무단 변경 금지.