from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'gender', 'phone',
            'date_of_birth', 'county', 'education', 'innovation', 'innovation_stage',
            'innovation_in_whitebox', 'innovation_industry', 'training', 'training_institution',
            'status', 'date_registered', 'date_joined'
        ]
        read_only_fields = ['id', 'role', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    agreed_to_terms = serializers.BooleanField(required=True)

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
    new_password = serializers.CharField(required=True)
