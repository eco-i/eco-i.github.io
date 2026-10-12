# ★★★근무모아 공식 GitHub 검수 인계 — 239 완료

- 공식 완료 **2-8-239**, 다음 **2-8-240**. 신규 제품 결함 3종, 누적 총 **515종**.
- High/2차/깊이8 유지, 최소20분 실제 검수, 기술 결함 즉시 수정·회귀, ZIP 불필요. GitHub QA 브랜치 `qa-2-8`.
- 공식 239 완료/240 시작 SHA-256 **afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5** (**1,164,059 bytes**). 239 불변 시작본 SHA **1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360** (1,161,777 bytes).
- APP_VERSION `ver20260927-0944`; SQL·운영 `main`·실배포 변경 없음.
- 수정 ① 모바일 과거 탭 토큰이 최신 공유 로그아웃 후 다시 공유 세션/관리자 권한으로 승격되는 문제 차단.
- 수정 ② 정확한 토큰의 logout tombstone(이전 aggregate 포함)에도 초기 로그인 선택·레거시 이관 허용되는 문제 차단.
- 수정 ③ 지연된 이전 PC 계정 로그아웃 cleanup이 새 계정의 탭 저장 토큰·관리자 인증 표식을 삭제하던 결함 수정.
- 실제 Chromium 최종 전면검증 [38196759672](https://github.com/eco-i/eco-i.github.io/actions/runs/38196759672), [38196849347](https://github.com/eco-i/eco-i.github.io/actions/runs/38196849347) **각 163 PASS / 0 FAIL**(제품 SHA 동일).
- 실행 범위와 실패/미검증/유효 제품 결함 근거는 `qa-handoff/QA_2-8-239_REPORT.md`와 `qa-handoff/QA_239_EVIDENCE_AUDIT.json`, SHA 기록 `qa-handoff/QA_2-8-239_SHA_MANIFEST.json`에서 확인.
- 대상 QA 파일: `index.html`, `qa-handoff/index.working-2-8-239.html`, `qa-handoff/index.before-2-8-240.html` 3개 동일 완료본.
- 실제 Supabase/RLS·물리 Android 카메라/내 파일·운영 인증멀티유저·iOS Safari·BFCache persisted=true는 이번 검수에서 실행하지 않음.
- 종료 후 다음 블록은 **2-8-240**이며 운영 배포와 버전명은 사용자 별도 승인 없이 변경 금지.
