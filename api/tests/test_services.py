from django.test import TestCase
from unittest.mock import patch, MagicMock
from ..services.document_service import DocumentService
from ..models import CustomUser, Project, Document, DocumentPage

class ServiceTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create(username='test', email='t@t.com')
        self.project = Project.objects.create(owner=self.user, title='Test Proj')
        self.document = Document.objects.create(
            project=self.project, name='test.pdf', file='test.pdf'
        )

    @patch('api.services.document_service.PyPDFLoader')
    @patch('api.services.document_service.RecursiveCharacterTextSplitter')
    @patch('api.services.chroma_service.chromadb.PersistentClient')
    @patch('api.services.chroma_service.OpenAIEmbeddings')
    @patch('api.services.document_service.ChatOpenAI')
    @patch('api.services.document_service.ChatPromptTemplate')
    @patch('api.services.document_service.StrOutputParser')
    def test_process_and_index_pdf_success(self, mock_parser, mock_prompt, mock_chat, mock_embeddings, mock_chroma, mock_splitter, mock_loader):
        # 1. Setup Mock Behavior
        # Loader
        mock_loader_instance = mock_loader.return_value
        doc_mock = MagicMock()
        doc_mock.page_content = "Raw Content"
        doc_mock.metadata = {'page': 0}
        mock_loader_instance.load.return_value = [doc_mock]
        
        # Test direct use of service
        service = DocumentService()
        
        # Let's make `loader.load()` raise an exception and see if status becomes 'failed'.
        mock_loader_instance.load.side_effect = Exception("Load Error")
        
        result = service.process_document(self.document)
        
        self.assertFalse(result)
        self.document.refresh_from_db()
        self.assertEqual(self.document.status, 'failed')
        self.assertIn("Load Error", self.document.processing_message)

