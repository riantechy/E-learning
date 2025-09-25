from rest_framework import serializers
from .models import CourseCategory, Course, Module, Lesson, UserProgress, Enrollment, LessonSection, ModuleProgress
from users.models import User

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = '__all__'

# class CourseSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Course
#         fields = '__all__'
#         read_only_fields = ('created_by', 'published_at', 'created_at', 'updated_at')

class CourseSerializer(serializers.ModelSerializer):
    module_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('created_by', 'published_at', 'created_at', 'updated_at')

    def get_module_count(self, obj):
        return obj.modules.count()

    def validate_status(self, value):
        # If trying to set status to PUBLISHED, check if course has modules
        if value == 'PUBLISHED':
            # For existing instances, check module count
            if self.instance and not self.instance.has_modules():
                raise serializers.ValidationError(
                    "Cannot publish a course without modules. Please add at least one module first."
                )
        return value

    def validate(self, data):
        # For new instances, we can't check modules during creation, but we can prevent direct publishing
        if not self.instance and data.get('status') == 'PUBLISHED':
            raise serializers.ValidationError(
                "New courses cannot be published directly. Please create modules first."
            )
        return data

class CourseProgressSerializer(serializers.Serializer):
    completed = serializers.IntegerField()
    total = serializers.IntegerField()
    percentage = serializers.FloatField()
    completed_modules = serializers.ListField(child=serializers.CharField())
    is_course_completed = serializers.BooleanField()
    completed_modules_count = serializers.IntegerField()
    total_modules_count = serializers.IntegerField()

class ModuleSerializer(serializers.ModelSerializer):
    lesson_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = '__all__'
    
    def get_lesson_count(self, obj):
        return obj.lessons.count()

class ModuleProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleProgress
        fields = ['id', 'user', 'module', 'is_completed', 'completed_at']
        read_only_fields = ['user', 'completed_at']

class LessonSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()
    content = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Lesson
        fields = '__all__'

    def get_sections(self, obj):
        sections = obj.sections.filter(parent_section__isnull=True).order_by('order')
        serializer = LessonSectionSerializer(sections, many=True, context=self.context)
        return serializer.data

    def get_has_quiz(self, obj):
        return obj.content_type == 'QUIZ'

    def get_content(self, obj):
        if obj.content_type == 'PDF' and obj.pdf_file:
            return obj.pdf_file.url
        return obj.content
class LessonSectionSerializer(serializers.ModelSerializer):
    subsections = serializers.SerializerMethodField()

    class Meta:
        model = LessonSection
        fields = '__all__'
        read_only_fields = ['lesson']  
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