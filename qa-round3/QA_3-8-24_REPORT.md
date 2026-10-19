# 근무모아 3차·깊이8 — 3-8-24 공식 보고서

## 공식 판정
- **3-8-24 완료: 신규 확정 제품 결함 2종(3-8-24-001, 3-8-24-002), 모두 LOW, QA 코드 수정.**
- 3차 누적 **15종** (직전 13 + 신규 2). 2차 과거 이력 540종 별도.
- QA 브랜치 `qa-3-8`, `index.html` 팝업 열기 1곳·닫기 1곳만 변경. 커밋 `f40043e73161a5ee47b03888155288f35a1f7b97`, blob `32b345b52f33de26fb17d88655abca9ee24385cc`; 기존 `3-8-23` fix 보존.
- 운영 `main` SHA `6c784210e048426f18a486d5602652626d97574d`, 운영 앱 버전 `ver20261018-2313` 미변경. 실제 직원 DB/감사 데이터 조회·DML·DDL 및 SQL 실행 **0건**.
- **유효 격리·독립 시험 82/82 PASS**: 팝업 시퀀스 27 + 모의 경계 7 + Tab/Escape 14 + 정적 회귀 30 + 독립 Chromium 원본·수정 비교 4. 전체 앱/현장 E2E CLEAN 판정 아님.

## 깊이 8단계
1. **공식 GitHub 인계 확인**: `qa-round3/CURRENT_STATE.json`, `START_HERE_NEW_CHAT.md`, `QA_3-8-23_REPORT.md` 확인. 마지막 23/다음 24/누적 13/QA HTML blob `4fc8dcbde1bb9c9a85f637921db0ed872b6a57f4` 검증 후 시작.
2. **팝업 재열기**: `openBackdrop`에서 이미 열려 있던 A를 B 위로 올리면 aria-hidden 된 B에 포커스 잔류. 원본 JS 모의 DOM과 Chromium 390×844 DOM 재현. QA 수정에서 최상위 팝업 밖에 포커스가 남아 있으면 `focusTopBackdrop`로 이동.
3. **부모 우선 닫기**: A→B 이후 A를 먼저 닫고 B를 닫으면 B의 복귀 위치가 닫힌 A 내부를 가리켜 원래 트리거가 아닌 BODY에 초점 잔류. 독립 Chromium 원본/후보 실험 재현. QA에서 A의 복귀 위치를 B 등 자식 저장값에 승계하여 복구.
4. **3중 중첩·지연 타이머**: 실제 GitHub JS 소스 open/close/top/focus/aria 함수와 모의 DOM·타이머로 빠른 A/B/C 열기·닫기, 앞선 팝업 재열기/중간 닫기, 전부 닫기를 다룬 27개 시퀀스 점검. 원본 15/27, 수정 27/27 정상. `3-8-23` 지연 포커스 guard 유지.
5. **잠금·정상 동작 보존**: 같은 최상단 팝업 재열기는 현재 포커스를 유지, 배경 팝업 재열기 즉시 초점 이전, 부모 우선 닫기 시 복귀 위치 상속, pending 작업 중 닫기 차단, 마지막 닫기 body unlock, 오래된 open 타이머의 초점 비탈취 등 7/7 유효 경계 검사.
6. **Tab/Shift+Tab/Escape**: 원본 `document.addEventListener('keydown')` 핸들러 추출 후 모의 focusable 요소들로 14/14 유효 검사 PASS. Top 모달, busy 닫기 거부, 범위 밖 포커스 복귀, 일반 키 무시, 빈 focusable 등에 대한 동작 포함.
7. **정적·파싱·기존 저장보호 회귀**: 패치 2곳만 변경되는 바이트 대조, HTML inline JS 2개 구문 파싱, DOM ID 488개 유일, 팝업 zIndex/aria-modal/aria-hidden/lock, 휴근 expected ID/timestamp CAS·관리자/세션 경계, 연차/장기재직 stale snapshot·RPC 결과·재조회 실패 가드 등 **30/30 PASS**. 실제 RPC/SQL 실행은 하지 않았음.
8. **결함 구분·최종 보호**: 최초 모의 테스트에서 버튼/원래 트리거가 `HTMLElement`가 아니어서 `instanceof HTMLElement` 판정이 false인 fixture 오류를 원본 앱 결함에서 배제. 해당 fixture를 수정한 뒤 27/27·7/7 재실행. 독립 Chromium은 실제 DOM에서 수행했지만 **전체 근무모아 앱을 로그인하거나 연결된 Supabase를 접근하는 통합시험이 아님**. 수정 및 상세 결함 보고는 QA 브랜치에만 저장.

## 미검증과 다음 범위
- 운영 앱과 동일한 완전체 로그인 Chromium, 모바일 Android/iOS, TalkBack/VoiceOver, 실제 교대·인사발령 DB 경합, 휴근/연차/장기재직 RPC end-to-end는 검증되지 않음.
- **3-8-25 권고**: 닫힌 팝업을 바로 다시 열 때의 늦은 콜백/포커스 소유권, 관리자 PIN/권한 변경 중 겹친 팝업과 Realtime, 휴근 수정·삭제의 인사발령 시점 CAS, QA 격리 환경 확인. 실제 직원 DB는 계속 보호.
