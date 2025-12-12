> [발표자료](https://www.figma.com/deck/c274NwzSr4UAy5yqE62SVt/%EC%86%8C%EA%B3%B5%EA%B0%9C-2%EC%A1%B0-%EC%B5%9C%EC%A2%85%EB%B0%9C%ED%91%9C%EC%9E%90%EB%A3%8C?node-id=1-7246&t=aJy5sxpZpKrIVNRf-1)

### Environment Setup

[ENV_SETUP.md](./ENV_SETUP.md) 에서 확인 가능

### How to run

```bash
./dev.sh
```

### AI Tools Usage

1. Antigravity IDE 사용
    - django.test 라이브러리에 대한 러닝커브가 있어, 테스트 상황을 입력하고 이를 테스트 코드로 반환받음.
    - 구현된 api endpoint들을 기록한 마크다운 파일로부터 테스트 코드를 AI로 생성
    - 구현된 전체 코드를 갖고, 채점자를 위한 환경설정 파일인 ENV_SETUP.md를 생성
    - aws ec2에 django 코드를 배포하는게 처음이어서 배포 전과정에서 AI를 사용
    - 기타 각종 문법 오류를 대처하기 위해 AI 기능을 활용
    - motion (구 framer-motion)을 사용하여 card-flipping 애니메이션을 만드는데 AI를 사용
    - 프론트엔드 : 인간 90%
    - 백엔드 및 RAG : 인간 40%, AI 60%

2. ChatGPT 사용
    - 노션으로 작성한 API 명세를 마크다운으로 번역
    - django admin 페이지를 만드는 방법을 알기 위해 사용
  
3. Gemini & MS Copilot
    - 보고서 작성 전과정에서 사용
  
4. OpenAI API
    - 서비스 챗봇의 응답을 생성하기 위해 사용
    - 퀴즈를 생성하기 위해 사용
    - 플래시카드를 생성하기 위해 사용
    - PDF text를 포맷팅된 마크다운으로 변환하기 위해 사용

