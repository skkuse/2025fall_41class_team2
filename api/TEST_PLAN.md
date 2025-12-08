# 백엔드 테스트 전략 (Backend Test Strategy)

본 문서는 `django.test`를 활용하여 견고하고 안정적인 백엔드 시스템을 구축하기 위한 포괄적인 테스트 계획입니다.

## 1. 테스트 철학 (Test Philosophy)
*   **격리 (Isolation)**: 단위 테스트는 외부 의존성(OpenAI, ChromaDB 등)을 철저히 Mocking하여 로직 자체만 검증합니다.
*   **통합 (Integration)**: API 엔드포인트 테스트는 데이터베이스와의 상호작용 및 권한(Permission)을 포함하여 검증합니다.
*   **흐름 (Flow)**: 핵심 사용자 시나리오는 E2E 성격의 통합 테스트로 검증하여 비즈니스 로직의 완결성을 보장합니다.

## 2. 테스트 범위 (Test Scope)

### A. 단위 테스트 (Unit Tests)
**위치**: `api/tests/test_models.py`, `api/tests/test_serializers.py`, `api/tests/test_utils.py`

1.  **Models (`models.py`)**
    *   **생성 및 필드 검증**: 각 모델(Project, Document 등)이 정상적으로 생성되는지, 필수 필드 누락 시 에러가 발생하는지 확인.
    *   **관계 검증**: User-Project, Project-Document 간의 외래 키 제약 조건 및 `on_delete` 동작(Cascade 삭제 등) 검증.
    *   **메서드 검증**: `__str__` 등 커스텀 메서드 동작 확인.

2.  **Serializers (`serializers.py`)**
    *   **유효성 검사**: 잘못된 데이터 포맷, 필수 값 누락, 길이 제한 등의 **엣지 케이스**에 대한 Validation Error 발생 여부.
    *   **직렬화/역직렬화**: Model -> JSON, JSON -> Model 변환 정확성 검증.

3.  **Utils (`rag_utils.py`)**
    *   **RAG 로직 격리**: `langchain`, `chromadb`, `openai` 라이브러리를 Mocking하여, 함수가 의도한 파이프라인(Load -> Split -> Embed -> Save)을 호출하는지 검증.
    *   **예외 처리**: 외부 API 호출 실패 시 에러 핸들링 및 상태 업데이트(status='failed') 로직 검증.

### B. 통합/뷰 테스트 (Integration/View Tests)
**위치**: `api/tests/test_views.py`

1.  **인증 및 권한 (Auth & Permissions)**
    *   **회원가입/로그인**: 중복 가입 시도, 잘못된 자격 증명 등 엣지 케이스.
    *   **접근 제어**: 인증되지 않은 사용자의 접근 차단(401), 다른 사용자의 자원 접근 시도 차단(404 or 403).

2.  **API 엔드포인트 (Endpoint Logic)**
    *   **CRUD 동작**: 프로젝트, 문서, 메시지, 퀴즈의 생성/조회/삭제가 DB 상태에 올바르게 반영되는지 확인.
    *   **파일 업로드**: PDF 파일 업로드 시 처리 상태 초기화 및 비동기 작업 트리거(Mock 활용) 확인.
    *   **퀴즈/채팅**: 잘못된 입력(빈 내용, 음수 문제 개수 등)에 대한 400 Bad Request 응답 확인.

### C. 시나리오 테스트 (Flow Tests)
**위치**: `api/tests/test_flow.py`

1.  **전체 사용자 여정 (User Journey)**
    *   **Scenario 1: RAG 파이프라인**: 가입 -> 프로젝트 생성 -> 문서 업로드 -> (처리 완료 가정) -> 질문 -> 답변 수신.
    *   **Scenario 2: 학습 파이프라인**: 가입 -> 프로젝트 생성 -> 퀴즈 생성 요청 -> 퀴즈 풀기(옵션).

## 3. 엣지 케이스 (Edge Cases)
*   **빈 파일/잘못된 파일 타입 업로드**: PDF가 아닌 파일이나 0바이트 파일 업로드 시도.
*   **리소스 고갈/제한**: 매우 긴 텍스트 입력, 비정상적인 페이지 번호 요청.
*   **동시성/삭제**: 문서 처리 중 프로젝트 삭제 시도 시 예외 처리 및 정합성 유지.
*   **외부 서비스 장애**: OpenAI API 타임아웃/에러 시 시스템이 멈추지 않고 적절한 에러 메시지를 반환하는지.

---
**구현 디렉토리 구조**:
```text
api/
└── tests/
    ├── __init__.py
    ├── test_models.py      # 모델 단위 테스트
    ├── test_serializers.py # 시리얼라이저 검증
    ├── test_utils.py       # 유틸리티 함수 (RAG 로직 Mocking)
    ├── test_views.py       # API 뷰 및 권한 테스트
    └── test_flow.py        # 전체 시나리오 테스트
```
