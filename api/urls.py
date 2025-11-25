# llm_project/api/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('user', views.RegisterView.as_view(), name='register'), # PUT /user
    path('login', views.CustomLoginView.as_view(), name='login'),
    
    # Projects
    path('projects', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<uuid:project_id>', views.ProjectDetailView.as_view(), name='project-detail'),
    
    # Documents
    path('projects/<uuid:project_id>/documents', views.DocumentListUploadView.as_view(), name='document-list-upload'),
    path('projects/<uuid:project_id>/documents/<uuid:document_id>', views.DocumentDeleteView.as_view(), name='document-delete'),
    path('projects/<uuid:project_id>/documents/<uuid:document_id>/pages', views.DocumentPageListView.as_view(), name='document-page-list'),
    
    # Chat
    path('projects/<uuid:project_id>/messages', views.MessageListCreateView.as_view(), name='message-list-create'),
    
    # Quizzes
    path('projects/<uuid:project_id>/quizzes', views.QuizListCreateView.as_view(), name='quiz-list-create'),
    path('projects/<uuid:project_id>/quizzes/<uuid:quiz_id>', views.QuizDetailView.as_view(), name='quiz-detail'),
]