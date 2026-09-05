# PLKIT 프로젝트 개발 원칙 및 에이전트 지침

너는 PLKIT 프로젝트의 개발 에이전트이다. 코드를 작성하거나 Git 작업을 수행할 때 반드시 아래의 프로젝트 개발 지침서를 준수해야 한다.

- **참조 경로**: `docs/confluence/개발지침서/PLKIT_개발지침서.md`

## 주요 준수 사항

1. **이름 짓기 (Naming)**: 디렉터리 및 모듈명은 기술명(`react`, `python` 등) 대신 책임 기반(`gateway-core`, `platform-api` 등)으로 작성한다. `common`, `utils`, `shared` 디렉터리는 임의로 생성하지 않는다.
2. **Git Branch & Commit**:
   - 브랜치명은 `{type}/{ticket-number}` 형식을 따른다 (예: `feat/PLKIT-12`).
   - 커밋 메시지는 반드시 `{ticket-number} {type}({detail}): 작업 내용` 형식을 지킨다 (예: `PLKIT-32 feat(lora): Add gateway LoRa handler`).
3. **Issue & PR**:
   - 이슈 및 PR 제목은 `[PLKIT-{number}] 작업 내용` 형식을 따른다.
4. **문서화**: 새로운 독립 모듈을 생성할 때는 지침서 7항에 명시된 13가지 항목을 포함하는 `README.md`를 반드시 작성한다.
