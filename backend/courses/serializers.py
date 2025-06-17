from rest_framework import serializers
from .models import CourseCategory, Course, Module, Lesson, UserProgress, Enrollment, LessonSection
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

class LessonSectionSerializer(serializers.ModelSerializer):
    subsections = serializers.SerializerMethodField()

    class Meta:
        model = LessonSection
        fields = '__all__'
    
    def get_subsections(self, obj):
        # Get the current depth from context or default to 0
        current_depth = self.context.get('current_depth', 0)
        max_depth = self.context.get('max_depth', 2)  # Limit recursion depth to 2 levels
        
        if current_depth >= max_depth:
            return []
            
        # Get immediate children only
        subsections = obj.subsections.all().order_by('order')
        serializer = LessonSectionSerializer(
            subsections, 
            many=True,
            context={
                **self.context,
                'current_depth': current_depth + 1  
            }
        )
        return serializer.data

class LessonSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = '__all__'
    
    def get_sections(self, obj):
        sections = obj.sections.filter(parent_section__isnull=True).order_by('order')
        serializer = LessonSectionSerializer(
            sections,
            many=True,
            context=self.context  # Pass along the context
        )
        return serializer.data

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