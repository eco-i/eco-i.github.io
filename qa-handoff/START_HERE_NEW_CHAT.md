# ★★★근무모아 2차·깊이 8단계 공식 GitHub 인수인계 — 241 완료

- 공식 완료 **2-8-241** / 다음 시작 **2-8-242** / 누적 제품 결함 **517종**(이번 신규 **1종**).
- QA 브랜치 `qa-2-8`, 운영 `main` 변경·배포·SQL 변경 없음. `APP_VERSION ver20260927-0944` 고정.
- 완료 HTML과 242 시작본 SHA-256 **1e4f0272715743ac302b7f46cb13d052f869719194a45baaaed2c5a14c1873f5** (**1,165,130 bytes**). 시작 불변 241 SHA-256 **53ea6ea7a20b3fbd9d0c93aa0d7d6969d89e1179638211a0d8a8bcf786fc2c34** (**1,164,815 bytes**).
- 신규 1종: 로그아웃된 공유 토큰 A를 정확히 억제하는 marker A가 있고 shared A가 여전히 존재할 때(미수신 StorageEvent), 이미 열린 관리자 화면/지문 변경·민감 export·일반 read RPC의 소유권 검사가 억제 표식을 직접 읽지 않음. 공통 `storedSessionTombstoned(token)`에 마커 A의 동일 토큰 여부를 추가하는 **1곳 소스 수정**으로 보완.
- 실제 재현 [38236470791](https://github.com/eco-i/eco-i.github.io/actions/runs/38236470791); 최종 Chrome 독립 [38237417756](https://github.com/eco-i/eco-i.github.io/actions/runs/38237417756)·[38237595145](https://github.com/eco-i/eco-i.github.io/actions/runs/38237595145): **각 194 PASS / 0 FAIL**.
- 4탭 실제 mobile admin 3화면 폐기, Web Locks 없는 mobile reload, PC 독립 B 보존, PC 동일 A 차단, 새 모바일 공유 C 및 관리자 unlock 유지.
- 공식 자료: `qa-handoff/QA_2-8-241_REPORT.md`, `qa-handoff/QA_241_EVIDENCE_AUDIT.json`, `qa-handoff/QA_2-8-241_SHA_MANIFEST.json`, `qa-handoff/index.before-2-8-242.html`.
- 실제 운영 Supabase/RLS, Android 네이티브 카메라/파일선택, authenticated backend multiuser, iOS, confirmed BFCache, 실제 백업/복원은 미검증.
- High·깊이8 유지, 블록마다 20분 이상 실제 검수, 결함 즉시 수정/회귀, 20분 이내 중간보고, 번호 연속, 테스트 하네스 오류와 제품 결함 구분, 공식 근거 없는 PASS 주장 금지. ZIP 불필요.
