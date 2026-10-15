# ★★★근무모아 2차·깊이8 — 271 완료 / 272 다음

- 공식 마지막 완료 **2-8-271 CLEAN(검증된 범위)**, 다음 **2-8-272**, 누적 제품 결함 **540종**, 271 신규 확정 결함 **0종**.
- GitHub `eco-i/eco-i.github.io` 검수 브랜치 `qa-2-8`, 운영 `main` HEAD `5c9529069a4728e72b960c61a44e8045eacc0ca0` 불변. APP_VERSION `ver20260927-0944`, SQL·운영 배포 없음.
- [271 GitHub Actions 7/7 SUCCESS](https://github.com/eco-i/eco-i.github.io/actions/runs/38753524965), **실제 1211초 9×23=207 지속회귀 묶음 PASS**, 신규 실제 Chrome 교차탭 picker·로그아웃 6개 환경 **168 PASS/0 FAIL**.
- 272 시작 기준본 `qa-handoff/index.before-2-8-272.html`: SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`, Git blob `7077d4c27abf1b847471e32f462df0efd7cbd08f`, 1,175,136 bytes. 271 시작본·작업본·index.html과 동일.
- 공식 문서 `qa-handoff/QA_2-8-271_REPORT.md`, `QA_2-8-271_SHA_MANIFEST.json`, `QA_271_EVIDENCE_AUDIT.json`.
- **기존 265 raw localStorage 세션키 직접 삭제와 logout 폐기 표식 누락 예외 보존**; 270 초기 QA picker 하네스 실패 증빙 보존. 원본 QA 실패·실운영 미검증 범위는 임의로 삭제·성공 치환 금지.
- 생산 Supabase/RLS 실인증 멀티유저, 물리 Android/iOS native picker, 영속 BFCache, 운영 DB 복원 직접 미검증.
- 272 역시 High·깊이8·블록당 실제 20분 이상/20분 이내 KST 중간보고/오류 즉시 수정+회귀/번호 연속. 소스·대용량 로그는 GitHub Actions/인계 파일로, 채팅에는 핵심만. ZIP 금지, main·SQL·APP_VERSION·배포 무단 변경 금지.
- 이전 `QA_2-8-271_WIP.md`는 완료 전 스냅샷이며 현재 공식 상태는 이 문서와 `CURRENT_STATE.json`을 우선한다.
