# 3-8-26-001: aria-hidden/inert 상위 영역을 가진 요소를 유효한 포커스 대상으로 오판

- 분류: LOW / 팝업·키보드 접근성
- 관련 함수: `focusTargetUsable(el)` (`index.html`)
- 대상 브랜치: `qa-3-8`만. 운영 main·직원 DB/SQL 변경 **없음**.

## 재현 조건과 관찰
`focusTargetUsable`은 자신에게 직접 붙은 `aria-hidden=true`, disabled, display/visibility, bounding rect만 확인했다. 상위 요소의 `aria-hidden=true` 또는 `inert`는 검사하지 않았다.

실제 Chromium 144.0.7559.96, 격리 HTML 390x844에서 아래 7개 사례를 실제 브라우저 DOM으로 평가했다.

| 입력 조건 | 변경 전(유효로 판정?) | 변경 후 | 기대 |
|---|---:|---:|---:|
| 일반 보이는 버튼 | true | true | true |
| `aria-hidden=true` 상위 영역 안의 보이는 버튼 | **true** | false | false |
| `inert` 상위 영역 안의 보이는 버튼 | **true** | false | false |
| `display:none` 상위 영역 | false | false | false |
| `disabled` 버튼 | false | false | false |
| `visibility:hidden` 상위 영역 | false | false | false |
| `aria-hidden=false` 상위 영역 | true | true | true |

이러한 오판은 팝업 포커스 복귀·예약 콜백의 `focusTargetUsable` 조건을 통해 숨겨졌거나 비활성인 영역을 복귀 대상으로 간주할 가능성을 만든다. 앱 전체에서 사용자가 실제 이 경로를 밟는 빈도는 확인하지 않았으며, 물리 보조공학 환경을 통한 실사용 증명은 아니다.

## QA 수정
```js
// 조건 일부. 다른 코드는 변경하지 않음.
el.getAttribute?.('aria-hidden')!=='true'
  && !el.closest?.('[aria-hidden="true"],[inert]')
  && getComputedStyle(el).display!=='none'
```
가장 가까운 자신/상위 영역에 접근성 숨김·inert가 있는지 검사한다. `closest?.`는 모의 DOM에서 해당 API가 없을 때 기존 검사로 후퇴하는 방어 구문이다. **변경 +47자, focusTargetUsable의 단일 조건 표현식만 수정**.

## 확인
- 실제 GitHub JS 함수 고립검사 11/11 (비활성·미연결·직접/상위 숨김·inert·정상·closest 없음).
- 로그인 없이 독립 Chromium 실 DOM 7/7 기대값 검증.
- 실제 `openBackdrop`/`closeBackdrop`/PIN 클리어/잠금 등의 추출 소스 모의검사 14/14.
- 같은 소스의 `saveSelectedHolidayWork`와 가짜 RPC 16/16 (동일 날짜 중복 클릭 single-flight, 인사·권한·세션, 최신 조회 실패, CAS, 수정 거부, 실패/불확실 응답).
- `loadAnnualLeaveData`/`loadLongServiceData`와 가짜 RPC 12/12 (마지막 정상 데이터 보호, 연도 바뀜/세션 만료, 응답 파싱).
- 정적/구문/바이트 최소수정 32/32. 블록 범위 **92/92 PASS**.

PIN mock 첫 실행에서 `modal.getAttribute`, `clearBackdropSensitiveInputs` 스텁이 빠져 fixture 오류가 발생했으므로 해당 결과는 **무효**이며, 실제 초기화 함수를 포함하여 **14/14 재실행 검증** 후 집계. 제품 결함 오인 없음.

## 미확인/보호
- 전체 로그인 근무모아 Chromium 및 실물 Android/iOS, TalkBack·VoiceOver, Supabase 실계정·실 DB 행·실시간 공동 편집 검증은 미수행.
- 독립 Chromium 화면은 합성 DOM이며 운영 사이트를 로드하지 않았다.
- SHA 커밋 `1032c6e49f2db01b38d8c6c377e5f4db0318500c`, QA HTML blob `b65582e09c900785c79122217de8b705c069e166`. 운영 배포 및 실 직원 DB SQL·행 접근 **0건**.
