# llm_project/api/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    
    # [!] /api/projects/ (GET: 목록, POST: 생성)
    path('projects/', views.ProjectListCreateView.as_view(), name='project-list-create'),
    
    # [!] /api/documents/upload/ (POST: 파일 업로드)
    path('documents/upload/', views.DocumentUploadView.as_view(), name='document-upload'),
    path('documents/<int:document_id>/', views.DocumentDeleteView.as_view(), name='document-delete'),
    # [!] /api/projects/1/chat/ (POST: 1번 프로젝트에 질문하기)
    path('projects/<int:project_id>/chat/', views.ChatView.as_view(), name='project-chat'),
]