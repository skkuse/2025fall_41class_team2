# llm_project/api/serializers.py

from rest_framework import serializers
from .models import CustomUser, Project, Document

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # 'username', 'email', 'password' 필드를 사용
        fields = ('username', 'email', 'password')
        # password 필드는 API 응답에 포함되지 않도록 설정 (쓰기 전용)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Serializer의 create 메서드를 오버라이드하여
        # create_user() 함수를 사용 (비밀번호를 해싱하기 위함)
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    

# [!] Project Serializer 추가
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        # 'owner'는 자동으로 설정할 것이므로 필드에 포함하지 않음
        fields = ['id', 'name', 'created_at']

# [!] Document Serializer 추가
class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'original_filename', 'uploaded_at', 'file']