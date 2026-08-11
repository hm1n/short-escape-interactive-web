# Short Escape Interactive Web

쇼츠를 끊기 어려운 이유를 「켤 때 → 볼 때 → 다시 켤 때」의 흐름으로 풀어낸 인터랙티브 스크롤 웹페이지입니다. 독자가 페이지를 넘기는 행동 자체를 쇼츠의 스와이프 경험과 연결하고, 마지막에는 페이지에서의 행동 기록을 영수증 형태로 되돌려 줍니다.

## 주요 기능

- 12개 장면으로 이어지는 세로 스크롤 스토리텔링
- 스마트폰 화면을 연상시키는 반응형 카드 UI와 스크롤 스냅
- 체류 시간, 스와이프 수, 구간별 체류 시간을 보여 주는 실시간 HUD
- 상황 선택 칩, 랜덤 보상 슬롯, 이용 시간 계산기 등 장면별 인터랙션
- 사용자의 선택과 페이지 이용 기록을 모은 세션 영수증
- Canvas 기반 영수증 PNG 저장 및 지원 기기의 파일 공유
- `prefers-reduced-motion`과 탭 비활성 상태를 고려한 애니메이션·타이머 처리

모든 측정값은 브라우저 메모리에만 유지되며 새로고침하면 사라집니다. 영수증 이미지도 브라우저에서 로컬로 생성됩니다.

## 실행 방법

### Vite 개발 환경

Node.js가 설치되어 있어야 합니다.

```bash
cd vite-app
npm install
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다.

프로덕션 빌드와 빌드 결과 미리보기는 다음과 같습니다.

```bash
npm run build
npm run preview
```

### 단일 HTML로 실행

루트의 `index.html`은 CSS, JavaScript, 이미지를 포함한 독립 실행형 파일입니다. 별도의 빌드 없이 브라우저에서 바로 열 수 있으며 한 파일로 공유할 수 있습니다.

## 프로젝트 구조

```text
.
├── README.md
├── CLAUDE.md                  # 콘텐츠 기획, 디자인 원칙, 기술 사양
├── index.html                 # 독립 실행형 단일 HTML 버전
└── vite-app/
    ├── index.html             # 페이지 마크업
    ├── public/img/            # 장면 이미지
    ├── src/main.ts            # 상태 관리와 인터랙션
    ├── src/style.css          # 레이아웃, 디자인, 애니메이션
    ├── package.json
    └── vite.config.ts
```

## 기술 스택

- HTML5
- CSS3
- TypeScript
- Vite 5
- Canvas API
- Intersection Observer / Resize Observer
- Web Share API

런타임 프레임워크는 사용하지 않으며, 외부 리소스는 Google Fonts를 사용합니다.

## 구현 메모

- 실제 스크롤 컨테이너는 `body`가 아닌 `#scroller`입니다.
- 모바일 브라우저 높이에 대응하기 위해 `100dvh`를 사용합니다.
- 긴 장면에서 사용자가 갇히지 않도록 `scroll-snap-type: y proximity`를 사용합니다.
- 탭이 숨겨진 동안에는 체류 시간 측정을 멈춥니다.
- 모션 감소 설정에서는 애니메이션을 끄고 콘텐츠를 즉시 표시합니다.
- 최종 영수증은 화면 캡처가 아니라 동일한 세션 데이터를 Canvas에 다시 그려 생성합니다.

콘텐츠의 서사 순서, 수치 출처, 디자인 토큰과 핵심 인터랙션을 변경할 때는 먼저 [`CLAUDE.md`](./CLAUDE.md)의 기획 및 기술 사양을 확인해 주세요.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run build` | 프로덕션 번들 생성 |
| `npm run preview` | 생성된 번들 로컬 미리보기 |

## 참고

- 일부 공유 기능은 `navigator.canShare({ files })`를 지원하는 브라우저에서만 표시됩니다.
- 페이지 내 이용 시간 관련 수치는 조사 자료와 추정치를 함께 사용합니다. 상세 출처와 환산 기준은 `CLAUDE.md`에 정리되어 있습니다.
