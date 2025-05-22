# assessments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'lessons/(?P<lesson_pk>[^/.]+)/questions', views.QuestionViewSet, basename='question')
router.register(r'questions/(?P<question_pk>[^/.]+)/answers', views.AnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
    path('lessons/<uuid:lesson_pk>/quiz/', views.QuizView.as_view(), name='lesson-quiz'),
]