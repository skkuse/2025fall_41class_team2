import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # Supabase의 UUID를 사용하기 위해 id 필드를 UUIDField로 변경
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    def __str__(self):
        return self.username

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255) # name -> title
    description = models.TextField(null=True, blank=True) # added description
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # added updated_at

    def __str__(self):
        return f"{self.title} (Owner: {self.owner.username})"


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

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20) # 'user' or 'assistant'
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True) # Store retrieved context metadata
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."

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

class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255, default="Generated Quiz")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    options = models.JSONField(default=list) # List of strings for multiple choice
    answer = models.CharField(max_length=255) # The correct answer string
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_text[:50]