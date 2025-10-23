from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserProgress, ModuleProgress, Lesson

@receiver(post_save, sender=UserProgress)
def update_module_progress_from_lesson(sender, instance, **kwargs):
    """
    Update module progress when all lessons in a module are completed
    """
    if instance.is_completed:
        module = instance.lesson.module
        user = instance.user
        
        # Get all lessons in this module
        lessons = Lesson.objects.filter(module=module)
        
        # Count completed lessons for this user in this module
        completed_lessons = UserProgress.objects.filter(
            user=user,
            lesson__in=lessons,
            is_completed=True
        ).count()
        
        # Update module progress if all lessons are completed
        if completed_lessons == lessons.count():
            ModuleProgress.objects.update_or_create(
                user=user,
                module=module,
                defaults={
                    'is_completed': True,
                    'completed_at': instance.completed_at or timezone.now()
                }
            )

@receiver(post_save, sender=ModuleProgress)
def update_lesson_progress_from_module(sender, instance, **kwargs):
    """
    Update all lesson progress when a module is marked as completed
    """
    if instance.is_completed:
        user = instance.user
        module = instance.module
        completed_at = instance.completed_at or timezone.now()
        
        # Get all lessons in this module
        lessons = Lesson.objects.filter(module=module)
        
        # Mark all lessons as completed
        for lesson in lessons:
            UserProgress.objects.update_or_create(
                user=user,
                lesson=lesson,
                defaults={
                    'is_completed': True,
                    'completed_at': completed_at
                }
            )