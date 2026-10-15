# 근무모아 2차·깊이8 종합검수 — 2-8-269 공식 CLEAN

**공식 완료:** 2-8-269. **다음 시작:** 2-8-270. 신규 확인 제품 결함 **0종**, 공식 누적 제품 결함 **540종**. 모델 설정 High·검수 깊이 8단계 유지.

## 검수 증거 — 실제 20분 이상

- [전체 본검수 GitHub Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637286): **6개 Job 전부 SUCCESS** (full, backend, frontend, independent, integrity, depth-eight). 실행 2026-10-15 **21:49:44~22:11:06 KST**.
- **실제 1,266초(21분6초) 지속검수:** 21:49:55~22:11:01 KST, **9회×23개 = 207개 회귀 스위트 묶음 PASS/0 FAIL**. 별도로 신규 이미지 압축 본검수 매 라운드 재실행, 오류 0건.
- **신규 이미지 압축·입력 보호 474 PASS/0 FAIL:** 6개 실제 Chromium PC/mobile × KST/UTC/LA 설정에서 1px·세로/가로/투명 PNG·긴 한글/제어문자 파일명·JPEG 변환/최대110KB·최대1024px·중복 Blob URL 미해제 방지 및 MIME 불일치/20MB 초과/손상 이미지 거부. [본검수 independent job](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637286).
- **추가 압축 용량 경계 186 PASS/0 FAIL:** [독립 Actions](https://github.com/eco-i/eco-i.github.io/actions/runs/38738123545), 실제 Chromium 환경에서 **통제된 blob 크기 모의값**으로 95KB 2·3차 재압축과 110KB 최종 상한, canvas null 실패 분기를 검증. 모의 크기 테스트를 실제 이미지 화질 보증으로 주장하지 않음.
- 기존 **지문 기록 730일 정합성 21,930 PASS/0 FAIL**, **날짜·윤년·월말 26,430 PASS/0 FAIL**, **2년치 교대·대정비/연도 경계 30,606 PASS/0 FAIL**, **모바일·달력 UI 1,401 PASS/0 FAIL**, **시간대/입력 경계 765 PASS/0 FAIL**, **세션 폐기·복원 보호 60 PASS/0 FAIL**, **소스·SHA 무결성 21 PASS/0 FAIL**.
- [지문 RPC 별도 검사](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637114) **156 PASS/0 FAIL**; [8개 과거 독립계약](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637243) **20,301 PASS/0 FAIL**.
- [다중탭 RED/GREEN 및 복원 경합](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637121) **80+480=560 PASS/0 FAIL**; [실제 앱 로그아웃 4개 병렬 Job](https://github.com/eco-i/eco-i.github.io/actions/runs/38737637278) **640 PASS/0 FAIL**.
- Full/Backend/Frontend 11·9·10개 회귀 결과 로그 실패 0. PASS 건수는 중복 가능한 검사 실행 횟수이며, 독립 제품 결함 수와 동일하지 않음.

## 레거시 QA 예외 및 실환경 미검증

- 265 블록에서 **토큰 폐기 표식 없는 raw localStorage SESSION_KEY 직접 삭제**를 사용한 레거시 QA는 병렬 환경에서 간헐 실패 기록이 있었음. 실사용 로그아웃은 정확한 토큰 폐기 표식을 우선 기록하므로 다른 프로토콜이며, 이 검수 예외와 증빙은 숨기거나 삭제하지 않는다. 269에서는 실사용 로그아웃 방식의 회귀가 PASS이며 비정상 키 외부삭제 전조건의 무결함을 주장하지 않는다.
- 실제 운영 Supabase 인증/RLS 다중계정, 물리 Android 카메라/OS 파일선택기, iOS Safari, 지속 BFCache, 운영 DB 백업·복원은 직접 미검증.

## 소스 무결성 및 배포 불변

- `index.html`, 269 시작본, 269 작업본, 270 시작본 모두 **SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**. QA 스크립트·보고서만 `qa-2-8`에 변경, 제품 본체 수정 없음.
- 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변, SQL 변경·운영 배포 없음, APP_VERSION `ver20260927-0944`.
- 다음 `qa-handoff/index.before-2-8-270.html`에서 2-8-270 시작. High·깊이8·실제20분+ 블록/20분 이내 KST 중간보고/결함 즉시 수정+RED-GREEN 회귀/번호 연속, ZIP 금지, main·SQL·APP_VERSION·배포 무단 변경 금지.
