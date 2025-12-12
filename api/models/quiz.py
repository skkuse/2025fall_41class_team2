import uuid
from django.db import models
from .project import Project

class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255, default="Generated Quiz")
    quiz_type = models.CharField(max_length=20, choices=[('MULTIPLE_CHOICE', 'Multiple Choice'), ('FLASHCARD', 'Flashcard')], default='MULTIPLE_CHOICE')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    options = models.JSONField(default=list)
    answer = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_text[:50]
