from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from ..models import CustomUser, Project, Document, Message, Quiz

class UserJourneyFlowTests(APITestCase):
    def test_full_rag_flow(self):
        # 1. Register
        url_reg = '/api/user'
        user_id = '123e4567-e89b-12d3-a456-426614174002'
        self.client.put(url_reg, {'id': user_id, 'email': 'flow@test.com', 'username': 'flow'})
        
        # Verify user created
        user = CustomUser.objects.get(email='flow@test.com')
        self.client.force_authenticate(user=user)

        # 2. Create Project
        url_proj = '/api/projects'
        res_proj = self.client.post(url_proj, {'title': 'Flow Project'})
        project_id = res_proj.data['id']
        
        # 3. Upload Document
        url_doc = f'/api/projects/{project_id}/documents'
        file = SimpleUploadedFile("flow.pdf", b"pdf content", content_type="application/pdf")
        
        # Mock background processing
        with patch('api.services.document_service.DocumentService.process_document_by_id') as mock_process:
            self.client.post(url_doc, {'file': file})
            # Simulate "Processing" completion manually in DB
            Document.objects.filter(project__id=project_id).update(status='processed')

        # 4. Chat (Ask Question)
        url_msg = f'/api/projects/{project_id}/messages'
        with patch('api.services.rag_service.RAGService.get_answer') as mock_rag:
            mock_rag.return_value = {
                'answer': 'Flow Answer', 
                'sources': [{'document_id': 'doc-1', 'page': 1}]
            }
            res_msg = self.client.post(url_msg, {'content': 'What is flow?'})
            self.assertEqual(res_msg.status_code, status.HTTP_201_CREATED)
            self.assertEqual(res_msg.data['content'], 'Flow Answer')

        # 5. Generate Quiz
        url_quiz = f'/api/projects/{project_id}/quizzes'
        with patch('api.services.quiz_service.QuizService.generate_quiz') as mock_quiz_gen:
            # Mock return a helper Quiz obj
            mock_quiz_obj = Quiz.objects.create(project_id=project_id, title="Flow Quiz")
            mock_quiz_gen.return_value = mock_quiz_obj
            
            res_quiz = self.client.post(url_quiz, {'num_questions': 3})
            self.assertEqual(res_quiz.status_code, status.HTTP_201_CREATED)
