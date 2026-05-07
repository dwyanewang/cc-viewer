# CC-Viewer

Claude Code를 기반으로 직접의 개발 경험을 증류하여 축적한 Vibe Coding 도구입니다:

1. 능력 한계 끌어올리기 — /ultraPlan과 /ultraReview를 로컬에서 실행할 수 있어, 프로젝트 코드를 Claude 클라우드에 완전히 노출시키지 않아도 됩니다;
2. 멀티 디바이스 동시 지원 — 로컬 네트워크 내에서 모바일 프로그래밍이 가능하며, 웹 버전은 다양한 시나리오에 자동 적응하여 브라우저 확장 프로그램이나 OS 분할 화면에 손쉽게 임베딩할 수 있고, 네이티브 설치 프로그램도 제공합니다;
3. 완전한 로그 추적 — Claude Code 페이로드를 완전히 가로채고 분석하는 기능을 제공하여, 로깅, 문제 분석, 학습, 리버스 엔지니어링에 최적입니다;
4. 학습 경험 공유 — 풍부한 학습 자료와 개발 경험을 축적해 두었습니다(시스템 곳곳의 "?" 아이콘을 참고하세요);
5. 네이티브 경험 유지 — Claude Code의 능력을 강화할 뿐, 코어에는 어떠한 실질적인 수정도 가하지 않아 네이티브 경험을 유지합니다;
6. 서드파티 모델 지원 — deepseek-v4-*, GLM 5.1, Kimi K2.6을 지원하며, cc-switch 기능을 내장하여 언제든지 서드파티 도구로 핫 스위칭할 수 있습니다.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | 한국어 | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## 사용 방법

### 사전 준비

- Node.js 22.0.0+ 가 설치되어 있는지 확인하세요; [다운로드 및 설치](https://nodejs.org)
- Claude Code가 설치되어 있는지 확인하세요; [설치 가이드](https://github.com/anthropics/claude-code)

### ccv 설치

#### npm으로 설치

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Homebrew로 설치 (macOS / Linux 권장)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # 업데이트용 — brew 설치에는 npm install -g를 사용하지 마세요
```

### 실행 방법

ccv는 claude의 드롭인 대체품입니다 — 모든 인수가 claude에 전달되는 동시에 Web Viewer가 실행됩니다.

```bash
ccv                    # == claude (interactive mode)
```

작성자가 가장 자주 사용하는 명령은 다음과 같습니다:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv는 Claude Code의 모든 실행 인수를 그대로 전달하므로, 자유롭게 조합하여 사용할 수 있습니다
```

프로그래밍 모드로 시작하면 웹 페이지가 자동으로 열립니다.

CC-Viewer는 네이티브 데스크톱 앱으로도 제공됩니다: [다운로드 페이지](https://github.com/weiesky/cc-viewer/releases)


### 로거 모드

네이티브 claude 도구나 VS Code 확장 프로그램을 여전히 선호한다면 이 모드를 사용하세요.

이 모드에서는 `claude`를 실행하면 자동으로 로깅 프로세스가 시작되어 요청 로그를 ~/.claude/cc-viewer/*yourproject*/date.jsonl에 기록합니다.

로거 모드 활성화:
```bash
ccv -logger
```

콘솔에 특정 포트를 인쇄할 수 없을 때 기본 첫 번째 포트는 127.0.0.1:7008입니다. 여러 인스턴스는 7009, 7010과 같이 순차적 포트를 사용합니다.

로거 모드 제거:
```bash
ccv --uninstall
```

### 문제 해결

cc-viewer 시작에 문제가 있다면, 다음은 궁극의 문제 해결 방법입니다:

1단계: 아무 디렉터리에서 Claude Code를 엽니다.

2단계: Claude Code에 다음 지시를 내립니다:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Claude Code가 직접 문제를 진단하도록 하는 것이 누군가에게 묻거나 어떤 문서를 읽는 것보다 더 효과적입니다!

위 지시가 완료되면 `findcc.js`가 업데이트됩니다. 프로젝트가 자주 로컬 배포가 필요하거나 포크된 코드가 종종 설치 문제를 해결해야 하는 경우, 이 파일을 유지하면 다음 번에 간단히 복사할 수 있습니다. 현재 Claude Code를 사용하는 많은 프로젝트와 회사들이 Mac이 아닌 서버 측 호스팅 환경에 배포하고 있기 때문에, 작성자는 향후 cc-viewer 소스 코드 업데이트를 더 쉽게 추적할 수 있도록 `findcc.js`를 분리했습니다.


### 기타 명령

참조:

```bash
ccv -h
```

### 사일런트 모드

기본적으로 `ccv`는 `claude`를 래핑할 때 사일런트 모드로 실행되어, 터미널 출력을 깔끔하게 유지하며 네이티브 경험과 일관성을 유지합니다. 모든 로그는 백그라운드에서 캡처되어 `http://localhost:7008`에서 볼 수 있습니다.

구성이 완료되면 평소처럼 `claude` 명령을 사용하세요. `http://localhost:7008`을 방문하여 모니터링 인터페이스에 접근할 수 있습니다.


## 기능


### 프로그래밍 모드

ccv로 시작한 후 다음을 볼 수 있습니다:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


편집 후 코드 diff를 바로 볼 수 있습니다:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

파일과 코드를 수동으로 열 수 있지만, 수동 코딩은 권장되지 않습니다 — 그것은 구식 코딩입니다!

### 모바일 프로그래밍

QR 코드를 스캔하여 모바일 장치에서 코딩할 수도 있습니다:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

모바일 프로그래밍에 대한 상상을 현실로 만드세요. 플러그인 메커니즘도 있습니다 — 코딩 습관에 맞게 커스터마이징이 필요하다면, 플러그인 hook 업데이트를 기대해 주세요.


### 로거 모드 (전체 Claude Code 세션 보기)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Claude Code의 모든 API 요청을 실시간으로 캡처하여 편집되지 않은 원시 텍스트를 보장합니다(중요!!!)
- Main Agent와 Sub Agent 요청을 자동으로 식별하고 레이블링합니다(하위 유형: Plan, Search, Bash)
- MainAgent 요청은 Body Diff JSON을 지원하여 이전 MainAgent 요청과의 차이(변경/추가된 필드만)를 접힌 형태로 표시합니다
- 각 요청은 인라인 Token 사용 통계(입력/출력 tokens, 캐시 생성/읽기, 적중률)를 표시합니다
- Claude Code Router (CCR) 및 기타 프록시 시나리오와 호환 — API 경로 패턴 매칭으로 대체 지원됩니다

### 대화 모드

오른쪽 상단의 "대화 모드" 버튼을 클릭하여 Main Agent의 전체 대화 기록을 채팅 인터페이스로 파싱합니다:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- Agent Team 표시는 아직 지원되지 않습니다
- 사용자 메시지는 오른쪽 정렬(파란색 말풍선), Main Agent 응답은 왼쪽 정렬(어두운 말풍선)입니다
- `thinking` 블록은 기본적으로 접혀 있으며 Markdown으로 렌더링됩니다 — 클릭하여 확장하고 사고 과정을 볼 수 있습니다; 원클릭 번역이 지원됩니다(기능은 아직 불안정함)
- 사용자 선택 메시지(AskUserQuestion)는 Q&A 형식으로 표시됩니다
- 양방향 모드 동기화: 대화 모드로 전환하면 선택한 요청에 해당하는 대화로 자동 스크롤됩니다; 원본 모드로 돌아가면 선택한 요청으로 자동 스크롤됩니다
- 설정 패널: 도구 결과 및 thinking 블록의 기본 접힘 상태를 전환합니다
- 모바일 대화 탐색: 모바일 CLI 모드에서 상단 바의 "대화 탐색" 버튼을 탭하면 읽기 전용 대화 뷰가 슬라이드되어 모바일에서 전체 대화 기록을 탐색할 수 있습니다

### 로그 관리

왼쪽 상단의 CC-Viewer 드롭다운 메뉴를 통해:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**로그 압축**
로그에 관하여, 작성자는 Anthropic 공식 정의가 수정되지 않았음을 분명히 하고 싶습니다. 이로써 로그 무결성을 보장합니다. 그러나 1M Opus 모델의 개별 로그 항목이 후반 단계에서 극도로 커질 수 있기 때문에, MainAgent에 대한 특정 로그 최적화 덕분에 gzip 없이도 최소 66%의 크기 감소가 달성됩니다. 이러한 압축 로그의 파싱 방법은 현재 저장소에서 추출할 수 있습니다.

### 더 유용한 기능

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

사이드바 도구를 사용하여 프롬프트를 빠르게 찾을 수 있습니다.

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

흥미로운 KV-Cache-Text 기능으로 Claude가 보는 것을 정확히 볼 수 있습니다.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

이미지를 업로드하고 요구 사항을 설명할 수 있습니다 — Claude의 이미지 이해 능력은 믿을 수 없을 정도로 강력합니다. 아시다시피, Ctrl+V로 이미지를 직접 붙여넣을 수 있으며, 전체 내용이 대화에 표시됩니다.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

플러그인을 커스터마이징하고, 모든 CC-Viewer 프로세스를 관리할 수 있으며, CC-Viewer는 타사 API로의 핫 스위칭을 지원합니다(예, GLM, Kimi, MiniMax, Qwen, DeepSeek을 사용할 수 있습니다 — 작성자는 현재 시점에서 이들이 모두 꽤 약하다고 생각하지만).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

더 많은 기능이 발견되기를 기다리고 있습니다... 예를 들어: 시스템은 Agent Team을 지원하며, 내장된 Code Reviewer를 갖추고 있습니다. Codex Code Reviewer 통합도 곧 출시됩니다(작성자는 Codex를 사용하여 Claude Code의 코드를 리뷰하는 것을 강력히 권장합니다).

## License

MIT
