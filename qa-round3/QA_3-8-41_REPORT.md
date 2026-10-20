# 근무모아 3차·깊이8 — 3-8-41 공식 검수 보고서

## 공식 판정
- **3-8-41 범위 완료 / MEDIUM 신규 결함 1종(3-8-41-001) 실제 원본 함수 mock 재현·QA 수정. CLEAN 아님.**
- 3차 누적 신규 제품 결함 **33종**(이전 32+1), 2차 별도 540종.
- QA `index.html` blob `a86df78b95ae19fffe0f0bb49d613f2f7336a66b` → **`24aac098a0a178b28c6be3c97d368286144b5531`**; 코드 커밋 **`0d98563a7dcc42eb75bf9f4f264e1f832134a985`**.
- 최종 실제 소스 기준 **288/288 scoped assertions PASS**, 서버·직원 DB 조회/변경 0, APP_VERSION `ver20261018-2313` 유지.

## 깊이8 검수 내용
1. GitHub `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-40_REPORT.md` 직접 조회해 완료40/다음41/3차32종/QA HTML blob 확인. 운영 기준과 분리.
2. 3-8-40 rollback 후속: 저장소 epoch getItem readback이 실패하고 원래 epoch를 복원하기 위한 setItem/removeItem마저 실패하면 과거 logout이 epoch 필터로 가려지는 순서 파악. local epoch 60초 신선도·5초 미래 허용·legacy writer 및 exact tombstone 기본 정책 확인.
3. **원본 재현**: mobile / PC remembered / PC temporary × 기존 epoch 유무 = 6개에서 실패 로그인 후 새 epoch 잔존, 이전 logout 무효 인식. 브라우저 실연동이 아닌 원본 함수+시뮬레이션.
4. **국소 QA 보정**: 새 영속 local login pending guard를 logout 증거 변경 **전에** 설치하고 성공을 확인. 읽기/rollback 연속실패 뒤에도 bootstrap/handoff에서 동일 local token 거부. 정상 완료 끝에서만 guard 제거; 삭제 실패면 차단 유지. Guard 자체 저장 불가능 상황의 전체 복구 보장은 주장하지 않음.
5. **최종 소스 저장소 경쟁 210/210 + 정적 7/7 = 217/217 PASS:** 3범위 × 2 prior epoch × 7 오류(정상, epoch set 실패, epoch read+rollback 실패, guard set/read/remove 실패, suppression remove 실패) × 5 assertion = 210; inline JS 2개 파싱, script 개수1, HTML ID 488개 확인/중복0 각1, 버전1, 세 로그인 경로 guard 확인1.
6. **원본 함수 legacy old-writer 및 token 격리 55/55 PASS:** 3범위×3 old writer timestamp(이전/동시/이후)×6 assertion=54, bootstrap 리터럴 guard 확인1. 정상 로그인 후 이전 legacy 재생만 제외하고 동시각/이후 logout은 차단. 다른 local token의 pending guard와 분리.
7. **Realtime 원본 `requestRealtimeCatchup` 지연 Promise 16/16 PASS:** 신호 도착 2×성공/실패 2×세션 소유권 유지/상실 2×기존 pending 2. 옛 refresh 완료가 신규 signal 또는 다른 로그인 결과를 덮지 않음. 실제 Supabase 채널과 multi-device 통합은 시험하지 않음.
8. QA `index.html` 제품 코드만 수정한 뒤 이슈·본 보고서·공식 state/인계를 `qa-3-8`에 기록. 운영 `main`과 실제 직원 DB/지문/근태, 실 RPC/SQL/배포는 접근·변경하지 않음.

## 남은 한계 / 다음 3-8-42
- **localStorage의 guard write/read 자체 거부**, guard cleanup이 계속 거부되어 정상 로그인 차단이 지속되는 경우, clock skew와 과거 epoch 저장소 자체 prune 비용. 불가능한 저장소 완전불능 상황에서 다중 탭 간 강제 차단을 보장했다고 주장하지 않음.
- QA 전용 실제 Chrome old/new 2탭, Web Locks·quota/private mode, Android/iOS PWA, 복수 계정/관리자 PIN/Reatime 실제 Supabase E2E 미검증. 절대 실 직원 계정/DB 사용 금지.
- 다음 **3-8-42:** guard 이전 버전과의 호환·복구/해제 및 TTL cleanup 영향, 실패한 로그인을 뒤따르는 같은 token 재로그인·권한 handoff, Realtime 새 세션 timer/채널 소유권. QA-only.

작성: 2026-10-20 17:53:55 KST
