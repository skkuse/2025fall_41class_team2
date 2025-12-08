from rest_framework import generics, permissions
from api.models import Project
from api.serializers import ProjectSerializer
from api.services.document_service import DocumentService

from api.services.document_service import DocumentService

class ProjectListCreateView(generics.ListCreateAPIView):
    # ... (unchanged)
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'project_id'

    def get_queryset(self):
        return self.request.user.projects.all()
    
    def perform_destroy(self, instance):
        document_service = DocumentService()
        for document in instance.documents.all():
            try:
                document_service.delete_document_vectors(document)
            except Exception as e:
                print(f"Error removing vectors for document {document.id}: {e}")
        instance.delete()
