# 근무모아 2차·깊이8 공식 QA — 2-8-262 CLEAN

**결과:** 공식 완료 2-8-262, 다음 2-8-263. 신규 독립 제품 결함 **0종**, 누적 **540종** 유지.
**환경:** High·깊이8, 실제 Ubuntu Chromium desktop/mobile 에뮬레이션, GitHub Actions 6개 job 모두 SUCCESS.
**실제 지속 검수:** 2026-10-15 15:38:52~15:59:26 KST, **1,234초 (20분34초)**, 9회차×23 = **207개 회귀 테스트 묶음 PASS / 실패 0**. 블록 시작은 15:33경, 종료 요건 충족.
**워크플로 전체:** https://github.com/eco-i/eco-i.github.io/actions/runs/38693638034 (시작 15:38:38, 완료 15:59:30 KST).

## 증빙
- 신규 262 독립 Chrome/모바일/시간대/연도 경계/대정비/입력 이스케이프/탭 ARIA: **765 PASS, 0 FAIL**, 9환경(Asia/Seoul·UTC·America/Los_Angeles × 360/390/1280px), GitHub Job 116285054770.
- 262 인계·SHA·HTML/JS·버전 무결성: **21 PASS, 0 FAIL**, Job 116285054753.
- 기존 전체 Full Chromium/RPC/달력/이미지/복구 회귀 **SUCCESS**, Job 116285054670.
- 백엔드 백업 속성·코덱 퍼즈·복원 race·권한 격리 **SUCCESS**, Job 116285054671.
- 프런트엔드 native picker, 이미지 압축, UI, 접근성, 저장소 실패 **SUCCESS**, Job 116285054296.
- High·깊이8 지속 Soak **SUCCESS**, Job 116285055110, 9회/207개 묶음/1,234초.
- 모든 로그·대량 회귀는 GitHub Actions 내부 처리하며 GitHub 링크로 검증 가능.

## 공식 소스·운영 불변
- 시작본, index.html, 262 작업본, 다음 263 시작본 동일 **SHA-256 19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, **1,175,136 bytes**.
- APP_VERSION `ver20260927-0944`; SQL 변경 없음; 배포 없음.
- 운영 main HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 그대로, qa-2-8만 QA 이력 업데이트.

## 검증 불가/제한
실 운영 Supabase/RLS 실제 다중계정, 물리 Android 카메라/OS 파일선택기, iOS Safari, 영속 BFCache, 실운영 DB 복원은 직접 검증하지 않았음. 모의 RPC와 PC/mobile headless Chromium 결과를 해당 실환경 증명으로 확대하지 않는다.

## 다음
공식 263은 `qa-handoff/index.before-2-8-263.html`에서만 시작. 각 블록 High·깊이8·실제 20분 이상·20분 이내 KST 중간보고·오류 즉시 수정/RED→GREEN 회귀·번호 연속. ZIP 제안 금지. main/SQL/APP_VERSION/배포 무단 변경 금지.
