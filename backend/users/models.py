from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid
from django.contrib.auth.hashers import make_password
import bcrypt

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
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
    innovation = models.TextField()
    innovation_stage = models.TextField()
    innovation_in_whitebox = models.TextField()
    innovation_industry = models.TextField()
    training = models.TextField()
    training_institution = models.TextField()
    agreed_to_terms = models.BooleanField(default=False)
    status = models.CharField(max_length=50)
    date_registered = models.CharField(max_length=50)

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
        self.password = make_password(raw_password)
        self._password = raw_password

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)
