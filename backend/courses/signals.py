from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserProgress, ModuleProgress, Lesson

@receiver(post_save, sender=UserProgress)
def update_module_progress(sender, instance, **kwargs):
    if instance.is_completed:
        module = instance.lesson.module
        lessons = Lesson.objects.filter(module=module)
        completed_lessons = UserProgress.objects.filter(
            user=instance.user,
            lesson__in=lessons,
            is_completed=True
        ).count()
        
        # Update module progress if all lessons are completed
        if completed_lessons == lessons.count():
            ModuleProgress.objects.update_or_create(
                user=instance.user,
                module=module,
                defaults={'is_completed': True}
            )