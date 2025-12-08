import uuid
from django.db import models
from .project import Project

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='user_uploads/') 
    name = models.CharField(max_length=255) # original_filename -> name
    status = models.CharField(max_length=50, default='processed') # added status
    processing_message = models.CharField(max_length=255, blank=True, null=True) # added for progress tracking
    created_at = models.DateTimeField(auto_now_add=True) # uploaded_at -> created_at (to match spec, though spec says created_at in response)

    def __str__(self):
        return self.name

class DocumentPage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='pages')
    page_number = models.PositiveIntegerField()
    original_text = models.TextField()
    translated_text = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['page_number']

    def __str__(self):
        return f"{self.document.name} - Page {self.page_number}"
