from django.contrib import admin
from .models import (
    CourseCategory,
    Course,
    Module,
    Lesson,
    LessonSection,
    UserProgress
)

@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'created_at', 'published_at', 'is_featured')
    list_filter = ('status', 'is_featured', 'category')
    search_fields = ('title', 'description')
    # raw_id_fields = ('created_by',)

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course',)
    search_fields = ('title',)

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'content_type', 'order', 'is_required', 'duration_minutes')
    list_filter = ('content_type', 'is_required')
    search_fields = ('title',)

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'is_completed', 'completed_at', 'last_accessed')
    list_filter = ('is_completed',)
    search_fields = ('user__email', 'lesson__title')
