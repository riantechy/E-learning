from django.urls import path
from . import views

urlpatterns = [
    path('user-activity/', views.UserActivityAnalyticsView.as_view(), name='user-activity-analytics'),
    path('course-progress/', views.CourseProgressAnalyticsView.as_view(), name='course-progress-analytics'),
    path('enrollment-stats/', views.EnrollmentAnalyticsView.as_view(), name='enrollment-analytics'),
    path('completion-rates/', views.CompletionRateAnalyticsView.as_view(), name='completion-rate-analytics'),
    path('quiz-performance/', views.QuizPerformanceAnalyticsView.as_view(), name='quiz-performance-analytics'),
    path('export-report/', views.ExportAnalyticsReportView.as_view(), name='export-analytics-report'),
    path('module-coverage/<uuid:course_id>/', views.ModuleCoverageAnalyticsView.as_view(), name='module-coverage-analytics'),
]