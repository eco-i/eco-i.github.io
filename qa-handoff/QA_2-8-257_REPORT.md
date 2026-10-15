# 근무모아 2차·깊이8 — 2-8-257 공식 완료 보고

**시작(KST):** 2026-10-15 10:04경(분 단위 인계 시각)  
**완료(KST):** 2026-10-15 10:26경  
**블록 실제 검수:** 약 22분, 최소 20분 준수. 중간보고 10:11 / 10:14 / 10:20 / 10:26 KST.  
**분석 모델·깊이:** High 지침 준수, 8단계 고정.

## 공식 상태
- 이전 **2-8-256 완료**, 이번 **2-8-257 완료**, 다음 **2-8-258**.
- 신규 독립 제품 결함 **0종(CLEAN)**, 누적 **539종 유지**. 테스트 하네스 오류는 제품 결함 미계상.
- QA GitHub `eco-i/eco-i.github.io` 브랜치 `qa-2-8`만 검수 자료·테스트 추가. 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변.
- 제품 코드 수정 **0**, SQL 변경 **없음**, 실배포 **없음**, APP_VERSION `ver20260927-0944` 유지.
- 원본 `qa-handoff/index.before-2-8-257.html`, 본 블록 working, QA `index.html`, 다음 불변 `qa-handoff/index.before-2-8-258.html`은 동일 SHA256 `fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9`, UTF-8 1,174,614 bytes, Git blob `8d9cbf6ed2d7b35a44348bae3e3ee8b4f15712c3`.

## 실행한 실증 검수
- [전체 Chromium 8단계 배터리 #38664120188](https://github.com/eco-i/eco-i.github.io/actions/runs/38664120188)와 [독립 재검수 #38664240144](https://github.com/eco-i/eco-i.github.io/actions/runs/38664240144): 두 실행의 전체 3개 job PASS. 풀 회귀 각 **214 PASS/0 FAIL**.
- 각 전체 배터리 backend: 백업 속성 **6144/0**, 랜덤 스키마 **16384/0**, 파일 복원 세션 경합 **40/0**, 개인/관리자 복원 각 **100/0**, 권한·세션 scope/tombstone 경계 **648**, 2026~2027 근무/연가 **34020**. 
- 각 frontend: 네이티브 대화상자 **16/0**, 2탭 반복 handoff **128/0**, 실제 file picker **12/0**, 사진/세션 stress **72/0**, 이미지 파이프라인 **24/0**, cold boot **19/0**, 관리자 UI **16/0** (합계 **287/0**).
- 신규 `QA_257_EDGE.cjs`: PC·모바일 백업 섹션/버전/원형 변조, 부적합 JSON 거부, 빈 MIME의 정상 이미지 JPEG 변환, 잘못된 PNG 거부 **3171 PASS/0 FAIL**. QA index smoke **56/0**, 스키마 **70/0**, 코드·RPC·DOM 무결성 **24/0**.
- 신규 [RPC contract #38664427189](https://github.com/eco-i/eco-i.github.io/actions/runs/38664427189): 내보내기/복원 미리보기 타입·형식·섹션·범위 변형, PC·모바일 **184 PASS/0 FAIL**.
- 신규 [한국 자정 경계 #38664997130](https://github.com/eco-i/eco-i.github.io/actions/runs/38664997130): Seoul/UTC/LA 브라우저 시간대, 2026→2027 연말 및 자정 직전/직후, PC/모바일 **72 PASS/0 FAIL**.
- [지속 회귀 #38664288131](https://github.com/eco-i/eco-i.github.io/actions/runs/38664288131): 실제 **857초**, 서로 다른 변형 시드로 **13회**, 총 **143개 테스트 묶음 실행, 전부 PASS**. 시드 변경 백업 파서 경계, Chromium 풀 214, 연가, 권한/세션, 파일 선택, 이미지, 대화상자, index/소스 SHA 불변 재검증. 반복 중 누적 제품 소스 변동 없음.

## 비제품 테스트 하네스 오류(모두 정정)
- [#38663970966](https://github.com/eco-i/eco-i.github.io/actions/runs/38663970966): 신규 독립 QA257 테스트 소스 정규식에서 잘못 이스케이프한 문법 오류. 기존 풀 Chromium 214는 성공했으나 신규 스크립트 파싱 중단. 스크립트만 고친 후 위 두 전체 배터리 PASS.
- [#38664763053](https://github.com/eco-i/eco-i.github.io/actions/runs/38664763053): 테스트의 월 1~12 예상과 사이트 0~11 저장이 불일치한 oracle 오류. 테스트 기대값 수정.
- [#38664861930](https://github.com/eco-i/eco-i.github.io/actions/runs/38664861930): 23:59:59의 가상 브라우저 clock이 페이지 로딩 중 0시를 넘어가는 테스트 시계 race(71/72). 충분한 시간차를 둔 자정 양측 비교로 정정 후 72/72 PASS.
- 이 세 실행의 실패는 실제 제품 재현 결함이 아니므로 공식 누적 결함에 미포함.

## 검증 환경 제약
실 headless Chrome desktop/mobile 에뮬레이션, 모의 2탭/네이티브 confirm/file input, stubbed Supabase RPC 검증. 실제 운영 Supabase/RLS 다중인증 사용자, 물리 Android 카메라/Picker, iOS Safari, 지속 BFCache, 운영 DB 백업·복원은 미검증. 운영 장애/취약점이 없다는 종합 보증은 아님.

**다음은 2-8-258**, 불변 시작본 `qa-handoff/index.before-2-8-258.html`. 동일 High·깊이8·블록 실제20분+·KST 중간보고·오류 즉시 수정+RED→GREEN 독립 회귀·검증 안 된 범위 명시. ZIP 금지 / 운영·SQL·버전 임의 변경 금지.
