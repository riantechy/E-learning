from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Question, Answer
from .serializers import (
    QuestionSerializer, 
    AnswerSerializer,
    QuizSerializer
)
from courses.models import Lesson

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_id = self.kwargs['lesson_pk']
        return Question.objects.filter(lesson_id=lesson_id).order_by('order')

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_pk'])
        serializer.save(lesson=lesson)

class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        question_id = self.kwargs['question_pk']
        return Answer.objects.filter(question_id=question_id)

    def perform_create(self, serializer):
        question = get_object_or_404(Question, pk=self.kwargs['question_pk'])
        serializer.save(question=question)

class QuizView(generics.RetrieveAPIView):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        lesson_id = self.kwargs['lesson_pk']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        questions = Question.objects.filter(lesson=lesson).prefetch_related('answers')
        return {
            'lesson': lesson,
            'questions': questions
        }