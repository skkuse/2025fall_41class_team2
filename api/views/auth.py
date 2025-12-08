from rest_framework import permissions, status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import CustomUser
from api.serializers import UserSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def put(self, request, *args, **kwargs):
        email = request.data.get('email')
        user_id = request.data.get('id')
        username = request.data.get('username')

        if not email or not user_id:
            return Response({"error": "Email and ID are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user, created = CustomUser.objects.get_or_create(
                id=user_id,
                defaults={'email': email, 'username': username or email.split('@')[0]}
            )
            if not created:
                user.email = email
                if username:
                    user.username = username
                user.save()

            token, _ = Token.objects.get_or_create(user=user)
            
            serializer = UserSerializer(user)
            response = Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
            response.set_cookie(
                key='auth_token',
                value=token.key,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=60*60*24*30
            )
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })
