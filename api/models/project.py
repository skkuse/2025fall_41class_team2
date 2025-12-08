import uuid
from django.db import models
from .user import CustomUser

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255) # name -> title
    description = models.TextField(null=True, blank=True) # added description
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # added updated_at

    def __str__(self):
        return f"{self.title} (Owner: {self.owner.username})"
