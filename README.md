# PLKIT 데스크톱 대시보드

PLKIT는 스마트팜 데이터를 모니터링하고 장치를 제어하기 위한 데스크톱 대시보드의 기반 프로젝트입니다. 현재 저장소에는 Electron과 React 개발 환경, 그리고 최소 Dashboard 화면만 포함되어 있습니다. 센서나 외부 서비스에는 아직 연결하지 않습니다.

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
├── app/
│   ├── providers/
│   ├── styles/
│   └── index.tsx
├── pages/
│   └── dashboard/
├── widgets/
├── features/
├── entities/
└── shared/
    ├── api/
    ├── config/
    ├── lib/
    ├── types/
    └── ui/
```

FSD는 `src/renderer`에만 적용합니다. `main`과 `preload`는 Electron 프로세스 코드이므로 FSD 레이어 밖에 둡니다. 상위 레이어는 하위 레이어를 참조할 수 있지만, 하위 레이어는 상위 레이어를 참조할 수 없습니다. 각 슬라이스는 `index.ts`를 공개 API로 사용합니다.

사용 가능한 renderer 경로 별칭은 `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`입니다. TypeScript와 Vite 모두 같은 별칭을 해석하며, ESLint가 별칭을 이용한 역방향 의존성을 검사합니다.

## 의도적으로 제외한 범위

이번 초기 환경 구성에는 센서 모니터링, MQTT/WebSocket/HTTP 연결, 장치 제어, 영상 스트리밍, Node-RED, AI 예측, 챗봇, 커뮤니티, 배포 설치 파일, 코드 서명, 자동 업데이트, CI/CD를 포함하지 않습니다.
