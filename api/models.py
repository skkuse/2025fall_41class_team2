from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # AbstractUser는 username, password, email, first_name, last_name 등
    # 로그인 기능에 필요한 모든 필드를 이미 가지고 있습니다.
    # 지금은 추가 필드가 없으므로 pass를 사용하지만, 나중에 확장할 수 있습니다.
    pass

    def __str__(self):
        return self.username

class Project(models.Model):
    # 이 프로젝트를 소유한 사용자 (CustomUser와 1:N 관계)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"


# Document 모델을 수정합니다.
class Document(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    
    # [!] 변경점: CharField -> FileField
    # 'user_uploads/'라는 폴더 안에 파일이 저장됩니다.
    file = models.FileField(upload_to='user_uploads/') 
    
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename