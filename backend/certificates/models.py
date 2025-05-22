from django.db import models
from django.utils import timezone
from users.models import User
from courses.models import Course
import uuid

class CertificateTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    template_file = models.FileField(upload_to='certificate_templates/')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    template = models.ForeignKey(CertificateTemplate, on_delete=models.SET_NULL, null=True)
    issued_date = models.DateTimeField(default=timezone.now)
    certificate_number = models.CharField(max_length=50, unique=True)
    pdf_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    verification_url = models.URLField(blank=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.course.title}"