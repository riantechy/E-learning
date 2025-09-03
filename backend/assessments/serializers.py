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
    lesson = serializers.SerializerMethodField()
    score = serializers.FloatField()

    class Meta:
        model = UserAttempt
        fields = ['id', 'score', 'passed', 'attempt_date', 'lesson']

    def get_lesson(self, obj):
        return {
            'title': (obj.lesson.title or 'Unknown') if obj.lesson else 'Unknown',
            'module': {
                'title': (obj.lesson.module.title or 'Unknown') if obj.lesson and obj.lesson.module else 'Unknown',
                'course': {
                    'title': (obj.lesson.module.course.title or 'Unknown') if obj.lesson and obj.lesson.module and obj.lesson.module.course else 'Unknown'
                }
            }
        }


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

    def validate(self, data):
        question_type = data.get('question_type')
        if question_type != 'MCQ':
            data.pop('choices', None)  # Remove choices if present
        return data
# class SurveySerializer(serializers.ModelSerializer):
#     questions = SurveyQuestionSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = Survey
#         fields = ['id', 'module', 'title', 'description', 'is_active', 'questions']

class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    responses_count = serializers.SerializerMethodField()
    module = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ['id', 'module', 'title', 'description', 'is_active', 'questions', 'responses_count']

    def get_responses_count(self, obj):
        return obj.responses.count()

    def get_module(self, obj):
        if not obj.module:
            return None
        return {
            'id': str(obj.module.id),
            'title': obj.module.title,
            'course': {
                'id': str(obj.module.course.id),
                'title': obj.module.course.title
            } if obj.module.course else None
        }

class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = ['question', 'text_answer', 'choice_answer', 'scale_answer']

class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = SurveyAnswerSerializer(many=True)
    user = serializers.SerializerMethodField()
    survey = serializers.SerializerMethodField()
    survey_id = serializers.PrimaryKeyRelatedField(queryset=Survey.objects.all(), write_only=True, source='survey')
    
    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'user', 'submitted_at', 'answers', 'survey_id']
        read_only_fields = ['user', 'submitted_at', 'survey']

    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'email': obj.user.email,
            'name': f"{obj.user.first_name} {obj.user.last_name}"
        }
        
    def get_survey(self, obj):
        return {
            'id': str(obj.survey.id),
            'title': obj.survey.title,
            'module': {
                'id': str(obj.survey.module.id),
                'title': obj.survey.module.title
            }
        }
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        survey = validated_data.pop('survey')
        response = SurveyResponse.objects.create(survey=survey, **validated_data)
        for answer_data in answers_data:
            SurveyAnswer.objects.create(response=response, **answer_data)
        return response
    
    def validate_answers(self, answers):
        for answer in answers:
            question = answer['question']
            if question.question_type == 'MCQ':
                if 'choice_answer' not in answer or answer.get('text_answer') or answer.get('scale_answer'):
                    raise serializers.ValidationError(f"MCQ question '{question.question_text}' requires a choice_answer only.")
            elif question.question_type == 'TEXT':
                if 'text_answer' not in answer or answer.get('choice_answer') or answer.get('scale_answer'):
                    raise serializers.ValidationError(f"Text question '{question.question_text}' requires a text_answer only.")
            elif question.question_type == 'SCALE':
                if 'scale_answer' not in answer or answer.get('text_answer') or answer.get('choice_answer'):
                    raise serializers.ValidationError(f"Scale question '{question.question_text}' requires a scale_answer only.")
                if not (1 <= answer['scale_answer'] <= 5):
                    raise serializers.ValidationError(f"Scale answer for '{question.question_text}' must be between 1 and 5.")
        return answers