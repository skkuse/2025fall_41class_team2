from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from api.models import Project, Document
from api.serializers import DocumentSerializer, DocumentPageSerializer
from api.services.document_service import DocumentService
import threading

from api.services.document_service import DocumentService
import threading

class DocumentListUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        documents = project.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, project_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        file_obj = request.data.get('file')

        if not file_obj:
            return Response({"error": "File is required"}, status=status.HTTP_400_BAD_REQUEST)

        document = Document.objects.create(
            project=project,
            file=file_obj,
            name=file_obj.name,
            status='processing',
            processing_message='Queued for processing...'
        )
        
        # Instantiate service here or ensure checking class method?
        # process_document_by_id creates a fresh service instance if it was a static helper,
        # but it is an instance method.
        # We need an instance to pass the method.
        document_service = DocumentService()
        thread = threading.Thread(target=document_service.process_document_by_id, args=(document.id,))
        thread.start()
        
        return Response(DocumentSerializer(document).data, status=status.HTTP_202_ACCEPTED)

class DocumentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, project_id, document_id, *args, **kwargs):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        document = get_object_or_404(Document, id=document_id, project=project)
        
        document_service = DocumentService()
        try:
            document_service.delete_document_vectors(document)
            document.file.delete(save=False)
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DocumentPageListView(generics.ListAPIView):
    serializer_class = DocumentPageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        document_id = self.kwargs['document_id']
        project = get_object_or_404(Project, id=project_id, owner=self.request.user)
        document = get_object_or_404(Document, id=document_id, project=project)
        return document.pages.all()
