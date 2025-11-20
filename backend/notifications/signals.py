from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.urls import reverse
from django.utils import timezone
from .models import Notification, NotificationPreference
from users.models import User
from courses.models import Course, Enrollment, Lesson, Module
from certificates.models import Certificate
from assessments.models import UserAttempt, SurveyResponse
# from assessments.models import QuizAttempt, SurveyResponse

@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    if created:
        NotificationPreference.objects.create(user=instance)

# Course-related notifications
@receiver(post_save, sender=Course)
def notify_course_approval(sender, instance, created, **kwargs):
    if not created and instance.status == 'PUBLISHED':
        create_course_notification(
            instance,
            "Course Published",
            f"Your course '{instance.title}' has been published and is now available to students.",
            'COURSE'
        )

@receiver(post_save, sender=Lesson)
def notify_new_lesson(sender, instance, created, **kwargs):
    if created:
        course = instance.module.course
        enrolled_users = User.objects.filter(enrollment__course=course)
        
        for user in enrolled_users:
            if hasattr(user, 'notification_preferences') and user.notification_preferences.new_content:
                Notification.objects.create(
                    recipient=user,
                    title="New Lesson Available",
                    message=f"A new lesson '{instance.title}' has been added to '{course.title}'",
                    notification_type='COURSE',
                    related_object_id=course.id,
                    related_content_type='course',
                    action_url=reverse('lesson-detail', kwargs={
                        'course_pk': instance.module.course.id,
                        'module_pk': instance.module.id,
                        'pk': instance.id
                    })
                )


# Enrollment notifications
@receiver(post_save, sender=Enrollment)
def notify_course_enrollment(sender, instance, created, **kwargs):
    if created:
        # Check if user has notification preferences and course updates are enabled
        if hasattr(instance.user, 'notification_preferences') and instance.user.notification_preferences.course_updates:
            Notification.objects.create(
                recipient=instance.user,
                title="Course Enrollment",
                message=f"You have enrolled in '{instance.course.title}'",
                notification_type='COURSE',
                priority='MEDIUM',
                related_object_id=instance.course.id,
                related_content_type='course',
                action_url=reverse('course-detail', kwargs={'pk': instance.course.id})
            )


# Assessment notifications
@receiver(post_save, sender=UserAttempt)
def notify_quiz_results(sender, instance, created, **kwargs):
    if not created and instance.score is not None:
        if hasattr(instance.user, 'notification_preferences') and instance.user.notification_preferences.progress_reports:
            Notification.objects.create(
                recipient=instance.user,
                title="Quiz Results Available",
                message=f"Your results for the quiz in '{instance.lesson.title}' are ready",
                notification_type='ASSESSMENT',
                related_object_id=instance.id,
                related_content_type='quiz_attempt',
                action_url=reverse('quiz-results', kwargs={'attempt_id': instance.id})
            )

@receiver(post_save, sender=SurveyResponse)
def notify_survey_submission(sender, instance, created, **kwargs):
    if created and instance.survey.module.course.created_by != instance.user:
        course_creator = instance.survey.module.course.created_by
        if hasattr(course_creator, 'notification_preferences') and course_creator.notification_preferences.user_reports:
            Notification.objects.create(
                recipient=course_creator,
                title="New Survey Response",
                message=f"A student has submitted a survey for '{instance.survey.module.title}'",
                notification_type='ADMIN',
                related_object_id=instance.id,
                related_content_type='survey_response',
                action_url=reverse('survey-responses', kwargs={'survey_id': instance.survey.id})
            )

# Progress notifications
def create_progress_notification(user, course, milestone):
    if hasattr(user, 'notification_preferences') and user.notification_preferences.progress_reports:
        Notification.objects.create(
            recipient=user,
            title="Course Progress",
            message=f"You've reached {milestone}% completion in '{course.title}'",
            notification_type='PROGRESS',
            related_object_id=course.id,
            related_content_type='course',
            action_url=reverse('course-progress', kwargs={'course_id': course.id})
        )

# Helper functions
def create_course_notification(course, title, message, notification_type='COURSE'):
    enrolled_users = User.objects.filter(enrollment__course=course)
    for user in enrolled_users:
        if hasattr(user, 'notification_preferences') and user.notification_preferences.course_updates:
            Notification.objects.create(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                related_object_id=course.id,
                related_content_type='course',
                action_url=reverse('course-detail', kwargs={'pk': course.id})
            )

def create_certificate_notification(certificate):
    user = certificate.user
    if hasattr(user, 'notification_preferences') and user.notification_preferences.certificate_issued:
        Notification.objects.create(
            recipient=user,
            title="Certificate Issued",
            message=f"Your certificate for {certificate.course.title} is ready!",
            notification_type='CERTIFICATE',
            related_object_id=certificate.id,
            related_content_type='certificate',
            action_url=reverse('download-certificate', kwargs={'certificate_id': certificate.id})
        )

# @receiver(post_save, sender=User)
# def send_admin_new_user_notification(sender, instance, created, **kwargs):
#     if created:
#         # Notify all active admins about a new user registration
#         admins = User.objects.filter(role='ADMIN', is_active=True)
#         for admin in admins:
#             if hasattr(admin, 'notification_preferences') and admin.notification_preferences.user_reports:
#                 # Attempt to build action URL
#                 try:
#                     action_url = reverse('user-detail', kwargs={'pk': instance.id})
#                 except NoReverseMatch:
#                     action_url = ''
                
#                 # Create notification for the admin
#                 Notification.objects.create(
#                     recipient=admin,
#                     title="New User Registration",
#                     message=f"New user registered: {instance.email} ({instance.get_role_display()})",
#                     notification_type='ADMIN',
#                     priority='LOW',
#                     action_url=action_url
#                 )