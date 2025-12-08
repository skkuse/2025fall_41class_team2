from django.test import TestCase
from ..models import CustomUser, Project, Document, Message, Quiz, Question, DocumentPage

class ModelTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser', email='test@example.com', password='password', id='123e4567-e89b-12d3-a456-426614174000'
        )
        self.project = Project.objects.create(
            owner=self.user, title='Test Project', description='Desc'
        )

    def test_project_creation(self):
        self.assertEqual(self.project.owner, self.user)
        self.assertEqual(self.project.title, 'Test Project')
        self.assertTrue(self.project.created_at)

    def test_document_creation(self):
        doc = Document.objects.create(
            project=self.project, name='test.pdf', file='test.pdf'
        )
        self.assertEqual(doc.status, 'processed') # default
        self.assertEqual(str(doc), 'test.pdf')

    def test_message_creation(self):
        msg = Message.objects.create(
            project=self.project, role='user', content='Hello'
        )
        self.assertEqual(str(msg), '[user] Hello...')
        
    def test_cascade_delete(self):
        # User delete -> Project delete
        doc = Document.objects.create(project=self.project, name='doc')
        self.user.delete()
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())
        self.assertFalse(Document.objects.filter(id=doc.id).exists())
