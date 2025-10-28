from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import UserProgress, ModuleProgress, Lesson
from django.utils import timezone

@receiver(post_save, sender=UserProgress)
def update_module_progress_from_lesson(sender, instance, **kwargs):
    """
    Update module progress when all lessons in a module are completed
    """
    # Use transaction.on_commit to avoid recursion during the same transaction
    transaction.on_commit(lambda: _update_module_progress(instance))

def _update_module_progress(instance):
    """Actual implementation separated to avoid recursion"""
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
            # Use update_or_create but avoid signal recursion
            progress, created = ModuleProgress.objects.get_or_create(
                user=user,
                module=module,
                defaults={
                    'is_completed': True,
                    'completed_at': instance.completed_at or timezone.now()
                }
            )
            if not created and not progress.is_completed:
                # Manually update without triggering post_save
                ModuleProgress.objects.filter(
                    user=user, 
                    module=module
                ).update(
                    is_completed=True,
                    completed_at=instance.completed_at or timezone.now()
                )

@receiver(post_save, sender=ModuleProgress)
def update_lesson_progress_from_module(sender, instance, **kwargs):
    """
    Update all lesson progress when a module is marked as completed
    """
    # Use transaction.on_commit to avoid recursion during the same transaction
    transaction.on_commit(lambda: _update_lesson_progress(instance))

def _update_lesson_progress(instance):
    """Actual implementation separated to avoid recursion"""
    if instance.is_completed:
        user = instance.user
        module = instance.module
        completed_at = instance.completed_at or timezone.now()
        
        # Get all lessons in this module
        lessons = Lesson.objects.filter(module=module)
        
        # Mark all lessons as completed without triggering individual signals
        for lesson in lessons:
            # Use update_or_create but update without save if possible
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                lesson=lesson,
                defaults={
                    'is_completed': True,
                    'completed_at': completed_at
                }
            )
            if not created and not progress.is_completed:
                # Manually update without triggering post_save
                UserProgress.objects.filter(
                    user=user,
                    lesson=lesson
                ).update(
                    is_completed=True,
                    completed_at=completed_at
                )