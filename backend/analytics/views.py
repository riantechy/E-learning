from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from users.models import User
from courses.models import Course, Enrollment, UserProgress
from assessments.models import UserAttempt
from .models import UserActivity
from .serializers import (
    UserActivitySerializer,
    CourseProgressSerializer,
    EnrollmentStatsSerializer,
    TopCourseSerializer,
    CompletionRateSerializer,
    QuizPerformanceSerializer,
    UserProgressSerializer
)
import pandas as pd
from io import BytesIO
from django.http import HttpResponse

class UserActivityAnalyticsView(APIView):
    def get(self, request):
        time_filter = request.query_params.get('time_filter', '7d')
        
        # Calculate time range
        now = timezone.now()
        if time_filter == '24h':
            start_date = now - timedelta(hours=24)
        elif time_filter == '7d':
            start_date = now - timedelta(days=7)
        elif time_filter == '30d':
            start_date = now - timedelta(days=30)
        else:  # all time
            start_date = None
        
        # Build query
        query = UserActivity.objects.all()
        if start_date:
            query = query.filter(timestamp__gte=start_date)
        
        # Get activity counts by type
        activity_counts = query.values('activity_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Get active users
        active_users = query.values('user').distinct().count()
        
        # Get popular courses
        popular_courses = query.filter(course__isnull=False).values(
            'course__title'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        serializer = UserActivitySerializer(query, many=True)
        
        return Response({
            'activity_counts': list(activity_counts),
            'active_users': active_users,
            'popular_courses': list(popular_courses),
            'time_period': {
                'start': start_date,
                'end': now
            }
        })

class CourseProgressAnalyticsView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        
        if course_id:
            # Get progress for a specific course
            course = Course.objects.get(id=course_id)
            enrollments = Enrollment.objects.filter(course=course)
            total_enrollments = enrollments.count()
            
            progress_data = []
            for enrollment in enrollments:
                progress = UserProgress.get_course_progress(enrollment.user, course)
                progress_data.append({
                    'user_id': enrollment.user.id,
                    'user_email': enrollment.user.email,
                    'progress': progress['percentage'],
                    'completed_lessons': progress['completed'],
                    'total_lessons': progress['total']
                })
            
            avg_progress = sum(p['progress'] for p in progress_data) / total_enrollments if total_enrollments > 0 else 0
            
            serializer = UserProgressSerializer(progress_data, many=True)
            course_serializer = CourseProgressSerializer({
                'course_id': course_id,
                'course_title': course.title,
                'total_enrollments': total_enrollments,
                'average_progress': round(avg_progress, 2),
                'progress_data': serializer.data
            })
            
            return Response(course_serializer.data)
        else:
            # Get progress for all courses
            courses = Course.objects.filter(status='PUBLISHED')
            course_progress = []
            
            for course in courses:
                enrollments = Enrollment.objects.filter(course=course)
                total_enrollments = enrollments.count()
                
                if total_enrollments == 0:
                    avg_progress = 0
                else:
                    total_progress = 0
                    for enrollment in enrollments:
                        progress = UserProgress.get_course_progress(enrollment.user, course)
                        total_progress += progress['percentage']
                    avg_progress = total_progress / total_enrollments
                
                course_progress.append({
                    'course_id': course.id,
                    'course_title': course.title,
                    'total_enrollments': total_enrollments,
                    'average_progress': round(avg_progress, 2)
                })
            
            serializer = CourseProgressSerializer(course_progress, many=True)
            return Response({
                'course_progress': serializer.data
            })

class EnrollmentAnalyticsView(APIView):
    def get(self, request):
        time_range = request.query_params.get('time_range', 'monthly')
        
        now = timezone.now()
        enrollments = Enrollment.objects.all()
        
        if time_range == 'daily':
            # Last 30 days
            data = []
            for i in range(30, -1, -1):
                date = now - timedelta(days=i)
                count = enrollments.filter(
                    enrolled_at__date=date.date()
                ).count()
                data.append({
                    'date': date.date().isoformat(),
                    'count': count
                })
        elif time_range == 'weekly':
            # Last 12 weeks
            data = []
            for i in range(12, -1, -1):
                week_start = now - timedelta(weeks=i)
                week_end = week_start + timedelta(weeks=1)
                count = enrollments.filter(
                    enrolled_at__gte=week_start,
                    enrolled_at__lt=week_end
                ).count()
                data.append({
                    'week': week_start.isocalendar()[1],
                    'year': week_start.year,
                    'count': count
                })
        else:  # monthly
            # Last 12 months
            data = []
            for i in range(12, -1, -1):
                month_start = now.replace(day=1) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1)
                count = enrollments.filter(
                    enrolled_at__gte=month_start,
                    enrolled_at__lt=month_end
                ).count()
                data.append({
                    'month': month_start.month,
                    'year': month_start.year,
                    'count': count
                })
        
        # Top courses by enrollment
        top_courses = Course.objects.annotate(
            enrollment_count=Count('enrollment')
        ).order_by('-enrollment_count')[:5]
        
        enrollment_serializer = EnrollmentStatsSerializer(data, many=True)
        top_courses_serializer = TopCourseSerializer(top_courses, many=True)
        
        return Response({
            'enrollment_trend': enrollment_serializer.data,
            'top_courses': top_courses_serializer.data,
            'total_enrollments': enrollments.count()
        })

class CompletionRateAnalyticsView(APIView):
    def get(self, request):
        courses = Course.objects.filter(status='PUBLISHED')
        completion_data = []
        
        for course in courses:
            total_enrollments = Enrollment.objects.filter(course=course).count()
            if total_enrollments == 0:
                completion_rate = 0
            else:
                completed_enrollments = 0
                for enrollment in Enrollment.objects.filter(course=course):
                    progress = UserProgress.get_course_progress(enrollment.user, course)
                    if progress['percentage'] >= 90:  # Consider 90%+ as completed
                        completed_enrollments += 1
                completion_rate = (completed_enrollments / total_enrollments) * 100
            
            completion_data.append({
                'course_id': course.id,
                'course_title': course.title,
                'completion_rate': round(completion_rate, 2),
                'total_enrollments': total_enrollments,
                'completed_enrollments': completed_enrollments
            })
        
        # Sort by completion rate descending
        completion_data.sort(key=lambda x: x['completion_rate'], reverse=True)
        
        # Overall completion rate
        total_enrollments_all = sum(item['total_enrollments'] for item in completion_data)
        completed_enrollments_all = sum(item['completed_enrollments'] for item in completion_data)
        overall_completion_rate = (completed_enrollments_all / total_enrollments_all) * 100 if total_enrollments_all > 0 else 0
        
        serializer = CompletionRateSerializer(completion_data, many=True)
        
        return Response({
            'completion_data': serializer.data,
            'overall_completion_rate': round(overall_completion_rate, 2),
            'total_enrollments': total_enrollments_all,
            'completed_enrollments': completed_enrollments_all
        })

class QuizPerformanceAnalyticsView(APIView):
    def get(self, request):
        from assessments.models import UserAttempt
        
        course_id = request.query_params.get('course_id')
        
        if course_id:
            # Get quiz attempts for a specific course
            attempts = UserAttempt.objects.filter(lesson__module__course_id=course_id)
        else:
            # Get all quiz attempts
            attempts = UserAttempt.objects.all()
        
        # Calculate average scores
        avg_score = attempts.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        pass_rate = attempts.filter(passed=True).count() / attempts.count() * 100 if attempts.count() > 0 else 0
        
        # Group by lesson
        lesson_stats = attempts.values(
            'lesson__title',
            'lesson__module__course__title'
        ).annotate(
            avg_score=Avg('score'),
            pass_rate=Count('id', filter=Q(passed=True)) * 100.0 / Count('id'),
            attempt_count=Count('id')
        ).order_by('-avg_score')
        
        serializer = QuizPerformanceSerializer(attempts, many=True)
        
        return Response({
            'average_score': round(avg_score, 2),
            'pass_rate': round(pass_rate, 2),
            'total_attempts': attempts.count(),
            'lesson_stats': list(lesson_stats)
        })

class ExportAnalyticsReportView(APIView):
    def get(self, request):
        report_type = request.query_params.get('type', 'user_activity')
        time_filter = request.query_params.get('time_filter', '7d')
        format = request.query_params.get('format', 'csv')
        
        # Calculate time range
        now = timezone.now()
        if time_filter == '24h':
            start_date = now - timedelta(hours=24)
        elif time_filter == '7d':
            start_date = now - timedelta(days=7)
        elif time_filter == '30d':
            start_date = now - timedelta(days=30)
        else:  # all time
            start_date = None
        
        if report_type == 'user_activity':
            query = UserActivity.objects.all()
            if start_date:
                query = query.filter(timestamp__gte=start_date)
            
            serializer = UserActivitySerializer(query, many=True)
            df = pd.DataFrame(serializer.data)
            
        elif report_type == 'course_progress':
            courses = Course.objects.filter(status='PUBLISHED')
            data = []
            
            for course in courses:
                enrollments = Enrollment.objects.filter(course=course)
                total_enrollments = enrollments.count()
                
                if total_enrollments == 0:
                    avg_progress = 0
                    completed = 0
                else:
                    total_progress = 0
                    completed = 0
                    for enrollment in enrollments:
                        progress = UserProgress.get_course_progress(enrollment.user, course)
                        total_progress += progress['percentage']
                        if progress['percentage'] >= 90:
                            completed += 1
                    avg_progress = total_progress / total_enrollments
                
                data.append({
                    'Course ID': str(course.id),
                    'Course Title': course.title,
                    'Total Enrollments': total_enrollments,
                    'Average Progress (%)': round(avg_progress, 2),
                    'Completed Enrollments': completed,
                    'Completion Rate (%)': round((completed / total_enrollments) * 100, 2) if total_enrollments > 0 else 0
                })
            
            df = pd.DataFrame(data)
        
        elif report_type == 'enrollment_stats':
            enrollments = Enrollment.objects.all()
            if start_date:
                enrollments = enrollments.filter(enrolled_at__gte=start_date)
            
            data = list(enrollments.values(
                'user__email',
                'course__title',
                'enrolled_at'
            ))
            
            df = pd.DataFrame(data)
            df.columns = ['User Email', 'Course', 'Enrollment Date']
        
        # Export to requested format
        if format == 'excel':
            output = BytesIO()
            writer = pd.ExcelWriter(output, engine='xlsxwriter')
            df.to_excel(writer, sheet_name='Report', index=False)
            writer.close()
            output.seek(0)
            
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename={report_type}_report.xlsx'
            return response
        else:  # CSV
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename={report_type}_report.csv'
            df.to_csv(response, index=False)
            return response