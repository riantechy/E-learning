from rest_framework import serializers
from .models import Question, Answer, UserAttempt, UserResponse

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'

class UserAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAttempt
        fields = '__all__'
        read_only_fields = ('user', 'score', 'passed', 'attempt_date', 'completion_date')

class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserResponse
        fields = '__all__'
        read_only_fields = ('is_correct',)

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'   