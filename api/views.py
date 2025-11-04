# llm_project/api/views.py

from rest_framework import generics, permissions, status # <-- status 임포트
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
# [!] 추가 임포트
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Project, Document # <-- Project, Document 임포트
from .serializers import UserSerializer, ProjectSerializer, DocumentSerializer # <-- Serializer 임포트
from .rag_utils import process_and_index_pdf, remove_document_vectors, get_rag_answer # <-- get_rag_answer 임포트
# 1. 회원가입 (Register) View
class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    # 이 API는 인증 없이(로그인하지 않고) 누구나 접근 가능해야 함
    permission_classes = [permissions.AllowAny]

# 2. 로그인 (Login) View
class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # 부모 클래스(ObtainAuthToken)의 post 메서드를 호출
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # 사용자에 대한 토큰을 가져오거나, 없으면 새로 생성
        token, created = Token.objects.get_or_create(user=user)
        
        # 로그인 성공 시 토큰과 함께 사용자 정보(username, email)를 반환
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })
    
# [!] 프로젝트 생성 및 목록 조회 View
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    # [!] 인증된 사용자만 이 API를 사용할 수 있음
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 현재 로그인한 사용자의 프로젝트만 조회
        return self.request.user.projects.all()

    def perform_create(self, serializer):
        # 새 프로젝트 생성 시, 'owner'를 현재 로그인한 사용자로 자동 설정
        serializer.save(owner=self.request.user)

# [!] 파일 업로드 View
class DocumentUploadView(APIView):
    # [!] 인증된 사용자만 사용 가능
    permission_classes = [permissions.IsAuthenticated]
    # [!] 파일 업로드를 위해 MultiPartParser 사용
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        # 1. 요청에서 project_id와 file을 받음
        project_id = request.data.get('project_id')
        file_obj = request.data.get('file')

        if not project_id or not file_obj:
            return Response(
                {"error": "project_id와 file은 필수 항목입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. project_id로 프로젝트를 찾음
        project = get_object_or_404(Project, id=project_id)

        # 3. [보안] 현재 로그인한 사용자가 프로젝트의 소유자인지 확인
        if project.owner != request.user:
            return Response(
                {"error": "프로젝트 소유자만 파일을 업로드할 수 있습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 4. Document 객체 생성 및 저장
        document = Document.objects.create(
            project=project,
            file=file_obj,
            original_filename=file_obj.name
        )
        # [!] 5. RAG 인덱싱 트리거 (파일 저장 직후 실행)
        # (참고: 실제 서비스에서는 이 부분을 비동기(Celery)로 처리해야 합니다)
        indexing_success = process_and_index_pdf(document)
        
        if not indexing_success:
            return Response(
                {"error": "파일 저장 성공, RAG 인덱싱 실패"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



        # 6. 성공 응답 반환
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

# [!] 문서 삭제 View
class DocumentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, document_id, *args, **kwargs):
        # 1. DB(MySQL)에서 문서 객체 찾기
        document = get_object_or_404(Document, id=document_id)

        # 2. [보안] 소유자 확인
        if document.project.owner != request.user:
            return Response(
                {"error": "문서 소유자만 삭제할 수 있습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # 3. [ChromaDB] 벡터 데이터 삭제 (가장 먼저)
            remove_document_vectors(document)

            # 4. [File System] 실제 PDF 파일 삭제
            document.file.delete(save=False) 

            # 5. [MySQL] DB에서 Document 객체 삭제
            document.delete()

            return Response(
                {"message": "문서와 관련 벡터가 성공적으로 삭제되었습니다."},
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {"error": f"삭제 중 오류 발생: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

# [!] 챗봇 View (신규 추가)
class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id, *args, **kwargs):
        # 1. 사용자의 질문(query)을 받음
        query = request.data.get('query')
        if not query:
            return Response(
                {"error": "query는 필수 항목입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. 프로젝트 객체를 찾음
        project = get_object_or_404(Project, id=project_id)

        # 3. [보안] 프로젝트 소유자 확인
        if project.owner != request.user:
            return Response(
                {"error": "프로젝트 소유자만 채팅할 수 있습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 4. RAG 유틸리티 함수를 호출하여 답변 받기
        answer = get_rag_answer(project_id, query)

        # 5. 답변 반환
        return Response(
            {"answer": answer},
            status=status.HTTP_200_OK
        )