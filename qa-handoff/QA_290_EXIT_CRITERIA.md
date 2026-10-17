# 근무모아 2차·깊이8 — 2-8-290 종료심사 승인 기준

## 목적 및 구분
- **2차 자동화·브라우저 검수 종료**와 **실제 운영 배포 승인**은 다르다.
- 무결함 연속 횟수만으로 종료하지 않는다. 사용자가 요구한 High·깊이8·실제 20분 이상 회귀검사, 259~289 연속 결함 0종, 독립 종료 적합성 점검, GitHub 공식 증빙과 남은 제약을 함께 확인한다.
- 이 문서는 종료 조건을 결과 확인 **전에** 고정한다. 조건을 사후 완화하지 않는다.

## 종료 승인 필수 조건 (모두 만족)
1. 검수 기준본 `qa-handoff/index.before-2-8-290.html`과 `index.html`의 SHA256/byte가 공식 289 동일본(1,175,136 bytes, SHA256 `19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af`)이며, 운영 main과 APP_VERSION/SQL/실배포가 불변.
2. GitHub의 258 공식 결함 +1, 259~289 **31개 연속** COMPLETE/CLEAN·제품 신규 결함 0종, 누적 **540종**을 회귀 증빙/manifest/report와 대조. QA 실패 원본은 절대 삭제/소급 성공 처리하지 않음.
3. **290** 종료 심사 신규 독립 검사: 31개 보고서·매니페스트 연속성, 범위별 회귀 증빙, 실패 이력 보존, 핵심 앱의 Chromium PC/모바일 부팅 및 주요 기능 계약의 날짜·시간대 경계, JS 오류·SHA 확인.
4. 290 전체 기존 검수 범위 **High·깊이8 유지**, 23종 전면 회귀를 반복하고 실제 **1,200초 이상** 검수. 전체 GitHub Actions **26개 Job 모두 SUCCESS**, preflight **16 PASS/0 FAIL**, cross-tab 원본 **168 PASS/0 FAIL**, 모든 독립 회귀 검사군 실패 0.
5. 제품 결함 발생 시 즉시 수정·회귀; 미해결 제품 결함 또는 심각한 현재 회귀 실패 시 종료 승인 **보류** (새 블록 번호만 무한히 늘리지 않음).
6. 종료심사 결과·남은 위험·배포 전 실단말/실인증 점검표·SHA·증거를 GitHub에 기록, 후속 SHA/실제 Chromium 인계검사 **14 PASS/0 FAIL**.

## 범위별 증빙 매핑
- 교대·일근·대정비·공휴일·달력 UI: QA_283, 기존 QA_256_FULL/QA_260_GLOBAL_TIMEZONE.
- 근태·종일/시간 부재·연가 산출·경계: QA_285/286, QA_256_ANNUAL_LEAVE_MATRIX.
- 인사·입퇴사·발령 시간순위·재직구간: QA_287/280/281/279.
- 휴일근무 인정 및 초과근무 조출/야근·월별확정: QA_288/289, QA_260_OVERTIME_HOLIDAY.
- 지문 출퇴근 사진/파일선택·뷰어·모달/보안/관측: QA_277/278/282, QA_273~276, QA_259_FINGERPRINT, QA_256_PICKER_REAL/IMAGE_PIPELINE.
- 세션 무효화·교차탭·권한/RPC·불변키: QA_271/272/276, QA_256_RESTORE_RACE/ADMIN_SECURITY.
- 백업/복원·파일·오류 처리: QA_256_BACKUP_PROPERTY/RESTORE_GUARD/CODEC_FUZZ, QA_258_BACKUP_ROUNDTRIP.
- 반응형·접근성·상호작용: QA_260_RESPONSIVE, QA_256_FULL, QA_256_REAL_BOOT.
- 고정된 테스트 입력과 모의 RPC에 의존하는 결과는 실제 운영 API/RLS·Native OS 검사로 보증하지 않음.

## 2차 자동화 검수 종료 후에도 **운영 배포 전 필수**인 실환경 검증
- [ ] 별도 테스트 계정 2개 이상 사용, 실제 Supabase Auth/RLS 관리자/일반직원 권한 및 행 단위 타 직원 자료 격리 (운영 개인정보 사용 금지).
- [ ] 실제 Android·iOS 모바일 기본 카메라/파일 선택기, 업로드 및 재로그인/백그라운드 복귀.
- [ ] 탭간/기기간 실제 로그아웃과 복원 도중 세션 교체, 오래된 토큰의 미리보기/업로드 차단. 비정상 raw `localStorage` SESSION_KEY 외부삭제는 별도 위험 시나리오.
- [ ] staging/샌드박스 DB로만 백업·복원 왕복, RLS/전송 용량/충돌 확인. **운영 DB에 파괴적 복원 수행 금지.**
- [ ] 실기기 BFCache/페이지 재개, 통신 중단·느린 업로드·이미지 실패/권한 거부.
- [ ] 이 실환경 확인과 롤백 방안·운영 반영 승인을 얻기 전에는 **운영 배포 승인 보류**. 2차 검수 자체는 미검증 영역을 명시하고 조건부 종료 가능.

## 판정표
- `AUTOMATED_QA_EXIT=APPROVED` : 위 1~6 모두 충족; 검증한 Chrome/모의 RPC 범위의 2차 검수 종료.
- `AUTOMATED_QA_EXIT=HOLD` : 필수 조건 중 하나라도 미충족. 반드시 이유와 재현·후속 조치를 남김.
- `PRODUCTION_RELEASE=NOT_APPROVED_PENDING_REAL_WORLD_SMOKE` : 위 실환경 미검증 사항이 남아 있는 한 자동화 검수 종료와 관계없이 유지.

## 원본 이력 보존
265 raw SESSION_KEY 직접삭제/로그아웃 tombstone 간헐 RED, 270 picker 초기 RED, 273 2탭 초기 취소, 276 초기 preflight/모달 오류 및 cross-tab timeout, 282 cross-tab navigation-context RED, 284 QA harness SyntaxError 첫 CI 실패를 삭제·소급 GREEN 처리하지 않는다.
