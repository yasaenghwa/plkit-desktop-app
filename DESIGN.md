# PLKIT Gateway v2 디자인 시스템

> 유일한 시각 계약: `개인폴더/PLKIT Gateway v2.dc.html` (이하 “원본”). 이 문서는 원본을 React/Electron으로 이관하기 위해 원본에 실제 존재하는 값만 정리하며, 별도의 미적 재해석을 허용하지 않습니다.

## 1. 분위기와 정체성

짙은 자주빛 캔버스 위에 반투명 흑자주 패널이 겹쳐지는 로컬 게이트웨이 운영 콘솔입니다. 시그니처는 라벤더 `#cebdff` 인터랙션, 민트 `#45dfa4` 정상 상태, 코랄 `#ffb4ab` 경고 상태가 명확히 분리되는 고밀도 데스크톱 셸입니다. 라임, 네온 그린, 임의의 브랜드 보라색을 추가하지 않습니다.

## 2. 색상

| 역할 | CSS 토큰 | 값 | 원본 출처 | 용도 |
| --- | --- | --- | --- | --- |
| Canvas | `--plkit-canvas` | `#141219` | 15, 27–28행 | 앱 바깥과 고정 셸 |
| Chrome surface | `--plkit-chrome` | `rgba(33, 30, 37, 0.9)` | 29, 582행 | 상·하단 바 |
| Sidebar surface | `--plkit-sidebar` | `rgba(33, 30, 37, 0.55)` | 46행 | 좌측 내비게이션 |
| Panel surface | `--plkit-panel` | `rgba(54, 52, 59, 0.4)` | 69행 외 반복 | 카드와 패널 |
| Panel strong | `--plkit-panel-strong` | `#2b2930` | 23, 104행 외 반복 | 입력, 내부 행, 세그먼트 트랙 |
| Bubble/elevated | `--plkit-elevated` | `#3b383f` | 510, 521행 | AI 버블과 아이콘 표면 |
| Modal | `--plkit-modal` | `#211e25` | 596행 | 모달 표면 |
| Log surface | `--plkit-log` | `#1d1a21` | 495행 | 시스템 로그 |
| Track | `--plkit-track` | `#36343b` | 87, 436행 | 진행률 트랙 |
| Text primary | `--plkit-text` | `#e6e0ea` | 27행 외 반복 | 제목과 본문 |
| Text secondary | `--plkit-text-muted` | `#cac4d4` | 34행 외 반복 | 레이블과 보조 문구 |
| Text info | `--plkit-text-info` | `#b7c8e1` | 163행 외 반복 | 모듈·정보 텍스트 |
| Accent | `--plkit-accent` | `#cebdff` | 16, 48행 외 반복 | 선택, CTA, 링크, 포커스 |
| Accent hover | `--plkit-accent-hover` | `#e0d5ff` | 16행 외 반복 | hover |
| Accent ink | `--plkit-accent-ink` | `#381385` | 196행 외 반복 | 라벤더 채움 위 텍스트 |
| Accent soft | `--plkit-accent-soft` | `rgba(167, 139, 250, 0.16)` | 704행 | 선택된 내비게이션 |
| Status success | `--plkit-success` | `#45dfa4` | 41, 681행 | 정상·온라인·성공 |
| Status danger | `--plkit-danger` | `#ffb4ab` | 37, 681행 | 경고·오프라인·실패 |
| Status warning | `--plkit-warning` | `#febc2e` | 32, 837행 | WARN 로그 |
| Window close | `--plkit-window-close` | `#ff736a` | 31행 | 창 장식 |
| Window minimize | `--plkit-window-minimize` | `#febc2e` | 32행 | 창 장식 |
| Window maximize | `--plkit-window-maximize` | `#19c332` | 33행 | 창 장식 |

색상 알파 변형은 위 역할의 `rgb()` 채널을 사용한 원본 값만 허용합니다. 컴포넌트에 라임 `#a8ff3e`, `#82d51f`, 임의 보라 `#9a7cff`, 임의 파랑 `#62b7ff`를 사용하지 않습니다.

## 3. 타이포그래피

| 단계 | 크기 | 굵기 | 사용 |
| --- | --- | --- | --- |
| Brand | 28px | 700 | 사이드바 PLKIT |
| Page title | 26px | 600 | 각 최상위 화면 제목 |
| Detail title | 24px | 600 | 장치·센서 상세 제목 |
| Metric value | 22px | 700 | Overview 요약 값 |
| Sensor value | 34px / 40px | 700 | 센서 카드 / 상세 값 |
| Body | 14–15px | 400–600 | 설명, 내비게이션, 채팅 |
| Caption | 12–13px | 400–600 | 메타데이터와 상태 |
| Overline | 11px | 600 | 패널 제목, 1.2px 자간, 대문자 |
| Micro | 10px | 500–700 | 보조 레이블과 태그 |

- 기본: `Inter`, `Malgun Gothic`, sans-serif (원본 12, 23, 27행)
- 로그: `ui-monospace`, `Menlo`, monospace (원본 495행)
- 숫자 상태값은 `font-variant-numeric: tabular-nums`를 유지합니다.

## 4. 간격과 레이아웃

- 기준 단위는 2px이며 원본에서 반복되는 간격은 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 30, 34px입니다.
- 바깥 stage는 화면 중앙에 `1440×920px` 셸을 배치합니다. 스케일은 `min((innerWidth - 32) / 1440, (innerHeight - 32) / 920, 1)`입니다 (원본 28, 639행).
- 상단 바는 44px, 사이드바는 224px, 하단 상태 바는 34px입니다.
- 상단 바와 사이드바는 고정되고, `26px 30px 34px` 패딩을 가진 콘텐츠 본문만 세로 스크롤합니다.
- 셸은 모바일 재배치하지 않습니다. 좁은 화면에서도 원본처럼 전체 1440×920 구성을 비율 축소합니다.
- 표준 패널 반경은 16px, 내부 행은 12px, 입력은 10px, 선택·CTA는 999px입니다.

## 5. 컴포넌트

### GatewayShell
- **구조**: stage → 1440×920 shell → 44px topbar + (224px sidebar + content/footer).
- **상태**: 크기 변경 시 scale만 갱신합니다.
- **레이아웃/스크롤**: 콘텐츠 본문만 scroll owner입니다.

### NavigationItem
- **구조**: 17px 선형 SVG + 레이블.
- **상태**: 기본은 투명/보조 텍스트, hover는 흰색 5% 표면, active는 라벤더 16% 표면과 라벤더 텍스트, focus는 2px 라벤더 outline.

### GlassPanel
- **구조**: 선택적 overline header + content.
- **표면**: `rgba(54,52,59,.4)`, blur 12px, 흰색 6% 테두리, 반경 16px.
- **상태**: 클릭 가능한 센서 패널 hover에서 라벤더 40% 테두리.

### SegmentedControl
- **구조**: `#2b2930` pill track + pill buttons.
- **상태**: active는 라벤더 배경과 `#381385` 텍스트, 기본은 투명/보조 텍스트.

### Status
- **변형**: success 민트, danger 코랄, warning 노랑, info 청회색, accent 라벤더.
- **접근성**: 색상과 함께 상태 문자열을 항상 표시합니다.

### DataRows / DataTable
- **구조**: 이름/값 행 또는 원본의 고정 grid column table.
- **상태**: 행 구분선은 흰색 5%, 클릭 가능한 장치 행 hover는 라벤더 8%.
- **레이아웃**: 표가 넘칠 때 표 내부가 가로 스크롤을 소유합니다.

### ImageSlot
- **구조**: 원본 `image-slot`의 이미지 미연결 상태를 표현하는 실제 DOM placeholder.
- **상태**: latest, timeline, camera-main 크기 변형. 실제 이미지 연결 전에도 원본 슬롯의 크기와 반경을 유지합니다.

### Toast / ModuleModal
- **상태**: toast는 2.8초 후 닫힘. 모달은 Later로 닫거나 Configure Device로 Devices 상세 화면을 엽니다.
- **접근성**: toast는 `role=status`, 모달은 `role=dialog`, focus 가능한 명시적 버튼을 사용합니다.

## 6. 모션과 상호작용

- 유일한 반복 애니메이션은 `plk-pulse`: opacity 1 → .35 → 1입니다.
- WebSocket live 1.6s, 오프라인 장치 1.6s, PENDING 1.2s, 신규 모듈/Cloud Syncing 1.4s입니다.
- Control은 클릭 즉시 PENDING으로 바뀌며 Pump/LED는 1.6초 뒤 actual state SUCCESS, Fan은 2.2초 뒤 TIMEOUT이 됩니다.
- Camera capture는 1.8초간 CAPTURING 상태 후 시각과 toast를 갱신합니다.
- `prefers-reduced-motion`에서는 pulse를 중지하되 상태 텍스트는 유지합니다.

## 7. 깊이와 표면

혼합 전략을 사용합니다. 표준 패널은 반투명 tonal shift + 1px 경계선 + 작은 2단 그림자, 셸은 `0 40px 90px rgba(0,0,0,.6)`, 모달과 toast는 라벤더 glow를 사용합니다. 원본에 없는 대형 카드 그림자나 라임 glow를 추가하지 않습니다.

## 8. 접근성 제약과 허용 부채

### 제약
- 모든 전환 요소는 `button`을 사용하고 현재 내비게이션은 `aria-current="page"`를 제공합니다.
- 키보드 focus는 원본의 2px 라벤더 outline을 유지합니다.
- 토글·세그먼트는 현재 상태를 `aria-pressed`로 제공합니다.
- 한글 설명은 의미 단위가 부자연스럽게 분리되지 않도록 충분한 너비를 유지합니다.

### 허용 부채

| 항목 | 위치 | 이유 | 종료 조건 |
| --- | --- | --- | --- |
| 1440×920 고정 셸 축소 | 전체 앱 | 원본과 동일한 출력이 이번 이관의 최우선 계약 | 별도 반응형 디자인 요청 시 |
| 카메라 이미지 placeholder | Overview / Camera / History | 원본도 런타임 `image-slot`에 외부 이미지가 주입되지 않으면 placeholder를 사용 | 실제 카메라 API 연결 시 |
| 데모 데이터와 타이머 | Control / Camera / Sync / Assistant | 원본의 데모 상호작용을 동일하게 이관 | 실제 Gateway API 연결 시 |
