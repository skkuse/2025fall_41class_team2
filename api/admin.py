from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Project, Document, DocumentPage, Message, Quiz, Question

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'created_at', 'updated_at')
    list_filter = ('created_at', 'owner')
    search_fields = ('title', 'description', 'owner__username')
    date_hierarchy = 'created_at'

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'project')
    search_fields = ('name', 'project__title')

@admin.register(DocumentPage)
class DocumentPageAdmin(admin.ModelAdmin):
    list_display = ('document', 'page_number', 'short_text')
    list_filter = ('document',)
    
    def short_text(self, obj):
        return obj.original_text[:50] + "..." if obj.original_text else ""

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('project', 'role', 'short_content', 'created_at')
    list_filter = ('role', 'created_at', 'project')
    search_fields = ('content', 'project__title')

    def short_content(self, obj):
        return obj.content[:50] + "..."

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'quiz_type', 'created_at')
    list_filter = ('quiz_type', 'created_at', 'project')
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'short_question', 'answer')
    search_fields = ('question_text',)
    
    def short_question(self, obj):
        return obj.question_text[:50] + "..."
