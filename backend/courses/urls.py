from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Course endpoints
router.register(r'categories', views.CourseCategoryViewSet)
router.register(r'', views.CourseViewSet) 

# Nested endpoints
router.register(r'(?P<course_pk>[^/.]+)/modules', views.ModuleViewSet, basename='module')
router.register(r'(?P<course_pk>[^/.]+)/modules/(?P<module_pk>[^/.]+)/lessons', views.LessonViewSet, basename='lesson')

# User progress endpoints
router.register(r'user/progress', views.UserProgressViewSet, basename='userprogress')
# urls.py
router.register(
    r'(?P<course_pk>[^/.]+)/modules/(?P<module_pk>[^/.]+)/lessons/(?P<lesson_pk>[^/.]+)/sections',
    views.LessonSectionViewSet,
    basename='lessonsection'
)

urlpatterns = [
    path('', include(router.urls)),
    
    # Updated paths (removed 'courses/' prefix)
    path('approve/<uuid:pk>/', views.CourseViewSet.as_view({'post': 'approve'}), name='course-approve'),
    path('reject/<uuid:pk>/', views.CourseViewSet.as_view({'post': 'reject'}), name='course-reject'),
    path('publish/<uuid:pk>/', views.CourseViewSet.as_view({'post': 'publish'}), name='course-publish'),
    
    # path('user/progress/course/', 
    #     views.UserProgressViewSet.as_view({'get': 'course_progress'}), 
    #     name='user-course-progress'),
    # path('<uuid:course_id>/', 
    #     views.CourseViewSet.as_view({'get': 'progress'}), 
    #     name='course-progress'),

    path('user/progress/', 
        views.UserProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
        name='user-progress'),
    path('user/progress/lesson/<uuid:lesson_id>/', 
        views.UserProgressViewSet.as_view({'get': 'retrieve', 'put': 'update'}), 
        name='lesson-progress'),
    path('user/progress/course/<uuid:course_id>/', 
        views.UserProgressViewSet.as_view({'get': 'course_progress'}), 
        name='course-progress'),
    path('user/progress/toggle/', 
        views.UserProgressViewSet.as_view({'post': 'toggle_lesson_completion'}), 
        name='toggle-lesson-completion'),

    path('enrollments/total/', 
        views.CourseViewSet.as_view({'get': 'total_enrollments'}), 
        name='total-enrollments'),
    path('<uuid:pk>/enrollments/', 
        views.CourseViewSet.as_view({'get': 'enrollment_count'}), 
        name='course-enrollments'),
     path('user/enrollments/', 
        views.CourseViewSet.as_view({'get': 'user_enrollments'}), 
        name='user-enrollments'),
    path('<uuid:pk>/progress/', 
        views.CourseViewSet.as_view({'get': 'progress'}), 
        name='course-progress'),
]