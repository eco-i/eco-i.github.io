# 근무모아 2차·깊이8 종합검수 — 2-8-267 CLEAN

**공식 완료:** 2-8-267. **다음 시작:** 2-8-268. 신규 확인된 제품 결함 0종, 공식 누적 제품 결함 540종.
**검수 설정:** High·깊이8, 실제 Ubuntu headless Chromium PC/mobile 에뮬레이션 및 stubbed RPC.

## 267 실행 증빙
- [본검수 6개 Job 모두 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726740). 2026-10-15 **20:38:06~20:58:47 KST**.
- **실제 장시간 지속검수 1,231초(20분31초)**, **8회 × 23개의 기존 회귀검수 = 184개 묶음 PASS, FAIL 0**. 진행 중 각 라운드에서 신규 267 날짜속성 검사 재실행도 통과.
- **267 신규 독립 날짜속성 테스트**: 2026~27년 730일(6개 Chromium 프로파일), 날짜 +1/-1, 양방향 일차, 월말 길이 조정, 2024 윤년/2025·2027 비윤년, 연도/월 경계, 비정상 날짜 거부 **26,430 PASS / 0 FAIL**. [본검수 독립 Job](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726740).
- 기존 2026~2027 2년치 교대/대정비/연도 경계 **30,606 PASS / 0 FAIL**, 24개월 달력·모바일/저장소 거부 **1,401 PASS / 0 FAIL**, 시간대/대정비/입력 경계 **765 PASS / 0 FAIL**, 실제 앱 세션 폐기·복원 방어 **60 PASS / 0 FAIL**.
- SHA·버전·JS 소스 정적 무결성 **21 PASS / 0 FAIL**.
- [지문 기록 RPC 계약](https://github.com/eco-i/eco-i.github.io/actions/runs/38728727002): 날짜·중복·업로드 시각·출퇴근 확인 상태 **156 PASS / 0 FAIL**.
- [로그인/대휴/연차/24절기 등 기존 8개 독립계약 교차회귀](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726596): SUCCESS.
- [다중탭 세션 RED/GREEN·복원경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726812): **80 + 480 = 560 PASS / 0 FAIL**.
- [실제 앱 로그아웃 순서 4-worker 병렬](https://github.com/eco-i/eco-i.github.io/actions/runs/38728726578): 4 shards × 4 rounds × 40 = **640 PASS / 0 FAIL**.
- Full/Backend/Frontend 작업 각 SUCCESS; 실제 제품 본체 HTML 변경 없음. 개별 PASS 횟수는 중복 가능하므로 독립 결함 수로 합산하지 않음.

## 265부터의 검수 범위 예외
- 원시 `localStorage SESSION_KEY`를 표식 없이 직접 제거하는 레거시 테스트는 동시 실행 환경에서 간헐적으로 실패한 이력이 있다. 이 조건은 실제 앱의 로그아웃 토큰 폐기 표식 기록 프로토콜과 다르다.
- 본 블록에서 **실제 로그아웃 방식의 폐기 표식·세션 권한 검증을 유지**, 640건 병렬 검증 및 60건 세션 방어 검사 PASS. 레거시 비정상 키 강제삭제의 모든 동작을 보장하지 않으며 기존 실패기록을 삭제하지 않았다.

## 형상·배포
- `index.html`·267 시작본·267 작업본·268 시작본이 모두 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` **불변**. APP_VERSION `ver20260927-0944` 유지. SQL 변경 없음. 운영 배포 없음. QA 파일만 `qa-2-8`에 변경.
- 실 운영 Supabase 인증/RLS 실제 다중계정, 물리 Android 카메라/OS 파일선택기, iOS Safari, 영속 BFCache, 운영 DB 복원은 직접 미검증.

## 다음
2-8-268 시작본 `qa-handoff/index.before-2-8-268.html`. High·깊이8, 각 블록 실검수 최소 20분, 20분 이내 KST 중간보고, 결함 발견 시 즉시 수정/RED-GREEN 회귀, 번호 연속. ZIP 금지, 운영 main·SQL·APP_VERSION·배포 무단 변경 금지.
