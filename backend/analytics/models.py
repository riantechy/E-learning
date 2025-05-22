from django.db import models

# Create your models here.
from django.db import models
from django.utils import timezone
from users.models import User
from courses.models import Course
import uuid

class UserActivity(models.Model):
    ACTIVITY_TYPES = (
        ('LOGIN', 'User Login'),
        ('COURSE_VIEW', 'Course View'),
        ('LESSON_START', 'Lesson Started'),
        ('LESSON_COMPLETE', 'Lesson Completed'),
        ('QUIZ_ATTEMPT', 'Quiz Attempt'),
        ('CERTIFICATE_EARNED', 'Certificate Earned'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.user.email} - {self.get_activity_type_display()}"