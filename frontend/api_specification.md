# API Specification

## 1. Authentication

### 1.1. Register User
**PUT** `/user`

**Description**
유저가 있으면 그대로 성공 반환, 없으면 데이터베이스에 추가 후 성공 반환.
멱등성(idempotent)을 보장해야 함.

**Request Body**
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `email` | `string` | user email, provided by supabase | Yes |
| `id` | `string` | UUID, provided by supabase, PRIMARY KEY | Yes |
| `username` | `string` | user name, provided by supabase | No |

**Response**
- `200 OK`: 성공
- `201 Created`: 유저가 없었을 경우 데이터베이스에 추가 성공 시 반환
- `500 Internal Server Error`: 임의의 이유로 데이터베이스 추가가 실패한 경우

---

## 2. Projects (Notebooks)

### 2.1. Get All Projects
**GET** `/projects`

**Description**
사용자의 모든 프로젝트를 불러옵니다.

**Response**
- `200 OK`: 프로젝트 리스트 반환
```json
[
  {
    "id": "uuid",
    "title": "Project Title",
    "description": "Project Description",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

### 2.2. Create Project
**POST** `/projects`

**Description**
새로운 프로젝트를 생성합니다.

**Request Body**
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `title` | `string` | 프로젝트 제목 | Yes |
| `description` | `string` | 프로젝트 설명 | No |

**Response**
- `201 Created`: 프로젝트 생성 성공

### 2.3. Get Project Details
**GET** `/projects/{projectId}`

**Description**
특정 프로젝트의 상세 정보를 불러옵니다.

**Response**
- `200 OK`: 프로젝트 상세 정보

### 2.4. Update Project
**PATCH** `/projects/{projectId}`

**Description**
프로젝트의 제목과 설명을 수정합니다.

**Request Body**
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `title` | `string` | 수정할 프로젝트 제목 | No |
| `description` | `string` | 수정할 프로젝트 설명 | No |

**Response**
- `200 OK`: 프로젝트 수정 성공
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated Description",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 2.5. Delete Project
**DELETE** `/projects/{projectId}`

**Description**
프로젝트를 삭제합니다. 프로젝트에 포함된 모든 문서와 메시지도 함께 삭제됩니다.

**Response**
- `204 No Content`: 삭제 성공
- `404 Not Found`: 프로젝트를 찾을 수 없음

---

## 3. Documents (Sources)

### 3.1. Upload Document
**POST** `/projects/{projectId}/documents`

**Description**
프로젝트에 문서를 업로드합니다. 업로드 후 문서 목록 갱신 트리거가 필요할 수 있습니다.

**Request Body** (Multipart/Form-Data)
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `file` | `file` | 업로드할 파일 | Yes |

**Response**
- `201 Created`: 업로드 성공 및 처리 시작

### 3.2. Get Document List
**GET** `/projects/{projectId}/documents`

**Description**
프로젝트에 포함된 문서 목록을 불러옵니다.

**Response**
- `200 OK`: 문서 목록 반환
```json
[
  {
    "id": "uuid",
    "name": "filename.pdf",
    "status": "processed",
    "created_at": "timestamp"
  }
]
```

### 3.3. Delete Document
**DELETE** `/projects/{projectId}/documents/{documentId}`

**Description**
프로젝트에서 특정 문서를 삭제합니다. 문서와 관련된 벡터 인덱스도 함께 삭제됩니다.

**Response**
- `204 No Content`: 삭제 성공
- `404 Not Found`: 문서를 찾을 수 없음

### 3.4. Get Document Pages
**GET** `/projects/{projectId}/documents/{documentId}/pages`

**Description**
특정 문서의 페이지별 원문과 번역본을 조회합니다.

**Response**
- `200 OK`: 페이지 목록 반환
```json
[
  {
    "id": "uuid",
    "page_number": 1,
    "original_text": "Original English text...",
    "translated_text": "번역된 한글 텍스트..."
  },
  {
    "id": "uuid",
    "page_number": 2,
    "original_text": "...",
    "translated_text": "..."
  }
]
```

---

## 4. Chat

### 4.1. Get Message List
**GET** `/projects/{projectId}/messages`

**Description**
프로젝트의 채팅 기록을 불러옵니다 (메시지 리스트 동기화).

**Response**
- `200 OK`: 메시지 리스트 반환
```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "Hello",
    "created_at": "timestamp"
  }
]
```

### 4.2. Send Message
**POST** `/projects/{projectId}/messages`

**Description**
메시지를 전송하고 다음 메시지(AI 응답)를 받습니다.

**Request Body**
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `content` | `string` | 메시지 내용 | Yes |

**Response**
- `200 OK`: AI 응답 반환
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "Response...",
  "created_at": "timestamp"
}
```

---

## 5. Quizzes

### 5.1. Generate Quiz
**POST** `/projects/{projectId}/quizzes`

**Description**
프로젝트 내의 문서를 바탕으로 퀴즈를 생성합니다.

**Request Body**
| Name | Type | Description | Mandatory |
| --- | --- | --- | --- |
| `num_questions` | `integer` | 생성할 문제 수 (기본값: 5) | No |

**Response**
- `201 Created`: 퀴즈 생성 성공
```json
{
  "id": "uuid",
  "title": "Generated Quiz 1",
  "created_at": "timestamp",
  "questions": [
    {
      "id": "uuid",
      "question_text": "질문 내용...",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "answer": "정답 (보기 중 하나)"
    }
  ]
}
```

### 5.2. Get Quiz List
**GET** `/projects/{projectId}/quizzes`

**Description**
프로젝트의 생성된 퀴즈 목록을 조회합니다.

**Response**
- `200 OK`: 퀴즈 목록 반환

### 5.3. Get Quiz Details
**GET** `/projects/{projectId}/quizzes/{quizId}`

**Description**
특정 퀴즈의 상세 내용(문제 포함)을 조회합니다.

**Response**
- `200 OK`: 퀴즈 상세 정보 반환
