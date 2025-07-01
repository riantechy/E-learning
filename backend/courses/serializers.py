from rest_framework import serializers
from .models import CourseCategory, Course, Module, Lesson, UserProgress, Enrollment, LessonSection, ModuleProgress
from users.models import User

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('created_by', 'published_at', 'created_at', 'updated_at')

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'

class ModuleProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleProgress
        fields = ['id', 'user', 'module', 'is_completed', 'completed_at']
        read_only_fields = ['user', 'completed_at']
class LessonSectionSerializer(serializers.ModelSerializer):
    subsections = serializers.SerializerMethodField()

    class Meta:
        model = LessonSection
        fields = '__all__'
        extra_kwargs = {
            'parent_section': {'required': False, 'allow_null': True}
        }
    
    def get_subsections(self, obj):
        subsections = obj.subsections.all().order_by('order')
        return LessonSectionSerializer(
            subsections,
            many=True,
            context=self.context
        ).data

# class LessonSerializer(serializers.ModelSerializer):
#     sections = serializers.SerializerMethodField()

#     class Meta:
#         model = Lesson
#         fields = '__all__'
    
#     def get_sections(self, obj):
#         sections = obj.sections.filter(parent_section__isnull=True).order_by('order')
#         serializer = LessonSectionSerializer(
#             sections,
#             many=True,
#             context=self.context  # Pass along the context
#         )
#         return serializer.data

class LessonSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = '__all__'
    
    def get_sections(self, obj):
        # Get top-level sections (those without parents)
        sections = obj.sections.filter(parent_section__isnull=True).order_by('order')
        serializer = LessonSectionSerializer(
            sections,
            many=True,
            context=self.context
        )
        return serializer.data
    
    def get_has_quiz(self, obj):
        # Determine if this lesson has a quiz
        return obj.content_type == 'QUIZ'

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'
        read_only_fields = ('user', 'last_accessed', 'completed_at')


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['user', 'enrolled_at']