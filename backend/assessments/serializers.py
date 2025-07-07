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

# serializers.py
class SurveyQuestionSerializer(serializers.ModelSerializer):
    choices = SurveyChoiceSerializer(many=True, required=False)  # Allow nested writes

    class Meta:
        model = SurveyQuestion
        fields = ['id', 'question_text', 'question_type', 'is_required', 'order', 'choices']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])  # Extract choices
        question = SurveyQuestion.objects.create(**validated_data)
        
        # Create choices for MCQ questions
        if question.question_type == 'MCQ':
            for choice_data in choices_data:
                SurveyChoice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', [])
        instance = super().update(instance, validated_data)
        
        # Clear existing choices and recreate (or use more efficient diffing)
        if instance.question_type == 'MCQ':
            instance.choices.all().delete()  # Delete old choices
            for choice_data in choices_data:
                SurveyChoice.objects.create(question=instance, **choice_data)
        return instance
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

    def create(self, validated_data):
        # Extract the nested answers data
        answers_data = validated_data.pop('answers', [])
        
        # Create the SurveyResponse instance
        response = SurveyResponse.objects.create(**validated_data)
        
        # Create each SurveyAnswer instance
        for answer_data in answers_data:
            SurveyAnswer.objects.create(response=response, **answer_data)
        
        return response