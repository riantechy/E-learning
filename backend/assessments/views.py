from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Question, Answer, UserAttempt, UserResponse,  Survey, SurveyQuestion, SurveyChoice, SurveyResponse, SurveyAnswer
from .serializers import (
    QuestionSerializer, UserResponseSerializer,
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
        
        # Get the answers data (handle both flat {answers: {qid: value}} and nested {answers: {answers: {qid: value}}}
        answers_data = request.data.get('answers', {})
        if isinstance(answers_data, dict) and 'answers' in answers_data:
            answers = answers_data['answers']
        else:
            answers = answers_data  # Flat case
        
        questions = Question.objects.filter(lesson=lesson).prefetch_related('answers')
        
        # Calculate max_score as sum of all question points
        max_score = questions.aggregate(total=Sum('points'))['total'] or 0
        
        # Create attempt record
        attempt = UserAttempt.objects.create(
            user=user,
            lesson=lesson,
            score=0,
            max_score=max_score,
            passed=False,
            attempt_date=timezone.now()
        )
        
        total_earned = 0.0
        
        # Process each question
        for question in questions:
            user_answer = answers.get(str(question.id))
            earned = 0.0
            
            if question.question_type == 'MCQ':
                # Get correct answers
                correct_answers_qs = question.answers.filter(is_correct=True)
                correct_answer_ids = set(str(uuid) for uuid in correct_answers_qs.values_list('id', flat=True))  # Fix: Convert UUID to str
                num_correct = correct_answers_qs.count()
                points_per_correct = question.points / num_correct if num_correct > 0 else 0
                
                # Handle selected answers (single str, list, or empty)
                selected_answer_ids = (
                    [user_answer] if isinstance(user_answer, str) and user_answer
                    else user_answer if isinstance(user_answer, list)
                    else []
                )
                selected_answer_ids = set(str(aid) for aid in selected_answer_ids if aid)
                
                # Count correct selections
                correct_selected_count = len(selected_answer_ids.intersection(correct_answer_ids))
                earned = correct_selected_count * points_per_correct
                total_earned += earned
                
                # Create UserResponse for each selected answer
                for answer_id in selected_answer_ids:
                    try:
                        selected_answer = question.answers.get(id=answer_id)
                        UserResponse.objects.create(
                            attempt=attempt,
                            question=question,
                            selected_answer=selected_answer,
                            is_correct=selected_answer.is_correct
                        )
                    except Answer.DoesNotExist:
                        # Invalid selection: create response with is_correct=False
                        UserResponse.objects.create(
                            attempt=attempt,
                            question=question,
                            selected_answer=None,
                            is_correct=False
                        )
                        
            elif question.question_type == 'TF':
                # Assume single correct answer
                try:
                    correct_answer = question.answers.get(is_correct=True)
                    if user_answer and str(correct_answer.id) == str(user_answer):
                        earned = question.points
                        total_earned += earned
                        
                    # Create response
                    selected_answer = question.answers.filter(id=user_answer).first()
                    UserResponse.objects.create(
                        attempt=attempt,
                        question=question,
                        selected_answer=selected_answer,
                        is_correct=bool(selected_answer and selected_answer.is_correct)
                    )
                except Answer.DoesNotExist:
                    # No correct answer defined, or invalid selection
                    UserResponse.objects.create(
                        attempt=attempt,
                        question=question,
                        selected_answer=None,
                        is_correct=False
                    )
                    
            elif question.question_type == 'SA':
                # Short answer: auto 0 points
                text_response = user_answer if user_answer is not None else ''
                UserResponse.objects.create(
                    attempt=attempt,
                    question=question,
                    text_response=text_response,
                    is_correct=False
                )
                # earned remains 0
        
        # Calculate final score
        score_percentage = (total_earned / max_score * 100) if max_score > 0 else 0
        passed = score_percentage >= 70
        
        # Update attempt
        attempt.score = score_percentage
        attempt.max_score = max_score
        attempt.passed = passed
        attempt.completion_date = timezone.now()
        attempt.save()
        
        return Response({
            'attempt_id': str(attempt.id),
            'score': round(score_percentage, 2),
            'earned_points': round(total_earned, 2),
            'max_score': max_score,
            'passed': passed,
            'questions': QuestionSerializer(questions, many=True).data,
            'total_questions': questions.count()
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
    pagination_class = None  # Disable pagination to return direct list

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.kwargs.get('course_id')
        module_id = self.kwargs.get('module_id')
        
        if module_id and course_id:
            # Filter by module and validate course
            queryset = queryset.filter(
                module__id=module_id,
                module__course__id=course_id
            )
        elif module_id:
            queryset = queryset.filter(module__id=module_id)
            
        return queryset.prefetch_related('questions__choices')

    def perform_create(self, serializer):
        course_id = self.kwargs.get('course_id')
        module_id = self.kwargs.get('module_id')
        
        if module_id and course_id:
            module = get_object_or_404(
                Module, 
                id=module_id, 
                course__id=course_id
            )
            if Survey.objects.filter(module=module).exists():
                raise ValidationError("A survey already exists for this module.")
            serializer.save(module=module)
        else:
            serializer.save()

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
        
        # Add pagination if needed, but since pagination_class=None, keep as list
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
            user=self.request.user,
            lesson__isnull=False,
            lesson__module__isnull=False,
            lesson__module__course__isnull=False
        ).select_related(
            'lesson__module__course'
        ).order_by('-attempt_date')

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        attempt = self.get_object()
        responses = attempt.responses.all().select_related('question', 'selected_answer')
        serializer = UserResponseSerializer(responses, many=True)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        data = {}
        for idx, attempt in enumerate(queryset, start=1):
            data[str(idx)] = {
                'id': str(attempt.id),
                'score': round(attempt.score, 2),
                'passed': attempt.passed,
                'attempt_date': attempt.attempt_date.isoformat(),
                'lesson': {
                    'title': (attempt.lesson.title or 'Unknown') if attempt.lesson else 'Unknown',
                    'module': {
                        'title': (attempt.lesson.module.title or 'Unknown') if attempt.lesson and attempt.lesson.module else 'Unknown',
                        'course': {
                            'title': (attempt.lesson.module.course.title or 'Unknown') if attempt.lesson and attempt.lesson.module and attempt.lesson.module.course else 'Unknown'
                        }
                    }
                }
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
            user=request.user,
            lesson__isnull=False,
            lesson__module__isnull=False,
            lesson__module__course__isnull=False
        ).select_related(
            'lesson__module__course'
        ).order_by('-attempt_date')

        attempts_data = {}
        for idx, attempt in enumerate(attempts, start=1):
            attempts_data[str(idx)] = {
                'id': str(attempt.id),
                'score': round(attempt.score, 2),  
                'passed': attempt.passed,
                'attempt_date': attempt.attempt_date.isoformat(),
                'lesson': {
                    'title': (attempt.lesson.title or 'Unknown') if attempt.lesson else 'Unknown',
                    'module': {
                        'title': (attempt.lesson.module.title or 'Unknown') if attempt.lesson and attempt.lesson.module else 'Unknown',
                        'course': {
                            'title': (attempt.lesson.module.course.title or 'Unknown') if attempt.lesson and attempt.lesson.module and attempt.lesson.module.course else 'Unknown'
                        }
                    }
                }
            }

        return Response({
            'status': 'success',
            'data': attempts_data,
            'count': len(attempts_data)
        })

class QuizResultsView(generics.RetrieveAPIView):
    serializer_class = UserAttemptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAttempt.objects.filter(user=self.request.user)
    
    def get_object(self):
        attempt_id = self.kwargs['attempt_id']
        return get_object_or_404(UserAttempt, id=attempt_id, user=self.request.user)