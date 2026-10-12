# 근무모아 2차·깊이8 종합검수 — 2-8-239 공식 완료 보고서

**요약:** High·깊이8·실제 Chromium 보안/업무 화면 회귀. 모바일 세션 이관·로그아웃 처리 관련 서로 다른 제품 결함 **3종**을 실제 브라우저에서 재현·수정하고 QA 전용 후보 전체 회귀가 **163 PASS / 0 FAIL 2회 연속** 안정화되었음. 운영 서비스 DB/기기 실증은 범위 밖으로 분리.

## 공식 번호와 변경 통제
- 이전 공식 완료 **2-8-238** / 이번 **2-8-239** / 다음 **2-8-240**. 블록 건너뛰지 않음.
- 공식 제품 결함 **512 → 515종**(이번 새 3종). 테스트 하네스 문제 별도, 제품 결함 수에 포함하지 않음.
- 239 불변 시작본 `qa-handoff/index.before-2-8-239.html`, SHA-256 `1292955d4ae7fd90c3bcf8e6ccc6d5ea9595bd9d34215e27aa06baa98dd98360`, **1,161,777 bytes**.
- 완료 후보 `qa-handoff/index.working-2-8-239.html`, QA 전용 `index.html`, 다음 시작본 `qa-handoff/index.before-2-8-240.html` 동일 SHA-256 `afba6b948c5d33ce62cfb5a70710852d6540e75576644ed1e3daf6809d26f5f5`, **1,164,059 bytes**.
- APP_VERSION `ver20260927-0944` 고정, SQL 변경 없음, 운영 `main` 변경/배포 없음.
- Github 첫 239 검증 작업 기록 **2026-10-12 11:19:15 KST**, 공식 완료 **2026-10-12T11:45:01+09:00**. 첫 작업과 완료 사이 20분 이상 계속된 코드 점검/실 Chromium 재현/수정/회귀/인수인계 확인으로 블록 최소 활동구간 충족. 단순 경과 자체와 업무 수행 내용은 구분.

## 제품 결함 ① — 새 공유 로그아웃 후 모바일 옛 탭 토큰이 다시 공유 세션으로 승격
- 근거: [실제 Chromium red #38195496271](https://github.com/eco-i/eco-i.github.io/actions/runs/38195496271). Web Locks 실제 획득 후 `migrateLegacySessionForDevice()` 호출 결과 최신 공유 B는 로그아웃 표시되었으나 기존 임시 A가 `localStorage`에 다시 저장되고 관리자 unlock까지 승격.
- 원인: 모바일 레거시 sessionStorage→localStorage 이관에서 `SHARED_SESSION_LOGOUT_SUPPRESSION_KEY`의 새로운 공유 세션 로그아웃 경계를 누락.
- 수정: 최신 공유 토큰이 없거나 명시 로그아웃된 동일 토큰만 남아 있고 suppress marker가 있으면, 레거시 탭 토큰·관리자 표식을 공유 저장소로 승격하지 않고 정리. **정상적인 레거시 단독 로그인 A**(후속 로그아웃 표시 없음)는 이관되며, **다른 탭의 최신 C**는 유지.
- 테스트 환경 no-op을 제품 결함으로 오인하지 않도록 검수 하네스도 Web Lock 취득을 반드시 확인하도록 강화.

## 제품 결함 ② — 토큰별 명시 로그아웃 기록에도 초기 세션 선택·레거시 이관 허용
- 근거: [실제 Chromium red #38195737908](https://github.com/eco-i/eco-i.github.io/actions/runs/38195737908). 정확한 토큰 A에 `updateSessionLogoutToken` 기록이 있어도 `storedSessionToken()`이 A를 반환하고 이관이 A 및 관리자 unlock을 복원.
- 원인: 초기 토큰 선택은 공유 suppress marker만 검사했고, 개별 토큰 logout tombstone과 기존 aggregate tombstone은 조회하지 않음. 이관에도 같은 토큰별 차단이 없음.
- 수정: 앱 상태 초기화 이전에도 실행 가능한 경량 tombstone 판독으로 `storedSessionToken`과 모바일 이관 경로에서 명시 로그아웃 A를 차단. 미래로 잘못 설정된 기기 시각의 tombstone 보호 유지. 다른 유효 토큰 C 및 PC 탭별 독립 로그인은 영향 없음.
- 실 브라우저 리로드, 이전 버전 aggregate tombstone, Web Locks 없는 모바일, 신규 공유 세션 C, future-dated tombstone, 정상 레거시 로그인 A를 분리 회귀.

## 제품 결함 ③ — 이전 로그아웃 지연정리가 PC 신규 세션 토큰을 삭제
- [제품 red CI #38196547217](https://github.com/eco-i/eco-i.github.io/actions/runs/38196547217): 다른 브라우저 탭이 Web Lock을 점유한 동안 이전 계정 A 로그아웃 후 PC 탭에서 신규 계정 B를 로그인하면, 대기하던 A cleanup이 B의 sessionStorage 토큰을 무조건 삭제. 실제 Chrome에서 B의 UI state는 유지되었으나 브라우저 토큰은 null로 확인됨.
- 원인: `clearStoredLoginSession(oldToken)`의 PC fallback이 oldToken과 실제 저장소의 토큰이 서로 달라도 신규 세션과 관리자 해제 토큰까지 무조건 제거.
- 수정: 대상 oldToken이 명확한 경우 현재 저장소의 정확히 일치한 oldToken만 삭제하고, 다른 토큰만 존재하면 그대로 둠. 대상 자체를 알 수 없는 복구 실패의 탭 전용 청소는 유지.
- 회귀: 실제 별도 2탭 Web Lock 큐에서 새 B의 탭 저장 토큰과 신규 관리자 unlock 둘 다 보존 확인. 새로고침 전후 세션 보안 인접 회귀 포함.

## 깊이 8단계 수행 및 회귀
1. **코드/원본 무결성:** HTML inline JS 파싱, 고유 DOM ID, 공식 baseline SHA 및 APP_VERSION, QA 제품 전체 바이트 검증.
2. **4조/대정비:** 2026~2027 2,920개 독립 근무일·조 시나리오, 2026-10-01~15 정비/휴무/C조 야간 검증.
3. **연차/장기근속:** 500개 독립 근태구간 fuzz, 11h/8h/0h·자정 교차·5년 기준 검증.
4. **로그인/인사/관리자:** 레거시 이관, 공유/임시 로그인, token tombstone, 관리자 unlock, 로그인 전환.
5. **RPC/세션 소유권:** 지문·근태 변경 요청/백업 등 민감 데이터 조회/일반 조회의 이전 토큰 차단, 저장 실패 주입.
6. **지문사진:** Chromium Canvas PNG→JPEG 실제 변환·서명 확인·잘못된 파일 거부.
7. **교차탭/동시성:** 실제 Web Locks 2탭·4탭, 오래된 로그아웃 후 최신 공유 세션 생존, localStorage clear, 저장소 토큰 우선순위 72조합.
8. **화면/수명주기:** 실제 2026년 10월 직원 달력 31일 렌더 및 320~1440px 반응형 7종, 브라우저 뒤로가기 PIN 비노출, 실제 모바일 재진입/새로고침.

## 최종 회귀 및 하네스와 제품 결함 구분
- 고정 후보 동일 SHA로 [Chrome #38196759672](https://github.com/eco-i/eco-i.github.io/actions/runs/38196759672) 및 [Chrome #38196849347](https://github.com/eco-i/eco-i.github.io/actions/runs/38196849347): 각 **163 PASS / 0 FAIL**.
- 초기 `migrateLegacySessionForDevice` 직접 호출 실패는 브라우저 잠금 컨텍스트 외부 실행으로 검사가 동작하지 않은 **하네스 문제**. 잠금 취득 보장 뒤 제품 결함 재현.
- 로컬 인증 달력 테스트 중 sessionStorage에 가상 PC 토큰을 기록하지 않아 내부 자동 전환에서 생긴 `Execution context was destroyed` 역시 **하네스 문제**, 가상 PC 토큰을 탭 저장소에 기록한 뒤 해결.
- SQLite/실 Supabase 관련 서버 검증 없음. GitHub Actions는 로컬 HTTP origin 실제 Chromium 및 모의 RPC를 사용. **실 Supabase RLS, 실 직원 인증 멀티유저, 실제 Android 카메라/파일선택, iOS Safari, Safari BFCache persisted=true, 운영 백업 복원**은 미검증.
- 시작본과 수정본을 대상으로 3개 패치 스크립트의 제한된 치환 5건을 순서대로 적용하여 최종 전체 문자열 일치 확인. 변경 범위는 세션 보안, 운영 UI 정책/SQL 이외.

## 다음 블록
- **2-8-240**, GitHub QA 브랜치 `qa-handoff/index.before-2-8-240.html`에서 시작. 깊이8 고정/최소20분 실제 검수/결함 즉시 수정·회귀/번호 연속. APP_VERSION·SQL·운영 배포 임의 변경 금지. ZIP 필요 없음.
