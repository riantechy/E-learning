from django.db import models
from django.utils import timezone
from users.models import User
import uuid

class CourseCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

class Course(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PENDING_REVIEW', 'Pending Review'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True)
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_courses')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    duration_hours = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)

    def approve(self, approved_by):
        if self.status == 'PENDING_REVIEW':
            self.status = 'PUBLISHED'
            self.published_at = timezone.now()
            self.save()
            # Send notification to content manager
            from notifications.models import Notification
            Notification.objects.create(
                recipient=self.created_by,
                title="Course Approved",
                message=f"Your course '{self.title}' has been approved and published."
            )
            return True
        return False

    def reject(self, rejected_by, reason):
        if self.status == 'PENDING_REVIEW':
            self.status = 'DRAFT'
            self.save()
            # Send notification with rejection reason
            from notifications.models import Notification
            Notification.objects.create(
                recipient=self.created_by,
                title="Course Rejected",
                message=f"Your course '{self.title}' was rejected. Reason: {reason}"
            )
            return True
        return False
    
    def __str__(self):
        return self.title
    
    def publish(self):
        self.status = 'PUBLISHED'
        self.published_at = timezone.now()
        self.save()

class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    CONTENT_TYPES = (
        ('VIDEO', 'Video'),
        ('PDF', 'PDF'),
        ('TEXT', 'Text'),
        ('QUIZ', 'Quiz'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    content = models.TextField(blank=True)  # Can be text content or URL to media
    duration_minutes = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.module.title} - {self.title}"

class UserProgress(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'lesson')
    
    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)
    
    @classmethod
    def get_course_progress(cls, user, course):
        total_lessons = Lesson.objects.filter(module__course=course).count()
        completed_lessons = cls.objects.filter(
            user=user,
            lesson__module__course=course,
            is_completed=True
        ).count()
        return {
            'completed': completed_lessons,
            'total': total_lessons,
            'percentage': round((completed_lessons / total_lessons) * 100, 2) if total_lessons > 0 else 0
        }

class Enrollment(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'course')
