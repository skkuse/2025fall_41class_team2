from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from ..models import CustomUser, Project, Document, Message

class ViewTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username='test', email='test@e.com', password='pw')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(owner=self.user, title="Test Proj")

    def test_user_register(self):
        url = '/api/user' # Explicit path
        data = {'id': '123e4567-e89b-12d3-a456-426614174001', 'email': 'new@e.com', 'username': 'new'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_project(self):
        url = '/api/projects'
        data = {'title': 'New P', 'description': 'D'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_project_list(self):
        url = '/api/projects'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch('api.services.document_service.DocumentService.process_document_by_id')
    def test_upload_document(self, mock_process):
        url = f'/api/projects/{self.project.id}/documents'
        file = SimpleUploadedFile("test.pdf", b"content", content_type="application/pdf")
        response = self.client.post(url, {'file': file})
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        # mock_process is called 

    def test_delete_document(self):
        doc = Document.objects.create(project=self.project, name='del.pdf', file='del.pdf')
        url = f'/api/projects/{self.project.id}/documents/{doc.id}'
        with patch('api.services.document_service.DocumentService.delete_document_vectors'):
            response = self.client.delete(url)
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            self.assertFalse(Document.objects.filter(id=doc.id).exists())

    @patch('api.services.rag_service.RAGService.get_answer')
    def test_chat_message(self, mock_rag):
        mock_rag.return_value = {'answer': 'AI Ans', 'sources': []}
        url = f'/api/projects/{self.project.id}/messages'
        response = self.client.post(url, {'content': 'Hi'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 2) # User + AI
