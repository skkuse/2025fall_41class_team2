# llm_project/api/rag_utils.py

import os
from dotenv import load_dotenv
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# .env 파일에서 환경 변수 로드 (OPENAI_API_KEY)
load_dotenv()

# --- ChromaDB 클라이언트 설정 (로컬 영구 저장) ---
CHROMA_PERSIST_DIR = "chroma_db"
chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

# --- OpenAI 임베딩 모델 ---
openai_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)

# --- OpenAI LLM (챗봇 모델) ---
llm = ChatOpenAI(
    model="gpt-4o",
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0.0  # 답변의 일관성을 위해 0.0으로 설정
)

# --- 텍스트 분할기 ---
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

def process_and_index_pdf(document_id):
    """
    Document ID를 받아 PDF를 로드, 분할, 임베딩하고 ChromaDB에 저장
    비동기 처리를 위해 document_id를 인자로 받음
    """
    try:
        from .models import Document, DocumentPage  # Avoid circular import
        
        # 최신 상태 가져오기
        document_obj = Document.objects.get(id=document_id)
        
        file_path = document_obj.file.path
        project_id = str(document_obj.project.id)
        document_id = str(document_obj.id)

        # 상태 업데이트: 시작
        document_obj.status = 'processing'
        document_obj.processing_message = "Starting PDF processing..."
        document_obj.save()

        # [전략] 프로젝트 ID별로 별도의 컬렉션(테이블)을 사용
        collection_name = f"project_{project_id}"
        collection = chroma_client.get_or_create_collection(name=collection_name)

        # 1. PDF 불러오기 (Load)
        document_obj.processing_message = "Loading PDF..."
        document_obj.save()
        
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        # --- 페이지별 원문 저장 및 번역 ---
        print(f"📄 [Doc: {document_id}] {len(docs)} 페이지 처리 및 번역 시작...")
        
        # 번역을 위한 프롬프트
        translation_prompt = ChatPromptTemplate.from_template(
            """
            Translate the following English text into Korean.
            Maintain the original tone and formatting as much as possible.
            Only return the translated text.
            
            Text:
            {text}
            """
        )
        translation_chain = translation_prompt | llm | StrOutputParser()

        total_pages = len(docs)
        for i, doc in enumerate(docs):
            page_num = doc.metadata.get('page', 0) + 1
            
            # 진행 상황 업데이트
            document_obj.processing_message = f"Translating page {page_num} of {total_pages}..."
            document_obj.save()
            
            original_text = doc.page_content
            
            # 번역 실행
            try:
                translated_text = translation_chain.invoke({"text": original_text})
            except Exception as e:
                print(f"⚠️ [Page {page_num}] 번역 실패: {e}")
                translated_text = ""

            # DB 저장
            DocumentPage.objects.create(
                document=document_obj,
                page_number=page_num,
                original_text=original_text,
                translated_text=translated_text
            )
            print(f"   - Page {page_num} 저장 완료")

        # 2. 텍스트 분할 (Split) - RAG용
        document_obj.processing_message = "Indexing documents..."
        document_obj.save()
        
        split_docs = text_splitter.split_documents(docs)

        documents_to_add = []
        metadatas_to_add = []
        ids_to_add = []  # 각 조각의 고유 ID

        for i, doc in enumerate(split_docs):
            documents_to_add.append(doc.page_content)
            
            # [핵심] 꼬리표(메타데이터)에 document_id를 포함
            metadatas_to_add.append({
                "document_id": document_id,
                "source_page": doc.metadata.get('page', 0),
                "name": document_obj.name
            })
            
            # [핵심] 삭제 및 관리를 위한 고유 ID
            ids_to_add.append(f"doc_{document_id}_chunk_{i}")

        if documents_to_add:
            embeddings_to_add = openai_embeddings.embed_documents(documents_to_add)
            collection.add(
                embeddings=embeddings_to_add,
                documents=documents_to_add,
                metadatas=metadatas_to_add,
                ids=ids_to_add
            )
        
        print(f"✅ [Project: {project_id}, Doc: {document_id}] 인덱싱 및 번역 저장 성공. {len(ids_to_add)}개 벡터 추가.")
        
        # 완료 상태 업데이트
        document_obj.status = 'processed'
        document_obj.processing_message = "Completed"
        document_obj.save()
        return True

    except Exception as e:
        print(f"❌ [Project: {project_id}, Doc: {document_id}] 인덱싱 실패: {e}")
        # 실패 상태 업데이트
        try:
            document_obj = Document.objects.get(id=document_id)
            document_obj.status = 'failed'
            document_obj.processing_message = f"Error: {str(e)}"
            document_obj.save()
        except:
            pass
        return False

def remove_document_vectors(document_obj):
    """
    Document 객체에 해당하는 벡터들을 ChromaDB에서 삭제
    """
    try:
        project_id = str(document_obj.project.id)
        document_id = str(document_obj.id)
        collection_name = f"project_{project_id}"
        
        collection = chroma_client.get_collection(name=collection_name)
        
        # [핵심] document_id 메타데이터를 기준으로 모든 벡터 삭제
        collection.delete(
            where={"document_id": document_id}
        )
        print(f"✅ [Project: {project_id}, Doc: {document_id}] 벡터 삭제 성공.")
        return True

    except Exception as e:
        print(f"❌ [Project: {project_id}, Doc: {document_id}] 벡터 삭제 실패: {e}")
        return False
    
def get_rag_answer(project_id, query):
    """
    특정 프로젝트의 RAG 체인을 구성하고 사용자의 질문에 답변합니다.
    답변과 함께 사용된 소스 메타데이터를 반환합니다.
    """
    try:
        collection_name = f"project_{project_id}"

        # 1. LangChain과 ChromaDB를 연결하는 VectorStore 객체 생성
        vector_store = Chroma(
            client=chroma_client,
            collection_name=collection_name,
            embedding_function=openai_embeddings,
        )

        # 2. VectorStore를 'Retriever' (검색기)로 변환
        retriever = vector_store.as_retriever(search_kwargs={"k": 10})
        
        # 3. 문서 검색 및 컨텍스트 구성 (수동 실행)
        docs = retriever.invoke(query)
        
        # 컨텍스트 포맷팅: [ID: doc_id, Page: page_num] Content...
        formatted_context = ""
        sources_metadata = []
        
        for doc in docs:
            doc_id = doc.metadata.get('document_id', 'unknown')
            page_num = doc.metadata.get('source_page', 0) + 1 # 1-based index
            doc_name = doc.metadata.get('name', 'Unknown Document')
            
            formatted_context += f"[Document ID: {doc_id}, Page: {page_num}] {doc.page_content}\n\n"
            
            sources_metadata.append({
                "document_id": doc_id,
                "page": page_num,
                "name": doc_name,
                "content_snippet": doc.page_content[:100] + "..."
            })

        # 4. RAG 프롬프트 템플릿 정의
        template = """
        당신은 사용자가 업로드한 여러 문서를 기반으로 답변하는 전문적인 AI 어시스턴트입니다.
        제시된 [Context] 내용을 기반으로만 사용자의 [Question]에 답변하세요.
        
        [Context]의 각 부분은 [Document ID: ..., Page: ...] 형식으로 출처가 표시되어 있습니다.
        답변을 작성할 때, 각 문장이나 단락의 끝에 해당 정보의 출처(Document ID와 Page)를 반드시 명시하세요.
        형식 예시: "이 내용은 문서의 핵심입니다. [Document ID: 123, Page: 5]"
        
        [Context]에 없는 내용은 답변할 수 없다고 솔직하게 말하세요.
        항상 한글로 대답하고, "Context에 따르면"과 같은 말은 사용하지 마세요.
        
        답변 작성 시 마크다운 규칙:
        - 제목은 H3(###) 이하만 사용하세요 (H1(#), H2(##) 사용 금지)
        - 리스트, 볼드체, 코드 블록 등 다른 마크다운 요소는 자유롭게 사용하세요

        [Context]:
        {context}

        [Question]:
        {query}

        [Answer]:
        """
        prompt = ChatPromptTemplate.from_template(template)

        # 5. 체인 실행 (LLM 호출)
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": formatted_context, "query": query})
        
        return {
            "answer": answer,
            "sources": sources_metadata
        }

    except Exception as e:
        print(f"❌ [Project: {project_id}] RAG 답변 생성 실패: {e}")
        return {
            "answer": "답변을 생성하는 중 오류가 발생했습니다. 프로젝트 ID를 확인하거나, 문서를 업로드했는지 확인하세요.",
            "sources": []
        }

def generate_quiz(project_id, num_questions=5):
    """
    프로젝트의 문서를 기반으로 퀴즈를 생성합니다.
    """
    try:
        from .models import Project, Quiz, Question
        import json

        # 1. 프로젝트 확인
        project = Project.objects.get(id=project_id)
        
        # 2. ChromaDB에서 랜덤하게 문서 청크 가져오기 (또는 검색)
        # 여기서는 간단히 'important concepts'로 검색하여 관련 내용을 가져옵니다.
        collection_name = f"project_{project_id}"
        vector_store = Chroma(
            client=chroma_client,
            collection_name=collection_name,
            embedding_function=openai_embeddings,
        )
        
        # 퀴즈 생성을 위한 포괄적인 검색 쿼리
        retriever = vector_store.as_retriever(search_kwargs={"k": 15}) # 충분한 컨텍스트 확보
        docs = retriever.invoke("important key concepts and definitions summary")
        
        context = "\n\n".join([doc.page_content for doc in docs])
        
        if not context:
            return None

        # 3. LLM 프롬프트 구성 (JSON 출력 강제)
        template = """
        You are a professional quiz generator.
        Based on the following [Context], generate {num_questions} multiple-choice questions.
        The questions should be in Korean.
        
        [Context]:
        {context}
        
        Output Format (JSON Array):
        [
            {{
                "question_text": "질문 내용",
                "options": ["보기1", "보기2", "보기3", "보기4"],
                "answer": "정답 (보기 중 하나와 정확히 일치해야 함)"
            }},
            ...
        ]
        
        Ensure the output is a valid JSON array. Do not include any markdown formatting (like ```json).
        """
        
        prompt = ChatPromptTemplate.from_template(template)
        
        chain = (
            prompt 
            | llm 
            | StrOutputParser()
        )
        
        # 4. 생성 실행
        json_response = chain.invoke({"context": context, "num_questions": num_questions})
        
        # 5. JSON 파싱 및 DB 저장
        # 가끔 LLM이 마크다운 코드 블록을 포함할 수 있으므로 제거 시도
        cleaned_json = json_response.replace("```json", "").replace("```", "").strip()
        questions_data = json.loads(cleaned_json)
        
        # 퀴즈 객체 생성
        quiz = Quiz.objects.create(
            project=project,
            title=f"Generated Quiz ({len(questions_data)} Questions)"
        )
        
        # 문제 객체 생성
        for q_data in questions_data:
            Question.objects.create(
                quiz=quiz,
                question_text=q_data['question_text'],
                options=q_data['options'],
                answer=q_data['answer']
            )
            
        return quiz

    except Exception as e:
        print(f"❌ [Project: {project_id}] 퀴즈 생성 실패: {e}")
        return None