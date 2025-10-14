from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
import re

def validate_password_complexity(password):
    """
    Validate password meets complexity requirements:
    - At least 8 characters
    - At least 1 digit
    - At least 1 letter
    - At least 1 special character
    """
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least 1 digit")
    if not re.search(r'[A-Za-z]', password):
        raise ValidationError("Password must contain at least 1 letter")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least 1 special character")

class UserSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'gender', 'phone',
            'date_of_birth', 'county', 'education', 'innovation', 'innovation_stage',
            'innovation_in_whitebox', 'innovation_industry', 'training', 'training_institution',
            'date_joined', 'profile_image', 'is_verified'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True,
        validators=[validate_password_complexity]
    )

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'gender', 'phone',
            'date_of_birth', 'county', 'education', 'agreed_to_terms'
        ]
        extra_kwargs = {
            'agreed_to_terms': {'required': True},
            'gender': {'required': True},
            'phone': {'required': True},
            'education': {'required': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            gender=validated_data['gender'],
            phone=validated_data['phone'],
            date_of_birth=validated_data['date_of_birth'],
            county=validated_data['county'],
            education=validated_data['education'],
            agreed_to_terms=validated_data['agreed_to_terms'],
            role='LEARNER'
        )
        return user

class AdminUserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'gender', 'phone',
            'date_of_birth', 'county', 'education', 'innovation', 
            'innovation_stage', 'innovation_in_whitebox', 'innovation_industry',
            'training', 'training_institution', 'agreed_to_terms', 'role'
        ]

    def create(self, validated_data):
        # Generate a random temporary password
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + string.punctuation
        temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        # Create user with temporary password
        user = User.objects.create_user(
            email=validated_data['email'],
            password=temp_password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            gender=validated_data['gender'],
            phone=validated_data['phone'],
            date_of_birth=validated_data['date_of_birth'],
            county=validated_data['county'],
            education=validated_data['education'],
            agreed_to_terms=validated_data['agreed_to_terms'],
            role=validated_data.get('role', 'LEARNER'),
            is_verified=True,
            force_password_change=True  
        )
        
        # Set additional fields
        for field in ['innovation', 'innovation_stage', 'innovation_in_whitebox', 
                     'innovation_industry', 'training', 'training_institution']:
            if field in validated_data:
                setattr(user, field, validated_data[field])
        
        user.save()
        
        # Send welcome email with temporary password
        from .email_utils import send_welcome_email
        send_welcome_email(user, temp_password)
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled")
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password_complexity]
    )
class BulkEmailSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    send_to_all = serializers.BooleanField(default=False)
    subject = serializers.CharField(required=True, max_length=255)
    message = serializers.CharField(required=True)
    is_html = serializers.BooleanField(default=False)
    
    def validate(self, data):
        if not data.get('send_to_all') and not data.get('user_ids'):
            raise serializers.ValidationError("Either select users or send to all users")
        return data
