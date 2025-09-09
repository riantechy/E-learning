# models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.db import models, transaction 
import uuid
from django.contrib.auth.hashers import make_password
import bcrypt

class PasswordHistory(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='password_history')
    password_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email).lower()  
        user = self.model(email=email, **extra_fields)
        
        # Set password after user is created to avoid history issues
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    is_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    verification_token_expires = models.DateTimeField(default=timezone.now() + timezone.timedelta(days=1))
    password_reset_token = models.UUIDField(null=True, blank=True, editable=False)
    password_reset_token_expires = models.DateTimeField(null=True, blank=True)
    ROLES = (
        ('LEARNER', 'Learner'),
        ('CONTENT_MANAGER', 'Content Manager'),
        ('ADMIN', 'Administrator'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.CharField(max_length=20)
    county = models.CharField(max_length=100)
    education = models.TextField()
    innovation = models.TextField(null=True, blank=True)
    innovation_stage = models.TextField(null=True, blank=True)
    innovation_in_whitebox = models.TextField(null=True, blank=True)
    innovation_industry = models.TextField(null=True, blank=True)
    training = models.TextField(null=True, blank=True)
    training_institution = models.TextField(null=True, blank=True)
    agreed_to_terms = models.BooleanField(default=False)

    role = models.CharField(max_length=20, choices=ROLES, default='LEARNER')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    def set_password(self, raw_password):
        # Store old password before changing, but only if user exists in DB
        if self.pk and self.password:  # Only if user already exists and has a password
            # Use transaction.on_commit to avoid foreign key issues
            def create_history():
                PasswordHistory.objects.create(
                    user=self, 
                    password_hash=self.password
                )
                # Keep only last 3 passwords
                histories = PasswordHistory.objects.filter(user=self).order_by('-created_at')
                if histories.count() > 3:
                    for history in histories[3:]:
                        history.delete()
            
            transaction.on_commit(create_history)
                    
        self.password = make_password(raw_password)
        self._password = raw_password

    def check_password_history(self, raw_password):
        """Check if password matches any of the last 3 passwords"""
        from django.contrib.auth.hashers import check_password
        recent_passwords = PasswordHistory.objects.filter(
            user=self
        ).order_by('-created_at')[:3]
        
        for history in recent_passwords:
            if check_password(raw_password, history.password_hash):
                return True
        return False

    def save(self, *args, **kwargs):
        # Ensure email is always lowercase
        self.email = self.email.lower()
        super().save(*args, **kwargs)
