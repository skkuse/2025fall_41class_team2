from django.test import TestCase
from ..serializers import UserSerializer, ProjectSerializer, DocumentSerializer
from ..models import CustomUser, Project

class SerializerTests(TestCase):
    def test_user_serializer_valid(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'strongpassword',
            'id': '123e4567-e89b-12d3-a456-426614174000'
        }
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, 'newuser')
        self.assertTrue(user.check_password('strongpassword'))

    def test_user_serializer_invalid_email(self):
        data = {'username': 'user', 'email': 'not-an-email', 'password': 'pw'}
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_project_serializer(self):
        user = CustomUser.objects.create(username='u', email='e@e.com')
        # ProjectSerializer expects 'owner' to be handled in view usually, 
        # but if we just validate input:
        data = {'title': 'My Title', 'description': 'My Desc'}
        serializer = ProjectSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        # Saving would require owner, but validation should pass
