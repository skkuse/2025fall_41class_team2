from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from api.models import Project, Message
from api.serializers import MessageSerializer
from api.services.rag_service import RAGService

from api.services.rag_service import RAGService

class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        messages = project.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, project_id, *args, **kwargs):
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

        serializer = MessageSerializer(ai_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SuggestedQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        
        last_message = project.messages.filter(role='assistant').order_by('-created_at').first()
        last_message_content = last_message.content if last_message else None
        
        rag_service = RAGService()
        questions = rag_service.generate_suggested_questions(project_id, last_message_content)
        
        return Response(questions, status=status.HTTP_200_OK)
