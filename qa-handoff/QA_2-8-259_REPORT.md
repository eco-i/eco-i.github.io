# 근무모아 2차 · 깊이 8단계 — 공식 2-8-259 완료

**2026-10-15 (목) 11:33:10~11:56:15 KST · 실제 23분 05초 · High / 깊이8**

## 결론
- 2-8-259 **CLEAN**, 신규 독립 제품 결함 **0종**, 누적 공식 제품 결함 **540종 유지**. 다음 2-8-260.
- GitHub `eco-i/eco-i.github.io` 검수 `qa-2-8`만 작업. 운영 `main` 커밋 `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변.
- 제품 코드 수정 없음, 운영 배포 없음, SQL 수정 없음, `APP_VERSION=ver20260927-0944` 유지.
- 259 시작본·작업본·QA `index.html`·다음 260 시작본: SHA-256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, UTF-8 **1,175,136 bytes**, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f` 동일.

## 독립 증빙 / 실검수
- [19분 지속 Chromium 회귀](https://github.com/eco-i/eco-i.github.io/actions/runs/38671708475): **1,181초(19분41초), 11회, 165개 테스트 묶음 전부 PASS**.
- [Full/Backend/Frontend 병렬 8단계](https://github.com/eco-i/eco-i.github.io/actions/runs/38672117996): **3개 Job 전부 SUCCESS**, full Chromium **214/0**, 백업 속성 **6,144/0**, codec fuzz **16,384/0**, restore race **40/0**, 개인·관리자 restore guard 각 **100/0**, 세션·tombstone **648 조합**, 2026~27 근무표·연가 **34,020 케이스**.
- 프런트 native confirm **16/0**, 다중 탭 dialog stress **128/0**, 파일선택 **12/0**, 사진/세션 **72/0**, 이미지 **24/0**, 부팅 **19/0**, 관리자 UI **16/0**, 합계 **287/0**.
- [이벤트·D-DAY](https://github.com/eco-i/eco-i.github.io/actions/runs/38671909177) **3,156/0**, [지문 기록·사진](https://github.com/eco-i/eco-i.github.io/actions/runs/38672025689) **2,846/0**, [인사·신원](https://github.com/eco-i/eco-i.github.io/actions/runs/38672214299) **2,990/0**. 신규 독립 경계 총 **8,992/0**.
- 기존 백업 edge **3,171/0**, RPC 계약 **184/0**, 한국시간/연도 날짜 경계 **72/0**, HTML 인젝션 **92/0**, 실제 다운로드-JSON복원 **22/0**를 본 후보에서 다시 확인.
- [258 cross-tab 세션 수정 반복](https://github.com/eco-i/eco-i.github.io/actions/runs/38672329590): 통제 RED→GREEN **5×16=80**, restore ownership race **8×40=320**, 전부 예상대로 통과.
- [공식 2027 월력요항](https://github.com/eco-i/eco-i.github.io/actions/runs/38672743347) **58/0**. 우주항공청 [2027 월력요항(2026-06-29 공고)](https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03)과 공휴일 24일 완전 일치, 공휴일 72일·주5일제 휴일 119일 확인.
- [대용량 UI](https://github.com/eco-i/eco-i.github.io/actions/runs/38672920313): PC/모바일 일정 500건·개인메모 400건 안전 렌더링, **14/0**, JS 주입 및 페이지 오류 없음.

## 테스트 하네스 실패(제품 결함 미계상)
- [첫 지속 실행](https://github.com/eco-i/eco-i.github.io/actions/runs/38671644003)은 `QA_259_ADAPT.cjs` 생성 전에 트리거된 스크립트 누락. 생성 후 19분 지속 실행으로 정상 재검증.
- [첫 이벤트 fuzz](https://github.com/eco-i/eco-i.github.io/actions/runs/38671849968)은 PostgREST bigint 숫자 문자열 허용과 맞지 않는 테스트 예상 오류. 정상 호환성 반영 후 3,156/0 통과.

## 환경상 직접 검증하지 못한 부분
실 Ubuntu Chrome PC/mobile 에뮬레이션·2탭·모의 RPC 기준. 운영 Supabase/RLS 인증 다중계정 실제 권한, 물리 Android 카메라/파일선택기, iOS Safari, 영속 BFCache, 운영 DB 백업/복원은 미검증. 본 검수 결과가 운영환경의 절대적인 무결성 보증은 아님.

## 다음
2-8-260부터 High·깊이8·실제20분 이상·20분 내 KST 중간보고·결함 즉시 수정/독립 회귀. ZIP 제안 금지. 운영 `main`/SQL/APP_VERSION/실배포 임의 변경 금지. 상세 대량 로그는 GitHub에 보관.