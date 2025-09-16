from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse
from django.utils import timezone
from .models import User
from notifications.models import Notification

@receiver(post_save, sender=User)
def handle_user_signup(sender, instance, created, **kwargs):
    if created:
                
        # Create welcome notification
        Notification.objects.create(
            recipient=instance,
            title="Welcome to Our Learning Platform!",
            message=(
                "Thank you for joining our learning community! "
                "Here you'll find courses to enhance your skills, track your progress, "
                "and earn certificates. Start by exploring our course catalog."
            ),
            notification_type='SYSTEM',
            priority='HIGH',
        )

@receiver(post_save, sender=User)
def handle_first_login(sender, instance, **kwargs):
    # Check if this is the first login and notification hasn't been sent yet
    if instance.last_login and not instance.first_login_notification_sent:
        # Create first login notification
        Notification.objects.create(
            recipient=instance,
            title="Getting Started Guide",
            message=(
                "Welcome to your learning journey! Here's how to get started:\n"
                "1. Browse our course catalog to find interesting topics\n"
                "2. Enroll in courses that match your interests\n"
                "3. Track your progress in your dashboard\n"
                "4. Complete assessments to earn certificates\n\n"
                "Need help? Visit our help center or contact support."
            ),
            notification_type='SYSTEM',
            priority='MEDIUM',
            # action_url=reverse('help-center')
        )
        
        # Mark notification as sent
        instance.first_login_notification_sent = True
        # Save without triggering the signal again
        User.objects.filter(pk=instance.pk).update(
            first_login_notification_sent=True
        )