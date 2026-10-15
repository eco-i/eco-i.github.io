# 근무모아 2차·깊이8 종합검수 — 2-8-268 공식 CLEAN

**공식 완료:** 2-8-268. **다음 시작:** 2-8-269. 신규 확인 제품 결함 **0종**, 공식 누적 제품 결함 **540종**.

## High·깊이8 실행 증빙

- [268 본검수 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38733199670): **6개 Job 전부 SUCCESS**. 진행 시간 **2026-10-15 21:14:56~21:35:23 KST**. Full·Backend·Frontend·Independent·Integrity·Depth-eight.
- **실제 20분 15초 (1,215초) 지속검수**, 2026-10-15 **21:15:03~21:35:18 KST**. **10회 × 23개 = 230개 회귀검사 묶음 PASS / FAIL 0**. 각 반복에서 268 신규 지문기록 날짜 정합성 독립 검사도 재실행 성공.
- **268 신규 730일 지문 기록 사진·확인 정합성 속성 검사**: 2026·2027년 전체 730일×6 Chromium 환경, 출근 사진만 등록/양쪽 등록/확인 완료/조기확인 거부/퇴근 사진 시각 누락 거부, 날짜 범위·중복 거부 **21,930 PASS / 0 FAIL**.
- 이전 날짜 계산 730일·윤년/월말 **26,430 PASS / 0 FAIL**, 2026~27 교대·대정비/연도 경계 **30,606 PASS / 0 FAIL**, 24개월 UI/모바일/저장소 접근제한 **1,401 PASS / 0 FAIL**, KST 시간대/대정비/입력 경계 **765 PASS / 0 FAIL**, 세션 폐기·복원 차단 **60 PASS / 0 FAIL**, SHA·버전·JS 소스/인계 무결성 **21 PASS / 0 FAIL**.
- [추가 지문 RPC 포맷 검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38733199938): 허위 날짜·중복·타임스탬프·지문 입출근 상태 불일치 **156 PASS / 0 FAIL**.
- [과거 8개 독립계약 교차검수](https://github.com/eco-i/eco-i.github.io/actions/runs/38733200050) **SUCCESS**. 로그인, 대휴·연차, 730일 교대, 접근성/텍스트 확대, 2027 절기, 브라우저 경계 포함.
- [다중탭 RED/GREEN 및 복원경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38733199801): **80 + 480 = 560 PASS / 0 FAIL**.
- [실제 앱 로그아웃 4개 병렬 Job](https://github.com/eco-i/eco-i.github.io/actions/runs/38733199852): **4 shard × 4회 × 40 = 640 PASS / 0 FAIL**.
- PASS 수는 독립 제품 결함 수가 아닌 중복 가능한 개별 검사 통과 횟수다.

## 265 레거시 QA 예외 및 환경 한계

- 265의 **폐기 표식 없이 원시 localStorage SESSION_KEY를 직접 삭제**한 과거 모의검수에서, 경쟁 조건에 따라 간헐적 실패가 있었던 사실과 증빙은 유지한다. 실제 앱 로그아웃은 exact-token 폐기 표식을 기록하므로 다른 프로토콜이다. 268은 실제 앱 방식의 복원 권한·세션 차단을 검증했으며, 비정상적인 원시 저장소 외부 강제삭제 조건의 안전성까지 증명한 것은 아니다.
- 실운영 Supabase 인증/RLS 실제 다중계정, 물리 Android 카메라/파일선택기, iOS Safari, 영속 BFCache 및 운영 DB 백업·복원은 직접 검증하지 않았다.

## 형상·배포·다음

- `index.html`·268 시작본·268 작업본·269 시작본 동일 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. 제품 HTML 수정 없음.
- 운영 main `5c9529069a4728e72b960c61a44e8045eacc0ca0` 변경 없음; SQL 변경·운영 배포 없음; APP_VERSION `ver20260927-0944`.
- 공식 다음 시작본: `qa-handoff/index.before-2-8-269.html`. High·깊이8·실제20분 이상·20분 이내 KST 중간보고·결함 즉시 수정 후 RED/GREEN 회귀. ZIP 금지, main·SQL·APP_VERSION·배포 임의 변경 금지.
