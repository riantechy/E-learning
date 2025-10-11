from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from .email_utils import send_verification_email, send_password_reset_email
import os
import uuid
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer, AdminUserCreateSerializer
from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
import jwt
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.shortcuts import get_object_or_404

import logging
logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{user.verification_token}"
        send_verification_email(user, verification_url)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        
        # Check if password change is required
        requires_password_change = user.force_password_change
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'requires_password_change': requires_password_change,
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class ProfileImageView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'profile_image' not in request.data:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            profile_image = request.data['profile_image']
            
            # Delete old image if exists
            if request.user.profile_image:
                old_image_path = os.path.join(settings.MEDIA_ROOT, request.user.profile_image.name)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)

            # Save new image
            file_name = f"profile_images/user_{request.user.id}_{profile_image.name}"
            file_path = default_storage.save(file_name, ContentFile(profile_image.read()))
            
            # Update user profile
            request.user.profile_image = file_path
            request.user.save()

            return Response({
                'profile_image_url': request.user.profile_image.url
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  
    pagination_class = None

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class LearnerListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'first_name', 'last_name']
    
    def get_queryset(self):
        return User.objects.filter(role='LEARNER').order_by('date_joined')

class LearnerCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = User.objects.filter(role='LEARNER').count()
        return Response({'count': count}, status=status.HTTP_200_OK)

class NonLearnerListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'first_name', 'last_name']
    
    def get_queryset(self):
        return User.objects.exclude(role='LEARNER')

class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add JSONParser

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle both JSON and form data
        if request.content_type == 'application/json':
            # For JSON data, we need to handle the profile_image field specially
            data = request.data.copy()
            if 'profile_image' in data and isinstance(data['profile_image'], str):
                # If profile_image is a string (URL), remove it from update data
                # as we don't want to change the image when it's just a URL reference
                del data['profile_image']
            serializer = self.get_serializer(instance, data=data, partial=partial)
        else:
            # For form data, use the data as is
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"detail": "User deleted successfully."},
            status=status.HTTP_200_OK
        )

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user  

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": "Wrong old password."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_password = serializer.data.get("new_password")
            
            # Check if new password matches any of the last 3 passwords
            if self.object.check_password_history(new_password):
                return Response(
                    {"new_password": "You cannot use any of your last 3 passwords."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            self.object.set_password(new_password)
            self.object.save()
            return Response(
                {"detail": "Password updated successfully"}, 
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserCreateSerializer  
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the user with the validated data
        user = serializer.save()
        
        return Response(
            UserSerializer(user).data, 
            status=status.HTTP_201_CREATED
        )
    # queryset = User.objects.all()
    # serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated]

    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
        
    #     # Create the user with the validated data
    #     user = User.objects.create_user(
    #         email=serializer.validated_data['email'],
    #         password=request.data.get('password', 'defaultpassword'),  
    #         first_name=serializer.validated_data['first_name'],
    #         last_name=serializer.validated_data['last_name'],
    #         profile_image=serializer.validated_data.get('profile_image'),
    #     )
        
    #     return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        try:
            user = User.objects.get(verification_token=token)
            
            if user.verification_token_expires < timezone.now():
                return Response({'error': 'Verification link has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
            user.is_verified = True
            user.save()
            
            return Response({'message': 'Email successfully verified'}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'message': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Generate new token
        user.verification_token = uuid.uuid4()
        user.verification_token_expires = timezone.now() + timedelta(days=1)
        user.save()
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{user.verification_token}"
        send_verification_email(user, verification_url)
        
        return Response({'message': 'Verification email resent'}, status=status.HTTP_200_OK)
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        logger.info(f"Password reset requested for email: {email}")
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email.lower())
            
            # Check if there's an existing valid token
            if (user.password_reset_token and 
                user.password_reset_token_expires and 
                user.password_reset_token_expires > timezone.now()):
                
                logger.info(f"Reusing existing valid reset token for {user.email}")
            else:
                # Generate new token only if none exists or expired
                reset_token = uuid.uuid4()
                user.password_reset_token = reset_token
                user.password_reset_token_expires = timezone.now() + timedelta(hours=24)
                user.save()
                logger.info(f"Generated new reset token for {user.email}")
            
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.password_reset_token}"
            logger.info(f"Sending password reset email to {user.email}")
            logger.info(f"Reset URL: {reset_url}")
            
            try:
                from .email_utils import send_password_reset_email
                send_password_reset_email(user, reset_url)
                logger.info("Password reset email function called successfully")
                
                # Return success even if we don't reveal whether user exists
                return Response(
                    {'message': 'If an account with this email exists, a password reset link has been sent'}, 
                    status=status.HTTP_200_OK
                )
                
            except Exception as e:
                logger.error(f"Password reset email failed: {str(e)}", exc_info=True)
                return Response(
                    {'error': 'Failed to send password reset email'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except User.DoesNotExist:
            # Don't reveal whether user exists for security
            logger.info(f"No user found for email: {email}")
            return Response(
                {'message': 'If an account with this email exists, a password reset link has been sent'}, 
                status=status.HTTP_200_OK
            )

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, token):
        try:
            user = User.objects.get(password_reset_token=token)
            
            if user.password_reset_token_expires < timezone.now():
                return Response(
                    {'error': 'Password reset link has expired'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            new_password = request.data.get('new_password')
            
            # Validate password complexity
            try:
                validate_password(new_password, user=user) 
            except ValidationError as e:
                return Response(
                    {'error': e.messages},  
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check password history
            if user.check_password_history(new_password):
                return Response(
                    {'error': 'Cannot use any of your last 3 passwords.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_token_expires = None
            user.save()
            
            return Response(
                {'message': 'Password successfully reset'}, 
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid password reset token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ForceChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'error': 'New password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password complexity
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as e:
            return Response(
                {'error': e.messages},  
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check password history
        if request.user.check_password_history(new_password):
            return Response(
                {'error': 'Cannot use any of your last 3 passwords.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password and remove force change flag
        request.user.set_password(new_password)
        request.user.force_password_change = False
        request.user.save()
        
        return Response(
            {'message': 'Password successfully changed'}, 
            status=status.HTTP_200_OK
        )

class UserDistributionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        distribution = User.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')
        
        # Map role codes to human-readable names
        role_map = dict(User.ROLES)
        data = [{
            'role': role_map.get(item['role'], item['role']),
            'count': item['count']
        } for item in distribution]
        
        return Response(data)