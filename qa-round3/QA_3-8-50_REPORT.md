# 근무모아 3차·깊이8 — 3-8-50 공식 보고서

## 결과
- **3-8-50 QA 전용 테스트 페이지 안전장치 강화 완료 / 실제 E2E BLOCKED / NOT CLEAN.** 제품 신규 결함 **0종**, 3차 누적 신규 결함 **37종** 유지.
- QA `index.html` blob `08867d7117ad9ae5a8247eda8d223687af2b8411`, maintenance blob `f8e8e469503d0abf53844aa85188b15b09a95238`, APP_VERSION `ver20261018-2313` 변경 없음. 운영 `main` `6c784210e048426f18a486d5602652626d97574d` 및 직원 DB·운영 SQL/RPC/지문/배포 접근·변경 0.

## 검수 범위
1. 49 완료→50 시작 공식 상태와 운영/검수 분리 확인. 독립 QA Supabase와 빈 DB 설치용 완전 RPC 스키마 미확보 상태 재확인.
2. 사이트 원본의 CDN 스크립트(`cdn.jsdelivr.net`)·인라인 JS·Supabase HTTP+Realtime WebSocket·사진 미리보기 범위를 코드상 확인.
3. **QA 보조 도구 `qa-round3/e2e/prepare-qa-site.mjs`만 수정**: 독립 QA 생성 HTML의 `<head>` 최상단에 Content-Security-Policy 메타 태그 생성. `connect-src 'self' https://<QA project ref>.supabase.co wss://<QA project ref>.supabase.co`만 허용, jsdelivr는 script-src에서만 허용, 필요한 인라인 JS/CSS와 data/blob 이미지 허용, object/frame/worker 및 나머지 연결 차단. 제목은 `[격리 QA] 근무모아`.
4. HTML head가 없거나 기존 CSP가 있어 충돌할 수 있으면 자동 수정하지 않고 거부. 기존 QA URL/키와 프로젝트 ref 대조, 운영 URL/공개키/secret 차단, static companion asset 검사 유지.
5. **Node v22 실제 로컬 child_process/합성 파일 실행 15/15 PASS**: 기존 13개 보안경계/정상생성 검증과 head 누락·기존 CSP 거부 2개. 정상 생성 HTML에서 CSP/QA URL·WSS/스크립트/미리보기/차단 정책·QA 표시를 확인. 테스트용 계정·URL·키는 모두 합성. 외부 네트워크 호출, 실제 DB 연결 0.
6. 별도의 물리 Chrome·Android·iOS나 독립 QA Supabase를 사용한 실제 전체 앱 E2E **미실행**. CSP 메타 문자열 존재 검증으로 브라우저에서 차단이 실제 동작하는지 또는 페이지 전체가 정상 작동하는지는 확인할 수 없음.

## 실제 종료 게이트
- 46~47 코드 격리 영역 CLEAN 2회와 48~50 인프라 준비 성과는 **실제 종단간 CLEAN이 아님**.
- 사용자 비용·권한 동의 이후 완전 별도 Supabase 프로젝트/합성 기본 스키마(기존 incremental migration 16개만으로는 app RPC 71종 중 3종 이름만 일치), QA 직원 테스트 계정, 실제 동일출처 두 탭/모바일 환경이 준비되어야 SQL 경쟁·관리자 PIN·근태 저장/삭제·지문사진·Realtime P0/P1을 실측 가능.
- 승인 없이 유료 클라우드 프로젝트 생성·운영 DB/직원 백업 복제·main 병합 금지. 더 많은 mock 블록으로 위험을 덮지 않고 실제 테스트 환경 준비를 다음 실질 단계로 남김.

기록 KST: 2026-10-20T21:28:39+09:00.
