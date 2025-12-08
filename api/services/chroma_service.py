import os
import chromadb
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

class ChromaService:
    _instance = None
    _client = None
    _embeddings = None

    def __new__(cls):
        """Singleton pattern to ensure one DB connection"""
        if cls._instance is None:
            cls._instance = super(ChromaService, cls).__new__(cls)
            cls._initialize()
        return cls._instance

    @classmethod
    def _initialize(cls):
        CHROMA_PERSIST_DIR = "chroma_db"
        cls._client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        cls._embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def get_collection_name(self, project_id: str) -> str:
        return f"project_{project_id}"

    def get_or_create_collection(self, project_id: str):
        collection_name = self.get_collection_name(project_id)
        return self._client.get_or_create_collection(name=collection_name)

    def get_vector_store(self, project_id: str):
        collection_name = self.get_collection_name(project_id)
        return Chroma(
            client=self._client,
            collection_name=collection_name,
            embedding_function=self._embeddings
        )

    def delete_collection(self, project_id: str):
         # Note: ChromaDB client might not expose simple delete_collection easily in all versions, 
         # but we can delete items. 
         # However, the original code used `collection.delete(where=...)`.
         pass

    def delete_documents(self, project_id: str, document_id: str):
        collection_name = self.get_collection_name(project_id)
        collection = self._client.get_collection(name=collection_name)
        collection.delete(where={"document_id": document_id})
        return True

    @property
    def embeddings(self):
        return self._embeddings
