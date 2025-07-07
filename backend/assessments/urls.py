from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'lessons/(?P<lesson_pk>[^/.]+)/questions', views.QuestionViewSet, basename='question')
router.register(r'questions/(?P<question_pk>[^/.]+)/answers', views.AnswerViewSet, basename='answer')
router.register(r'surveys', views.SurveyViewSet, basename='survey')
router.register(
    r'surveys/(?P<survey_pk>[^/.]+)/questions',
    views.SurveyQuestionViewSet,
    basename='survey-questions'
)
router.register(r'survey-responses', views.SurveyResponseViewSet, basename='survey-response')

urlpatterns = [
    path('', include(router.urls)),
    
    # Quiz endpoints
    path('lessons/<uuid:lesson_pk>/quiz/', views.QuizView.as_view(), name='lesson-quiz'),
    path('lessons/<uuid:lesson_pk>/quiz/delete/', views.QuizDeleteView.as_view(), name='delete-quiz'),
    
    # Module survey endpoints
    path(
        '<uuid:course_id>/modules/<uuid:module_id>/survey/',
        views.SurveyViewSet.as_view({
            'get': 'list',
            'post': 'create'
        }),
        name='module-survey-list'
    ),
    path(
        '<uuid:course_id>/modules/<uuid:module_id>/survey/<uuid:pk>/',
        views.SurveyViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='module-survey-detail'
    ),
    path(
        '<uuid:course_id>/modules/<uuid:module_id>/survey/<uuid:pk>/questions/',
        views.SurveyViewSet.as_view({'get': 'questions', 'post': 'questions'}),
        name='module-survey-questions'
    ),
    path(
        '<uuid:course_id>/modules/<uuid:module_id>/survey/<uuid:pk>/responses/',
        views.SurveyViewSet.as_view({'get': 'responses'}),
        name='module-survey-responses'
    ),
    # Add these new endpoints for general survey responses
    path(
        'surveys/<uuid:survey_pk>/responses/',
        views.SurveyViewSet.as_view({'get': 'responses'}),
        name='survey-responses'
    ),
]