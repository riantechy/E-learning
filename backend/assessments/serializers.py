from rest_framework import serializers
from .models import Question, Answer, UserAttempt, UserResponse, Survey, SurveyQuestion, SurveyChoice, SurveyResponse, SurveyAnswer

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

class SurveyChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyChoice
        fields = ['id', 'choice_text', 'order']

class SurveyQuestionSerializer(serializers.ModelSerializer):
    choices = SurveyChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = SurveyQuestion
        fields = ['id', 'question_text', 'question_type', 'is_required', 'order', 'choices']

class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Survey
        fields = ['id', 'module', 'title', 'description', 'is_active', 'questions']

class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = ['question', 'text_answer', 'choice_answer', 'scale_answer']

class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = SurveyAnswerSerializer(many=True)
    
    class Meta:
        model = SurveyResponse
        fields = ['survey', 'user', 'submitted_at', 'answers']
        read_only_fields = ['user', 'submitted_at']