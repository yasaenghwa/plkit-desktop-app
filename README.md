# PLKIT 데스크톱 대시보드

PLKIT는 스마트팜 데이터를 모니터링하고 장치를 제어하기 위한 데스크톱 대시보드 프로젝트입니다. Electron과 React 기반의 정적 대시보드 프로토타입을 Feature-Sliced Design(FSD)에 맞춰 구성했습니다. 현재 화면은 목업 데이터를 사용하며 센서, 게이트웨이, MQTT, 데이터베이스 또는 외부 서비스와는 아직 연결하지 않습니다.

## 현재 구현 범위

사이드바에서 아래 8개 화면을 전환할 수 있습니다. 별도의 라우팅 라이브러리 없이 Dashboard Page가 현재 화면 상태를 관리합니다.

| 화면          | 주요 내용                                                               |
| ------------- | ----------------------------------------------------------------------- |
| Overview      | 게이트웨이·장치·동기화 요약, 환경 센서 값, 액추에이터 상태, 최근 이벤트 |
| Devices       | 장치 유형 필터, 장치 상세·메타데이터 폼, 신규 모듈 감지 모달            |
| Monitoring    | 센서 목록, 선택 센서 상세 정보와 정적 추이 차트                         |
| Control       | 펌프·조명·팬 제어 UI, 명령 이력과 결과 토스트                           |
| Growth Camera | 카메라 상태, 촬영 이미지 영역, 촬영·동기화 동작 UI                      |
| History       | Sensor·Actuator·Camera·Event 탭별 이력과 정적 차트·테이블               |
| System        | Gateway·Network·MQTT·Central Sync·Logs 상태와 로그 필터                 |
| AI Assistant  | 현재 농장 컨텍스트, 알림, 입력 메시지에 대한 모의 답변                  |

화면 전환, 필터, 탭, 장치 상세 보기, 모달, 토스트, 폼 입력과 같은 프런트엔드 상호작용은 동작합니다. 다만 표시 데이터와 작업 결과는 모두 프런트엔드에 정의된 정적 데이터 또는 로컬 React 상태이며 실제 장치 명령이나 데이터 저장은 수행하지 않습니다.

## 실행 환경

- Node.js `>=20.0.0 <21`
- npm 10 이상

현재 도구 체인은 프로젝트 개발 환경의 Node.js 20.10과 호환되는 `electron-vite@3`을 사용합니다. `electron-vite@4` 이상을 도입하려면 Node.js를 20.19 이상으로 올려야 합니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

`npm run dev`는 Vite 렌더러 개발 서버를 시작하고 로컬 Electron 창을 엽니다. 창에는 **PLKIT Desktop Dashboard** 초기 화면이 표시됩니다.

개발 설정은 Electron 시작 전 호스트의 `ELECTRON_RUN_AS_NODE` 값을 제거합니다. 이 값이 설정되어 있으면 Electron이 main 프로세스를 일반 Node.js로 실행해 `BrowserWindow`를 사용할 수 없게 됩니다.

## 명령어

| 명령어                 | 설명                                             |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | 개발 모드로 Electron 애플리케이션 실행           |
| `npm run build`        | main, preload, renderer를 `out/`에 프로덕션 빌드 |
| `npm run preview`      | 프로덕션 빌드를 로컬 Electron으로 실행           |
| `npm run typecheck`    | 파일을 생성하지 않고 엄격한 TypeScript 검사 수행 |
| `npm run lint`         | ESLint 및 FSD 별칭 import 규칙 검사              |
| `npm run format`       | Prettier로 프로젝트 파일 포맷                    |
| `npm run format:check` | 파일을 수정하지 않고 Prettier 포맷 검사          |

## 프로세스 구조와 보안

```text
src/
├── main/
│   └── index.ts       # Electron 생명 주기와 BrowserWindow 생성
├── preload/
│   └── index.ts       # 현재 API를 노출하지 않음, 향후 IPC는 contextBridge 사용
└── renderer/          # Node.js API에서 분리된 React 애플리케이션
```

`BrowserWindow`에는 `contextIsolation`과 `sandbox`를 활성화하고 `nodeIntegration`은 비활성화했습니다. 개발에서는 로컬 Vite 개발 서버만, 프로덕션에서는 생성된 로컬 HTML만 로드합니다. renderer는 Node.js API를 직접 import하면 안 됩니다. 향후 IPC는 preload의 명시적인 `contextBridge` 계약을 통해서만 추가합니다.

## renderer FSD 구조

```text
src/renderer/
├── app/                                  # 애플리케이션 초기화
│   ├── providers/
│   │   └── index.ts
│   ├── styles/
│   │   └── global.css                    # 전역 토큰과 공통 화면 스타일
│   └── index.tsx                         # React 진입점, DashboardPage 렌더링
├── pages/
│   └── dashboard/                        # 대시보드 전체 화면 조합과 내비게이션
│       ├── model/
│       │   └── dashboard-navigation.ts   # 화면 ID와 사이드바 메뉴 정의
│       ├── ui/
│       │   ├── dashboard-page.css
│       │   └── dashboard-page.tsx        # 레이아웃, 화면 전환, 공통 상태 관리
│       └── index.ts
├── widgets/                              # 화면별 독립 UI 섹션
│   ├── assistant/
│   │   ├── ui/assistant-section.tsx
│   │   └── index.ts
│   ├── camera/
│   │   ├── ui/camera-section.tsx
│   │   └── index.ts
│   ├── control/
│   │   ├── ui/control-section.tsx
│   │   └── index.ts
│   ├── devices/
│   │   ├── ui/devices-section.tsx
│   │   └── index.ts
│   ├── history/
│   │   ├── ui/history-section.tsx
│   │   └── index.ts
│   ├── monitoring/
│   │   ├── ui/monitoring-section.tsx
│   │   └── index.ts
│   ├── overview/
│   │   ├── ui/overview-section.tsx
│   │   └── index.ts
│   ├── system/
│   │   ├── ui/system-section.tsx
│   │   └── index.ts
│   └── index.ts
├── features/
│   └── index.ts                          # 향후 사용자 기능 단위 확장 지점
├── entities/
│   ├── farm/
│   │   ├── model/dashboard-data.ts       # 센서·장치 타입과 목업 데이터
│   │   └── index.ts
│   └── index.ts
└── shared/
    ├── api/index.ts                      # 향후 외부 통신 공통 계약
    ├── config/index.ts                   # 공통 설정 공개 API
    ├── lib/index.ts                      # 범용 기반 로직 공개 API
    ├── types/index.ts                    # 공통 타입 공개 API
    └── ui/
        ├── dashboard-primitives.tsx      # Panel, Badge, Chart 등 UI 기본 요소
        └── index.ts
```

FSD는 `src/renderer`에만 적용합니다. `main`과 `preload`는 Electron 프로세스 코드이므로 FSD 레이어 밖에 둡니다.

레이어별 책임은 다음과 같습니다.

- `app`: 전역 스타일과 애플리케이션 진입점을 관리합니다.
- `pages`: 여러 widget을 조합하고 페이지 수준의 내비게이션과 상태를 관리합니다.
- `widgets`: Overview, Devices 등 사용자가 보는 독립적인 화면 섹션을 구성합니다.
- `features`: 재사용 가능한 사용자 행동 단위를 위한 레이어이며 현재는 확장 지점만 마련되어 있습니다.
- `entities`: 농장 센서·장치 도메인 타입과 목업 데이터를 제공합니다.
- `shared`: 특정 도메인에 종속되지 않는 UI 기본 요소와 기반 모듈의 공개 API를 제공합니다.

상위 레이어는 하위 레이어를 참조할 수 있지만, 하위 레이어는 상위 레이어를 참조할 수 없습니다. 각 슬라이스는 `index.ts`를 공개 API로 사용해 내부 구현 파일에 직접 의존하지 않도록 구성합니다.

사용 가능한 renderer 경로 별칭은 `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`입니다. TypeScript와 Vite 모두 같은 별칭을 해석하며, ESLint가 별칭을 이용한 역방향 의존성을 검사합니다.

## 의도적으로 제외한 범위

현재 정적 프로토타입에는 실제 센서 데이터 수집, MQTT/WebSocket/HTTP 연결, 장치 제어 명령 전송, 영상 스트리밍, 데이터 영속화, Node-RED 연동, AI 모델 연동, 중앙 플랫폼 동기화, 배포 설치 파일, 코드 서명, 자동 업데이트, CI/CD를 포함하지 않습니다.
