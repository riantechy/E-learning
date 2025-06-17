from rest_framework import serializers
from users.models import User
from courses.models import Course, Enrollment, UserProgress
from .models import UserActivity
from assessments.models import UserAttempt

class UserActivitySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user_email', 'activity_type', 
            'course_title', 'timestamp', 'ip_address'
        ]

class CourseProgressSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    total_enrollments = serializers.IntegerField()
    average_progress = serializers.FloatField()
    completed_enrollments = serializers.IntegerField(required=False)
    
    def to_representation(self, instance):
        if isinstance(instance, dict):
            return instance
        return super().to_representation(instance)

class EnrollmentStatsSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    week = serializers.IntegerField(required=False)
    year = serializers.IntegerField(required=False)
    month = serializers.IntegerField(required=False)
    count = serializers.IntegerField()

class TopCourseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    enrollment_count = serializers.IntegerField()

class CompletionRateSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    completion_rate = serializers.FloatField()
    total_enrollments = serializers.IntegerField()
    completed_enrollments = serializers.IntegerField()

class QuizPerformanceSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title')
    course_title = serializers.CharField(source='lesson.module.course.title')
    
    class Meta:
        model = UserAttempt
        fields = [
            'lesson_title', 'course_title', 'score', 
            'passed', 'created_at'
        ]

class UserProgressSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_email = serializers.CharField()
    progress = serializers.FloatField()
    completed_lessons = serializers.IntegerField()
    total_lessons = serializers.IntegerField()