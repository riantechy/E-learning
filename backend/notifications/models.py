# notifications/models.py
from django.db import models
from django.utils import timezone
from users.models import User
import uuid

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('COURSE', 'Course Related'),
        ('SYSTEM', 'System Notification'),
        ('CERTIFICATE', 'Certificate'),
        ('ASSESSMENT', 'Assessment'),
        ('SOCIAL', 'Social Interaction'),
        ('ADMIN', 'Admin Alert'),
    )
    
    PRIORITY_LEVELS = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='MEDIUM')
    is_read = models.BooleanField(default=False)
    related_object_id = models.UUIDField(null=True, blank=True)
    related_content_type = models.CharField(max_length=50, null=True, blank=True)  # e.g., 'course', 'certificate'
    action_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save()

class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Course-related notifications
    course_updates = models.BooleanField(default=True)
    new_content = models.BooleanField(default=True)
    deadline_reminders = models.BooleanField(default=True)
    live_session_reminders = models.BooleanField(default=True)
    
    # Social notifications
    forum_replies = models.BooleanField(default=True)
    mentions = models.BooleanField(default=True)
    
    # System notifications
    certificate_issued = models.BooleanField(default=True)
    course_completed = models.BooleanField(default=True)
    progress_reports = models.BooleanField(default=True)
    
    # Admin notifications (for admin users)
    user_reports = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)
    course_approvals = models.BooleanField(default=True)
    
    # Delivery methods
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification preferences for {self.user.email}"