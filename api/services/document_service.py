from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from .chroma_service import ChromaService

class DocumentService:
    def __init__(self):
        self.chroma_service = ChromaService()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.0
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def process_document_by_id(self, document_id):
        """
        Wrapper for processing by ID, useful for background threads.
        """
        from api.models import Document
        try:
            document_obj = Document.objects.get(id=document_id)
            return self.process_document(document_obj)
        except Exception:
            return False

    def process_document(self, document_obj):
        """
        Orchestrates the PDF loading, formatting, translating, and indexing process.
        """
        try:
            # 1. Update Status
            self._update_status(document_obj, 'processing', "Starting PDF processing...")
            
            project_id = str(document_obj.project.id)
            document_id = str(document_obj.id)
            file_path = document_obj.file.path
            
            # 2. Load PDF
            self._update_status(document_obj, 'processing', "Loading PDF...")
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            
            # 3. Format & Translate Pages
            self._process_pages(document_obj, docs)
            
            # 4. Indexing (Split & Embed)
            self._update_status(document_obj, 'processing', "Indexing documents...")
            self._index_documents(document_obj, docs)
            
            # 5. Complete
            self._update_status(document_obj, 'processed', "Completed")
            return True

        except Exception as e:
            self._update_status(document_obj, 'failed', f"Error: {str(e)}")
            return False

    def _update_status(self, doc, status, message):
        doc.status = status
        doc.processing_message = message
        doc.save()

    def _process_pages(self, document_obj, docs):
        from api.models import DocumentPage
        
        formatting_chain = self._create_formatting_chain()
        translation_chain = self._create_translation_chain()
        
        total_pages = len(docs)
        
        for i, doc in enumerate(docs):
            page_num = doc.metadata.get('page', 0) + 1
            self._update_status(document_obj, 'processing', f"Processing & Translating page {page_num} of {total_pages}...")
            
            raw_text = doc.page_content
            
            try:
                formatted_text = self._clean_llm_output(formatting_chain.invoke({"text": raw_text}))
                translated_text = self._clean_llm_output(translation_chain.invoke({"text": formatted_text}))
                final_original_text = formatted_text
            except Exception:
                final_original_text = raw_text
                translated_text = ""
                
            DocumentPage.objects.create(
                document=document_obj,
                page_number=page_num,
                original_text=final_original_text,
                translated_text=translated_text
            )

    def _index_documents(self, document_obj, docs):
        split_docs = self.text_splitter.split_documents(docs)
        if not split_docs:
            return

        documents_to_add = []
        metadatas_to_add = []
        ids_to_add = []
        
        project_id = str(document_obj.project.id)
        document_id = str(document_obj.id)
        
        collection = self.chroma_service.get_or_create_collection(project_id)
        
        for i, doc in enumerate(split_docs):
            documents_to_add.append(doc.page_content)
            metadatas_to_add.append({
                "document_id": document_id,
                "source_page": doc.metadata.get('page', 0),
                "name": document_obj.name
            })
            ids_to_add.append(f"doc_{document_id}_chunk_{i}")
            
        collection.add(
            embeddings=self.chroma_service.embeddings.embed_documents(documents_to_add),
            documents=documents_to_add,
            metadatas=metadatas_to_add,
            ids=ids_to_add
        )

    def _create_formatting_chain(self):
        prompt = ChatPromptTemplate.from_template(
            """
            You are a professional document formatter.
            Convert the following raw text into clean, structured Markdown.
            Guidelines:
            1. Lists: Convert bullet points into proper Markdown lists.
            2. Headers: Identify and apply Markdown headers.
            3. Emphasis: Use bold for key terms.
            4. Cleanliness: Remove excessive newlines.
            5. Content: Do NOT summarize. Keep all info.
            IMPORTANT: Return ONLY the raw Markdown text. Do NOT wrap in code blocks.
            Raw Text: {text}
            """
        )
        return prompt | self.llm | StrOutputParser()

    def _create_translation_chain(self):
        prompt = ChatPromptTemplate.from_template(
            """
            Translate the following English Markdown text into Korean.
            Guidelines:
            1. Structure: PRESERVE Markdown structure exactly.
            2. Spacing: proper Korean spacing.
            3. Formatting: Insert line breaks for readability.
            4. Tone: Professional.
            IMPORTANT: Return ONLY the raw Korean Markdown text. Do NOT wrap in code blocks.
            Markdown Text: {text}
            """
        )
        return prompt | self.llm | StrOutputParser()

    def _clean_llm_output(self, text):
        return text.replace("```markdown", "").replace("```", "").strip()

    def delete_document_vectors(self, document_obj):
        return self.chroma_service.delete_documents(
            str(document_obj.project.id), 
            str(document_obj.id)
        )
