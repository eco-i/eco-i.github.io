# 근무모아 3차·깊이8 — 위험 기반 종료 게이트

> **QA-only 의사결정 보조. 3-8-53 현재 종료 확정 아님 / main 배포 승인 아님.**
> 대화 내 약 55~70블록은 추정치일 뿐 목표 개수·종료 보증이 아니다. 2차처럼 의미 없이 무기한 늘어나지 않도록 수치보다 남은 위험으로 종료 판단.

## 1. 코드 및 검수 관리 (GitHub에서 확인 가능)
- [x] 3차 각 공식 블록 결과·버전·제품 코드 blob·결함 목록을 `qa-round3/CURRENT_STATE.json`에 보존.
- [x] 수정 코드를 운영 main과 분리한 `qa-3-8` 브랜치에만 적용.
- [x] 블록별 실제 JS 원본 함수 isolated mock/정적 회귀 근거를 GitHub 보고서에 기록하고 E2E와 구분.
- [ ] **마지막 고위험 코드 수정 이후** 로그인/로그아웃, 일정·근태 저장/삭제, 관리자 PIN·권한, 지문사진, 모바일 복구, Realtime에 대한 *최종 통합 회귀* 확인.
- [ ] unresolved HIGH/CRITICAL 기능·세션/권한·근태 데이터손실 결함 0건임을 목록과 코드로 대조. 신규 MEDIUM은 실사용 영향에 따른 수정 또는 명시적인 수용 판단.
- [ ] 마지막 검수 범위에서 신규 결함 없는 2개 연속 **서로 중복되지 않는 위험 기반 CLEAN** 결과. 의미 없는 시나리오 복제로 CLEAN 횟수를 채우지 않는다.

## 2. 실제 브라우저 / 모바일 (격리 환경 필요; 현 단계 미실행)
- [ ] 동일 출처 Chrome 두 탭: PC 임시/로그인 유지/모바일 범위에서 로그인·동일 토큰 로그아웃·다른 토큰 전환, 구버전/신버전 탭 혼재 후 민감 UI/관리자 권한 즉시 폐기 확인.
- [ ] 실제 브라우저 Web Locks 허용/불가, 세션 저장소 quota/권한 오류, 실패 로그인 guard 잔존 뒤 재로그인/복원, 정상 자동업데이트/새로고침.
- [ ] Android/iOS 모바일/PWA foreground/BFCache/카메라 네이티브 picker와 첫 PIN 강제 변경, 관리자 2차 인증 복원/폐기.
- [ ] 열린 근태 양식과 지문사진을 둔 상태에서 세션 만료/기기 전환 시 누락 저장·민감 화면 유지가 없음을 육안/동작으로 확인.

## 3. 서버·데이터 경계 (운영 DB 절대 접근 금지)
- [ ] **독립된 QA Supabase/테스트 계정으로만** Realtime subscribe-after-snapshot, INSERT 연속·오프라인→재연결·느린 refresh와 계정 전환을 동시 검증.
- [ ] 업무 데이터 수정/삭제·백업복원 회귀는 **샘플 직원·가상 일정·가짜 지문 파일**만 사용. 실제 직원 DB나 운영 credential 연결 금지.
- [ ] 관련 DB/SQL 변동사항이 있다면 검수 브랜치에 별도 명시하고 운영 적용 전 별도 변경 관리; 이 블록은 SQL 변경 없음.

## 4. 승인/배포 (충족 전 main 병합 금지)
- [ ] 모든 미검증 항목을 완료하거나 **사용자와 범위/남은 위험을 명시적으로 합의**; 고위험 미검증을 CLEAN 판정으로 숨기지 않는다.
- [ ] 최종 QA blob/hash, 문서·접근제어·배포 버전/변경내역 일치, 기준 테스트 결과를 사용자에게 보고.
- [ ] **사용자의 명시적 최종 배포 지시가 있을 때만** 운영 `main`에 반영. 직원 기록·DB는 사전 백업/영향 범위 없이 변경하지 않음.

## 5. 블록 운영 원칙
1. 블록 하나마다 명확히 다른 기능/불변식/회귀 목적이 있어야 하며, 동일 유형 예외조건의 무한 확장 금지.
2. 신규 제품 결함과 미검증·환경 제한·test harness 오류를 분리.
3. 실제 사용자의 직원 DB/운영 main 보호가 우선이며, 연결 안정성·간결한 대화 보고·상세 GitHub 기록 유지.
4. **현재 종료 상태(3-8-53): 미충족.** 코드 단위 회귀는 상당수 통과했지만 실제 브라우저/서버 종단간 검증이 아직 남음.

초안 작성: 2026-10-20 18:20:51 KST, 3-8-43 범위.

## 3-8-45 추가 판단
- 신규 MEDIUM 3-8-45-001은 QA 브랜치에서 수정되고 격리 실제 함수 608개 검증에 통과했지만, 물리 Chrome 같은 출처 2탭/신구버전 혼재/서버 E2E 증빙을 대신하지 못한다.
- 격리 테스트 런타임 Chromium의 로컬 URL navigation이 `ERR_BLOCKED_BY_ADMINISTRATOR`로 차단돼 실제 브라우저 결론을 낼 수 없었다. 운영본이나 실 직원 데이터를 통해 우회 검증하지 않는다.
- 다음 블록은 동일 storage 경합의 무한 파생 대신 로그인·근태·지문·PIN·Realtime·대정비·연가의 서로 다른 통합 위험을 묶어 점검하며, 실제 격리 QA 환경 제공이 필요한 항목은 범위를 명확히 기록한다.

## 3-8-46 종료 게이트 추가 확인
- 46은 마지막 제품 수정(45) 이후 6개 서로 다른 프런트엔드 경계 1,062/1,062 source-based stub/mocks와 정적 RPC mutation 33종 보호 대조를 통과한 **코드 범위 CLEAN 1회**다.
- 실제 브라우저/QA-only Supabase 서버 end-to-end, 권한/PIN/실제 사진 카메라, 정비 SQL 동시성, 두 번째 *다른 위험* CLEAN은 여전히 [ ] 미완료. 46을 E2E CLEAN이나 종합 QA 종료로 해석하지 않는다.
- 다음 단계는 겹치지 않는 고위험 쓰기/권한·UI 복구 경계와 격리 실기기 테스트 선행조건 우선. main과 실 직원 DB 접근/변경 금지.

## 3-8-47 두 번째 *코드 범위* CLEAN 및 남은 게이트
- 46은 1,062개 연차/근태 등록·교대·지문 CAS·Realtime mock, 47은 265개 근태 삭제·PIN·계정 비활성·사진 Picker/BFCache 유사 복귀·RPC 늦은 응답 등 **다른 코드 영역**에서 CLEAN. 두 번의 CLEAN은 순수 소스 격리 검증만 의미하며 **완성 앱/실기기/E2E CLEAN으로 대체 불가**.
- 실제 Chrome 두 탭·구신 버전/권한/Web Locks, 물리 Android/iOS PWA, 가상 직원 DB와 분리 QA Supabase 동시 트랜잭션(휴근 SQL·대정비 관리자) 및 지문 가짜 사진, Realtime 신호, PIN 변경·근태 수정/삭제 결과 확인이 미완료.
- 종료 기준의 연속 CLEAN 체크박스는 E2E 부분까지 충족하는 종합 기준으로서 **아직 체크하지 않음**. 환경 없는 모의검수 무한 반복 대신 별도 격리 환경 확보/남은 위험 합의가 선행돼야 한다.
- 사용자 지시 없이는 운영 `main`이나 실제 직원 DB/인증정보/지문 사진 접근·배포 절대 금지.

## 3-8-48 실제 E2E 환경 게이트 확인
- [x] 기초 환경 실측 및 독립 QA 빌드용 fail-closed 도구 제공: `qa-round3/e2e/prepare-qa-site.mjs` (5 synthetic Node smoke results; 운영 project/key/service_role 거부).
- [x] 실제 서버/브라우저 P0 5건, P1 3건 및 실행 조건·증빙 계약 명세: `qa-round3/e2e/E2E_RUNBOOK.md`.
- [ ] 별도 순수 synthetic QA Supabase + 완성 기본 스키마 / 테스트 계정 확보. 연결 메타데이터에서 독립 QA 프로젝트 미발견; 기존 운영 Songdo DB 접근 금지.
- [ ] 해당 QA 서버에 격리된 브라우저 두 탭 및 Android/iOS PWA 접근. 현재 Playwright 시스템 Chromium의 file/data/localhost navigation은 ERR_BLOCKED_BY_ADMINISTRATOR.
- [ ] P0 실제 SQL/세션/권한 E2E PASS, P1 모바일·Realtime·근태·정비 PASS, 별도 E2E 기반 CLEAN 및 미해결 HIGH/CRITICAL 0. 46~47 code-scoped CLEAN을 실제 E2E CLEAN으로 착각 금지.
- 48은 **E2E BLOCKED, CLEAN 아님**. 운영 본DB/실 직원기록과 main 변경 없음. 별도 QA 프로젝트 생성에 따른 비용 및 권한은 사용자 승인 전 확정·집행 금지.

## 3-8-49 실제 E2E 실행 조건 갱신
- [x] QA 보조 도구의 modern publishable-key 호환성/QA ref 검증/운영 주소·키·secret 차단 보완, 합성 Node 안전 테스트 13/13 PASS.
- [x] HTML 문자 그대로의 RPC 71종과 GitHub 증분 SQL 16개 함수 정의를 정적 대조하여 3개 일치/68개 기본 계약 미수록 확인(운영 서버 상태를 뜻하지 않음). 합성 QA 전용 read-only catalog 검사 스크립트 작성.
- [ ] 독립 QA Supabase 신규 프로젝트와 가짜 직원만 있는 완전 기본 schema, 실제 브라우저/PWA/2탭 접근성, SQL concurrency/Realtime/지문/PIN/근태 E2E. 이 항목들 전부 미완료.
- **49는 QA 준비 완료 범위만 인정; E2E CLEAN/전체 종료/운영 배포 승인이 아님.** 별도 QA 프로젝트 비용과 과금은 사용자 명시 동의 전 집행하지 않는다.

## 3-8-50 QA 페이지 네트워크 격리 안전 검사
- [x] 격리 QA 사이트 생성물에 fail-closed `Content-Security-Policy` meta 삽입: QA project HTTP/WSS + 자체 출처만 connect-src 허용. 다른 CSP와 불완전한 HTML head 거부, QA 제목 표시.
- [x] Node v22 합성 로컬 fixture 안전 검사 15/15 PASS. **물리 브라우저 CSP enforcement나 실제 전체 앱 통과 의미 아님**.
- [ ] 독립 synthetic QA Supabase/완전 초기 schema/RPC 및 브라우저 동작, SQL concurrency, PIN, 근태, 지문, Realtime E2E. 사용자 승인 없는 새 과금 또는 운영 DB/직원기록 접근 금지.
- 결과: **50 QA 보조도구 범위 완료, E2E BLOCKED/NOT CLEAN. 3차 종료/운영 배포 승인 아님.**

## 3-8-51 synthetic Chromium CSP 직접 적용
- [x] 실제 Chromium 144에서 합성 QA 문서+CSP 인라인 DOM 렌더링 및 접속 정책 **11/11 PASS**: 가짜 비QA 네트워크·다른 project·CDN fetch·외부 script/image/frame/worker 차단, 지정 QA HTTPS/script CDN/data image 허용. 모든 네트워크 route aborted; 실 DB·자격증명 없음.
- [ ] 같은 출처 실제 앱 Chrome 두 탭/Web Locks/PWA·Android·iOS, QA WSS/Realtime·서버 RPC·DB 동시성 검증은 **여전히 미실행**. 실제 앱 전부를 검증했다는 의미 아님. WSS 허용·차단의 물리 handshake도 미검증.
- 51은 **브라우저 CSP 범위 PASS / 전체 E2E BLOCKED, CLEAN 아님**. 완전 독립 QA Supabase와 synthetic baseline 및 사용자 신규 프로젝트 승인 전 운영 DB/운영 main 접근 금지.

## 3-8-52 무료 로컬 개발환경 준비 게이트
- [x] Docker/Supabase CLI 설치가 없는 현재 도구 환경의 제약 실측. 로컬 가상 계정 전용 생성기(Node 15/15)와 127.0.0.1 정적 서버 테스트(7/7), Windows 시작 자동화 스크립트/실행 지침 GitHub QA 브랜치 준비.
- [ ] 사용자 Windows에서 Docker Desktop·Node·CLI 설치 후 **실제 Supabase local start 성공 확인** (지금은 미실행). Windows PowerShell 스크립트는 현재 컨테이너에서 동작 검증 불가.
- [ ] 독립 가상 직원 전용 필수 테이블·함수·권한/Realtime baseline schema 및 RPC 재현, 실제 2탭/모바일/E2E 결과 PASS. GitHub 증분 SQL만으로 부족.
- **3-8-52는 무료 로컬 환경 구성 코드/안전 테스트 범위의 준비 완료이며 전체 앱 E2E CLEAN 아님.** 클라우드 유료 서비스 신설/운영 DB/운영 main 변경 없음.

## 3-8-53 독립 무료 로컬 QA 보안 사전점검
- [x] 가짜 Docker CLI 응답 실제 Node child-process **12/12 PASS**; 실제 공개 포트를 Docker inspect로 확인하는 local-only port guard 파일 보존.
- [x] Windows 로컬 bootstrap이 docker host/context 환경 override를 시작 전에 거부하고, Supabase start 뒤 loopback-only published port 점검 실패 시 local stack stop하도록 수정.
- [ ] 물리 Windows에서 실제 Docker/Supabase start, 독립 synthetic DB schema·RPC, 실제 앱 로그인/근태/PIN/지문/2탭/Realtime E2E는 여전히 **미실행**.
- 공식 결과 **QA 도구 scoped PASS, 제품 E2E BLOCKED/NOT CLEAN**. 무료 로컬만·운영 DB/main 건드리지 않음.

## 2026-10-20 사용자 선택: 코드 범위 검수 조건부 종료·E2E 분리
- 상세: [3차 코드 검수 조건부 종료 보고서](ROUND3_CODE_REVIEW_CONDITIONAL_CLOSEOUT_20261020.md).
- **코드 수준의 반복 검수 작업만 중단**한다. 46/47의 서로 다른 mock/source-based CLEAN 2회 기록은 유지하되, 위 체크박스 중 **실제 통합 회귀·실브라우저·SQL/E2E·최종 배포 승인 항목은 모두 미달**이다.
- 마지막 공식 완료는 **3-8-53**, 예약된 `3-8-54`는 **시작하지 않음**. 기록상 결함 37종(HIGH 5, MEDIUM 22, LOW 10) 및 QA 수정 위치를 모두 종료 보고서에 인덱싱했지만 **실 E2E에서 해결 완료라고 단정하지 않는다**.
- 운영 `main`·실 직원 DB/SQL·실지문·로그인 정보, 배포는 보호 상태로 유지. 사용자의 이번 동의는 **검수 범위의 조건부 마무리 동의이지 위험 수용을 통한 배포 승인 아님**.
- 추후 가상 직원 전용 QA 서버/브라우저 접근이 확보되면 `E2E_RUNBOOK.md` P0 5건, P1 3건 검증 후 별도 배포 판단. 사용자 개인 PC에 Docker 설치를 지금 필수 요구하지 않음.
