from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Question, Answer, UserAttempt, UserResponse,  Survey, SurveyQuestion, SurveyChoice, SurveyResponse, SurveyAnswer
from .serializers import (
    QuestionSerializer, 
    AnswerSerializer, UserAttemptSerializer,
    QuizSerializer,  SurveySerializer, 
    SurveyResponseSerializer,  SurveyQuestionSerializer 
)
from courses.models import Lesson, Module

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_id = self.kwargs['lesson_pk']
        return Question.objects.filter(lesson_id=lesson_id).order_by('order')

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_pk'])
        serializer.save(lesson=lesson)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({
                'status': 'success',
                'message': 'Question deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        question_id = self.kwargs['question_pk']
        return Answer.objects.filter(question_id=question_id)

    def perform_create(self, serializer):
        question = get_object_or_404(Question, pk=self.kwargs['question_pk'])
        serializer.save(question=question)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({
                'status': 'success', 
                'message': 'Answer deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
class QuizView(generics.GenericAPIView):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lesson_id = self.kwargs['lesson_pk']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        questions = Question.objects.filter(lesson=lesson).prefetch_related('answers')
        return Response({
            'lesson': {
                'id': str(lesson.id),
                'title': lesson.title
            },
            'questions': QuestionSerializer(questions, many=True).data
        })

    def post(self, request, *args, **kwargs):
        lesson_id = self.kwargs['lesson_pk']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        user = request.user
        
        # Get the nested answers data correctly
        answers_data = request.data.get('answers', {})
        answers = answers_data.get('answers', {})  # Get the actual answers dictionary
        
        questions = Question.objects.filter(lesson=lesson).prefetch_related('answers')
        
        total_questions = questions.count()
        correct_answers = 0
        
        # Create attempt record
        attempt = UserAttempt.objects.create(
            user=user,
            lesson=lesson,
            max_score=total_questions,
            attempt_date=timezone.now()
        )
        
        # Check each answer
        for question in questions:
            user_answer = answers.get(str(question.id))
            correct = False
            
            if question.question_type == 'MCQ':
                # For MCQ, check if selected answer is correct
                try:
                    selected_answer = question.answers.get(id=user_answer)
                    correct = selected_answer.is_correct
                    if correct:
                        correct_answers += 1
                    UserResponse.objects.create(
                        attempt=attempt,
                        question=question,
                        selected_answer=selected_answer,
                        is_correct=correct
                    )
                except (Answer.DoesNotExist, ValueError):
                    pass
            elif question.question_type == 'TF':
                # For True/False, check if answer matches
                correct_answer = question.answers.filter(is_correct=True).first()
                if correct_answer and str(correct_answer.id) == user_answer:
                    correct = True
                    correct_answers += 1
                UserResponse.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_answer_id=user_answer,
                    is_correct=correct
                )
        
        # Calculate score percentage
        score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score_percentage >= 70  # Assuming 70% is passing
        
        # Update attempt
        attempt.score = score_percentage
        attempt.passed = passed
        attempt.completion_date = timezone.now()
        attempt.save()
        
        return Response({
            'score': score_percentage,
            'passed': passed,
            'correct_answers': correct_answers,
            'total_questions': total_questions
        }, status=status.HTTP_200_OK)

class QuizDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, lesson_pk):
        try:
            lesson = get_object_or_404(Lesson, pk=lesson_pk)
            Question.objects.filter(lesson=lesson).delete()
            return Response({
                'status': 'success',
                'message': 'Quiz deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ModuleSurveyViewSet(viewsets.ModelViewSet):
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        module_id = self.kwargs.get('module_id')
        return Survey.objects.filter(module_id=module_id)

    def perform_create(self, serializer):
        module_id = self.kwargs.get('module_id')
        module = get_object_or_404(Module, pk=module_id)
        serializer.save(module=module)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None, course_id=None, module_id=None):
        survey = self.get_object()
        questions = survey.questions.all()
        serializer = SurveyQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None, course_id=None, module_id=None):
        survey = self.get_object()
        responses = survey.responses.all().prefetch_related('answers')
        
        # Add pagination if needed
        page = self.paginate_queryset(responses)
        if page is not None:
            serializer = SurveyResponseSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)

class SurveyQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = SurveyQuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        survey_id = self.kwargs['survey_pk']
        return SurveyQuestion.objects.filter(survey_id=survey_id).order_by('order').prefetch_related('choices')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'status': 'success',
            'message': 'Survey questions retrieved successfully',
            'data': serializer.data,
            'count': queryset.count()
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'status': 'success',
            'message': 'Survey question retrieved successfully',
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({
                'status': 'success',
                'message': 'Survey question created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'status': 'error',
            'message': 'Survey question creation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response({
                'status': 'success',
                'message': 'Survey question updated successfully',
                'data': serializer.data
            })
        return Response({
            'status': 'error',
            'message': 'Survey question update failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'status': 'success',
            'message': 'Survey question deleted successfully',
            'data': {'id': str(instance.id)}
        }, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        survey = get_object_or_404(Survey, pk=self.kwargs['survey_pk'])
        serializer.save(survey=survey)
class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get', 'post'])
    def questions(self, request, pk=None):
        survey = self.get_object()
        if request.method == 'POST':
            serializer = SurveyQuestionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(survey=survey)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            questions = survey.questions.all().prefetch_related('choices')
            serializer = SurveyQuestionSerializer(questions, many=True)
            return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        survey = self.get_object()
        responses = survey.responses.all().prefetch_related('answers', 'user')
        
        # Add pagination
        page = self.paginate_queryset(responses)
        if page is not None:
            serializer = SurveyResponseSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response({
            'status': 'success',
            'count': responses.count(),
            'data': serializer.data
        })

class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        # Start with the base queryset
        queryset = SurveyResponse.objects.all()
        
        # For ADMIN or CONTENT_MANAGER, return all responses with related objects
        if self.request.user.role in ['ADMIN', 'CONTENT_MANAGER']:
            return queryset.select_related(
                'user',
                'survey',
                'survey__module'
            ).prefetch_related(
                'answers',
                'answers__question',
                'answers__choice_answer'
            )
        
        # For LEARNERs, return only their own responses with related objects
        return queryset.filter(
            user=self.request.user
        ).select_related(
            'survey',
            'survey__module'
        ).prefetch_related(
            'answers',
            'answers__question',
            'answers__choice_answer'
        )

class UserAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAttempt.objects.filter(
            user=self.request.user
        ).select_related(
            'lesson__module__course'
        ).order_by('-attempt_date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        # Convert to dictionary format if needed
        data = {
            str(idx): item for idx, item in enumerate(serializer.data, start=1)
        }
        
        return Response({
            'status': 'success',
            'data': data,
            'count': len(data)
        })

class UserAttemptsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = UserAttempt.objects.filter(
            user=request.user
        ).select_related(
            'lesson__module__course'
        ).order_by('-attempt_date')

        # Format the data to match what frontend expects
        attempts_data = {}
        for idx, attempt in enumerate(attempts, start=1):
            attempts_data[str(idx)] = {
                'id': str(attempt.id),
                'score': {
                    'source': str(attempt.score),
                    'parsedValue': attempt.score if isinstance(attempt.score, (int, float)) 
                                  else attempt.score.get('parsedValue', 0)
                },
                'passed': attempt.passed,
                'attempt_date': attempt.attempt_date.isoformat(),
                'lesson': {
                    'title': attempt.lesson.title if attempt.lesson else 'N/A',
                    'module': {
                        'title': attempt.lesson.module.title if attempt.lesson and attempt.lesson.module else 'N/A',
                        'course': {
                            'title': attempt.lesson.module.course.title if attempt.lesson and attempt.lesson.module and attempt.lesson.module.course else 'N/A'
                        }
                    }
                }
            }

        return Response({
            'status': 'success',
            'data': attempts_data,
            'count': len(attempts_data)
        })