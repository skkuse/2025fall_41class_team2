# llm_project/api/rag_utils.py

import os
from dotenv import load_dotenv
import chromadb
# [!] 수정된 import
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings

# [!] 1. RAG 체인을 위한 추가 임포트
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
# [!] 2. 챗봇 LLM 모델 초기화 (GPT-4o 사용)
llm = ChatOpenAI(
    model="gpt-4o",
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0.0 # 답변의 일관성을 위해 0.0으로 설정
)

# --- 텍스트 분할기 ---
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

def process_and_index_pdf(document_obj):
    """
    Document 객체를 받아 PDF를 로드, 분할, 임베딩하고 ChromaDB에 저장
    """
    try:
        file_path = document_obj.file.path
        project_id = document_obj.project.id
        document_id = document_obj.id

        # [전략] 프로젝트 ID별로 별도의 컬렉션(테이블)을 사용
        collection_name = f"project_{project_id}"
        collection = chroma_client.get_or_create_collection(name=collection_name)

        # 1. PDF 불러오기 (Load)
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        # 2. 텍스트 분할 (Split)
        split_docs = text_splitter.split_documents(docs)

        documents_to_add = []
        metadatas_to_add = []
        ids_to_add = [] # 각 조각의 고유 ID

        for i, doc in enumerate(split_docs):
            documents_to_add.append(doc.page_content)
            
            # [핵심] 꼬리표(메타데이터)에 document_id를 포함
            metadatas_to_add.append({
                "document_id": document_id,
                "source_page": doc.metadata.get('page', 0),
                "original_filename": document_obj.original_filename
            })
            
            # [핵심] 삭제 및 관리를 위한 고유 ID
            ids_to_add.append(f"doc_{document_id}_chunk_{i}")

        if documents_to_add:
            embeddings_to_add = openai_embeddings.embed_documents(documents_to_add)
            collection.add(
                embeddings = embeddings_to_add,
                documents=documents_to_add,
                metadatas=metadatas_to_add,
                ids=ids_to_add
            )
        
        print(f"✅ [Project: {project_id}, Doc: {document_id}] 인덱싱 성공. {len(ids_to_add)}개 벡터 추가.")
        return True

    except Exception as e:
        print(f"❌ [Project: {project_id}, Doc: {document_id}] 인덱싱 실패: {e}")
        return False

def remove_document_vectors(document_obj):
    """
    Document 객체에 해당하는 벡터들을 ChromaDB에서 삭제
    """
    try:
        project_id = document_obj.project.id
        document_id = document_obj.id
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
    
# [!] 3. 챗봇 질문 처리 함수 (신규 추가)
def get_rag_answer(project_id, query):
    """
    특정 프로젝트의 RAG 체인을 구성하고 사용자의 질문에 답변합니다.
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
        # k=5: 가장 관련성 높은 5개의 텍스트 조각을 검색
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})

        # 3. RAG 프롬프트 템플릿 정의
        # [!] "말투" 기능이 빠진 기본 프롬프트
        template = """
        당신은 사용자가 업로드한 문서를 기반으로 답변하는 전문적인 AI 어시스턴트입니다.
        제시된 [Context] 내용을 기반으로만 사용자의 [Question]에 답변하세요.
        [Context]에 없는 내용은 답변할 수 없다고 솔직하게 말하세요.

        [Context]:
        {context}

        [Question]:
        {query}

        [Answer]:
        """
        prompt = ChatPromptTemplate.from_template(template)

        # 4. RAG 체인(Chain) 구성 (LCEL)
        # (retriever가 context를, 사용자의 query가 query를 채움)
        rag_chain = (
            {"context": retriever, "query": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

        # 5. 체인 실행 및 답변 받기
        answer = rag_chain.invoke(query)
        return answer

    except Exception as e:
        print(f"❌ [Project: {project_id}] RAG 답변 생성 실패: {e}")
        # ChromaDB에 해당 컬렉션이 없거나 비어있을 때 예외 발생 가능
        return "답변을 생성하는 중 오류가 발생했습니다. 프로젝트 ID를 확인하거나, 문서를 업로드했는지 확인하세요."