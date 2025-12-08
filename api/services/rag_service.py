from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from .chroma_service import ChromaService

class RAGService:
    def __init__(self):
        self.chroma_service = ChromaService()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.0
        )

    def get_answer(self, project_id: str, query: str):
        try:
            vector_store = self.chroma_service.get_vector_store(project_id)
            retriever = vector_store.as_retriever(search_kwargs={"k": 10})
            
            docs = retriever.invoke(query)
            
            formatted_context, sources_metadata = self._format_docs(docs)
            
            answer = self._generate_answer(formatted_context, query)
            
            return {
                "answer": answer,
                "sources": sources_metadata
            }
        except Exception:
            return {
                "answer": "답변을 생성하는 중 오류가 발생했습니다.",
                "sources": []
            }

    def _format_docs(self, docs):
        formatted_context = ""
        sources = []
        
        for doc in docs:
            doc_id = doc.metadata.get('document_id', 'unknown')
            page_num = doc.metadata.get('source_page', 0) + 1
            doc_name = doc.metadata.get('name', 'Unknown Document')
            
            formatted_context += f"[Document ID: {doc_id}, Page: {page_num}] {doc.page_content}\n\n"
            
            sources.append({
                "document_id": doc_id,
                "page": page_num,
                "name": doc_name,
                "content_snippet": doc.page_content[:100] + "..."
            })
            
        return formatted_context, sources

    def _generate_answer(self, context, query):
        template = """
        당신은 AI 어시스턴트입니다. [Context]를 기반으로 [Question]에 답변하세요.
        문장 끝에 출처 [Document ID: ..., Page: ...]를 명시하세요.
        Context에 없으면 모른다고 하세요.
        답변 작성 시 마크다운 규칙:
        - 제목은 H3(###) 이하만 사용하세요
        
        [Context]:
        {context}

        [Question]:
        {query}

        [Answer]:
        """
        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        return chain.invoke({"context": context, "query": query})

    def generate_suggested_questions(self, project_id: str, last_message_content: str = None):
        try:
            vector_store = self.chroma_service.get_vector_store(project_id)
            retriever = vector_store.as_retriever(search_kwargs={"k": 5})
            
            search_query = last_message_content if last_message_content else "summary overview main topics"
            docs = retriever.invoke(search_query)
            context = "\n\n".join([d.page_content for d in docs])
            
            if not context:
                return ["문서를 업로드하면 질문을 추천해 드릴 수 있어요.", "이 문서의 주요 내용은 무엇인가요?", "문서 요약을 부탁해 보세요."]

            import json
            
            template = """
            Generate 3 Korean follow-up questions based on the context.
            Output JSON Array of strings: ["Q1", "Q2", "Q3"]
            Context: {context}
            """
            
            prompt = ChatPromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            
            res = chain.invoke({"context": context})
            return json.loads(res.replace("```json", "").replace("```", "").strip())[:3]
            
        except Exception:
            return ["추천 질문 생성 실패", "문서 요약을 부탁해 보세요.", "핵심 내용은 무엇인가요?"]
