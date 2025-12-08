from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from api.models import Project, Quiz, Message
from api.serializers import QuizSerializer, MessageSerializer
from api.services.quiz_service import QuizService
from api.services.rag_service import RAGService

from api.services.quiz_service import QuizService
from api.services.rag_service import RAGService

class QuizListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        quizzes = project.quizzes.all().order_by('-created_at')
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    def post(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        num_questions = request.data.get('num_questions', 5)
        quiz_type = request.data.get('quiz_type', 'MULTIPLE_CHOICE')
        
        quiz_service = QuizService()
        quiz = quiz_service.generate_quiz(project_id, num_questions, quiz_type)
        
        if quiz:
            serializer = QuizSerializer(quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Failed to generate quiz. Ensure documents are uploaded."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizDetailView(generics.RetrieveAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'quiz_id'

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Quiz.objects.filter(project__id=project_id, project__owner=self.request.user)

    def get(self, request, project_id, *args, **kwargs):
        # Override get to return messages? - wait, original code returned messages for GET on quiz detail???
        # Let's check original views.py line 236
        # "messages = project.messages.all().order_by('created_at')"
        # This looks like a mistake in original code or copy-paste?
        # QuizDetailView usually returns Quiz details.
        # But the original code: 
        # def get(self, request, project_id, ...):
        #   return messages...
        # If I change this logic, I break regression.
        # I must copy logic exactly.
        
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        messages = project.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, project_id, *args, **kwargs):
        # Original code had POST on QuizDetailView to send messages? 
        # That looks like Chat interface logic mixed in Quiz View?
        # Yes, line 242 in original.
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        content = request.data.get('content')

        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)

        user_message = Message.objects.create(
            project=project,
            role='user',
            content=content
        )
        
        rag_service = RAGService()
        rag_response = rag_service.get_answer(project_id, content)

        ai_message = Message.objects.create(
            project=project,
            role='assistant',
            content=rag_response['answer'],
            sources=rag_response['sources']
        )

        return Response(MessageSerializer(ai_message).data, status=status.HTTP_200_OK)
