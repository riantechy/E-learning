from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from users.models import User
from courses.models import Course, Enrollment, UserProgress, Module, ModuleProgress, Lesson 
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
print("Imports successful: pandas, xlsxwriter, and models loaded")

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
        
        # Get active users (distinct users with any activity)
        active_users = query.values('user').distinct().count()
        
        # Get popular courses (top 5 by activity count)
        popular_courses = query.filter(course__isnull=False).values(
            'course__id',
            'course__title'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'activity_counts': list(activity_counts),
            'active_users': active_users or 0,
            'popular_courses': list(popular_courses),
            'time_period': {
                'start': start_date.isoformat() if start_date else None,
                'end': now.isoformat()
            }
        })

class CourseProgressAnalyticsView(APIView):
    def get(self, request):
        course_id = request.query_params.get('course_id')
        
        if course_id:
            # Get progress for a specific course
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
            
            enrollments_count = Enrollment.objects.filter(course=course).count()
            if enrollments_count == 0:
                return Response({
                    'course_id': str(course_id),
                    'course_title': course.title,
                    'total_enrollments': 0,
                    'average_progress': 0,
                    'progress_data': []
                })
            
            # Get total lessons once
            total_lessons = Lesson.objects.filter(module__course=course).count()
            if total_lessons == 0:
                return Response({
                    'course_id': str(course_id),
                    'course_title': course.title,
                    'total_enrollments': enrollments_count,
                    'average_progress': 0,
                    'progress_data': []
                })
            
            # Aggregated query for all users' completed lessons
            user_completed = UserProgress.objects.filter(
                lesson__module__course=course,
                is_completed=True
            ).values('user__id', 'user__email').annotate(
                completed_lessons=Count('lesson', distinct=True)
            )
            
            progress_data = []
            total_completed_all = 0
            for item in user_completed:
                completed = item['completed_lessons']
                percentage = round((completed / total_lessons * 100), 2) if total_lessons > 0 else 0
                progress_data.append({
                    'user_id': item['user__id'],
                    'user_email': item['user__email'],
                    'progress': percentage,
                    'completed_lessons': completed,
                    'total_lessons': total_lessons
                })
                total_completed_all += completed
            
            avg_progress = round((total_completed_all / (enrollments_count * total_lessons)) * 100, 2) if total_lessons > 0 else 0
            
            serializer = UserProgressSerializer(progress_data, many=True)
            return Response({
                'course_id': str(course_id),
                'course_title': course.title,
                'total_enrollments': enrollments_count,
                'average_progress': avg_progress,
                'progress_data': serializer.data
            })
        else:
            # Get progress for all courses
            courses = Course.objects.filter(status='PUBLISHED')
            course_progress = []
            
            for course in courses:
                enrollments_count = Enrollment.objects.filter(course=course).count()
                if enrollments_count == 0:
                    course_progress.append({
                        'course_id': str(course.id),
                        'course_title': course.title,
                        'total_enrollments': 0,
                        'average_progress': 0
                    })
                    continue
                
                total_lessons = Lesson.objects.filter(module__course=course).count()
                if total_lessons == 0:
                    course_progress.append({
                        'course_id': str(course.id),
                        'course_title': course.title,
                        'total_enrollments': enrollments_count,
                        'average_progress': 0
                    })
                    continue
                
                # Aggregated total completed lessons across all users
                total_completed = UserProgress.objects.filter(
                    lesson__module__course=course,
                    is_completed=True
                ).count()
                
                avg_progress = round((total_completed / (enrollments_count * total_lessons)) * 100, 2) if total_lessons > 0 else 0
                
                course_progress.append({
                    'course_id': str(course.id),
                    'course_title': course.title,
                    'total_enrollments': enrollments_count,
                    'average_progress': avg_progress
                })
            
            serializer = CourseProgressSerializer(course_progress, many=True)
            return Response({'course_progress': serializer.data})
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
        total_enrollments_all = 0
        total_completions_all = 0
        
        for course in courses:
            enrollments_count = Enrollment.objects.filter(course=course).count()
            total_enrollments_all += enrollments_count
            
            if enrollments_count == 0:
                completion_data.append({
                    'course_id': str(course.id),
                    'course_title': course.title,
                    'total_enrollments': 0,
                    'completion_rate': 0.0,
                    'completed_enrollments': 0
                })
                continue
            
            total_lessons = Lesson.objects.filter(module__course=course).count()
            if total_lessons == 0:
                completion_data.append({
                    'course_id': str(course.id),
                    'course_title': course.title,
                    'total_enrollments': enrollments_count,
                    'completion_rate': 0.0,
                    'completed_enrollments': 0
                })
                continue
            
            # Aggregated query for users who completed all lessons (100%)
            user_completed = UserProgress.objects.filter(
                lesson__module__course=course,
                is_completed=True
            ).values('user__id').annotate(
                completed_count=Count('lesson', distinct=True)
            ).filter(
                completed_count=total_lessons
            )
            
            completed_enrollments = user_completed.count()
            total_completions_all += completed_enrollments
            
            try:
                completion_rate = round((completed_enrollments / enrollments_count) * 100, 2) if enrollments_count > 0 else 0.0
            except (ZeroDivisionError, TypeError):
                completion_rate = 0.0
            
            completion_data.append({
                'course_id': str(course.id),
                'course_title': course.title,
                'total_enrollments': enrollments_count,
                'completion_rate': completion_rate,
                'completed_enrollments': completed_enrollments
            })
        
        try:
            overall_rate = round((total_completions_all / total_enrollments_all) * 100, 2) if total_enrollments_all > 0 else 0.0
        except (ZeroDivisionError, TypeError):
            overall_rate = 0.0
        
        return Response({
            'overall_completion_rate': overall_rate,
            'total_enrollments': total_enrollments_all,
            'completed_enrollments': total_completions_all,
            'completion_rates': CompletionRateSerializer(completion_data, many=True).data
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
        print("Export view accessed!")
        report_type = request.query_params.get('type', 'user_activity')
        time_filter = request.query_params.get('time_filter', '7d')
        export_format = request.query_params.get('format', 'csv')
        print(f"Export endpoint hit: type={report_type}, time_filter={time_filter}, format={export_format}")  # Debug

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

        try:
            if report_type == 'user_activity':
                query = UserActivity.objects.all()
                if start_date:
                    query = query.filter(timestamp__gte=start_date)

                data = list(query.values(
                    'user__email',
                    'activity_type',
                    'timestamp',
                    'course__title',
                    'ip_address'
                ))
                df = pd.DataFrame(data)

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

            elif report_type == 'completion_rates':
                courses = Course.objects.filter(status='PUBLISHED')
                data = []

                for course in courses:
                    total_enrollments = Enrollment.objects.filter(course=course).count()
                    if total_enrollments == 0:
                        completion_rate = 0
                        completed_enrollments = 0
                    else:
                        completed_enrollments = 0
                        for enrollment in Enrollment.objects.filter(course=course):
                            progress = UserProgress.get_course_progress(enrollment.user, course)
                            if progress['percentage'] >= 90:
                                completed_enrollments += 1
                        completion_rate = (completed_enrollments / total_enrollments) * 100

                    data.append({
                        'Course ID': str(course.id),
                        'Course Title': course.title,
                        'Total Enrollments': total_enrollments,
                        'Completed Enrollments': completed_enrollments,
                        'Completion Rate (%)': round(completion_rate, 2)
                    })

                df = pd.DataFrame(data)

            elif report_type == 'module_coverage':
                course_id = request.query_params.get('course_id')
                if not course_id:
                    return Response(
                        {"error": "course_id is required for module coverage export"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    course = Course.objects.get(id=course_id)
                except Course.DoesNotExist:
                    return Response(
                        {"error": "Course not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Get module coverage data
                response = ModuleCoverageAnalyticsView().get(request, course_id)
                if response.status_code != 200:
                    return response

                coverage_data = response.data
                rows = []

                for learner in coverage_data['learners']:
                    row = {
                        'Learner ID': learner['user_id'],
                        'Learner Name': learner['name'],
                    }

                    for i, module in enumerate(coverage_data['modules']):
                        row[module] = 'Completed' if learner['module_progress'][i]['completed'] else 'Not Completed'

                    rows.append(row)

                df = pd.DataFrame(rows)  # Fixed: Use 'rows' instead of 'data'

            else:
                return Response(
                    {"error": f"Invalid report type: {report_type}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Export to requested format
            try:
                if export_format == 'csv':
                    response = HttpResponse(content_type='text/csv')
                    response['Content-Disposition'] = f'attachment; filename={report_type}_report.csv'
                    df.to_csv(response, index=False)
                    return response

                elif export_format == 'excel':
                    output = BytesIO()
                    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                        df.to_excel(writer, sheet_name='Report', index=False)
                    output.seek(0)

                    response = HttpResponse(
                        output.getvalue(),
                        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )
                    response['Content-Disposition'] = f'attachment; filename={report_type}_report.xlsx'
                    return response

                else:
                    return Response(
                        {"error": "Invalid format. Use 'csv' or 'excel'."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except Exception as e:
                return Response(
                    {"error": f"Export failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {"error": f"Data processing failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ModuleCoverageAnalyticsView(APIView):
    def get(self, request, course_id=None):
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all modules
        modules = Module.objects.filter(course=course).order_by('order')
        module_names = [module.title for module in modules]
        module_ids = [str(module.id) for module in modules]  # Use str for consistency
        
        # Get all enrolled users
        enrolled_users = Enrollment.objects.filter(course=course).values('user__id', 'user__first_name', 'user__last_name')
        
        # Bulk fetch all relevant ModuleProgress
        progress_qs = ModuleProgress.objects.filter(
            module__course=course
        ).select_related('user', 'module').values(
            'user__id', 'module__id', 'is_completed', 'completed_at'
        )
        
        # Build lookup dict: {user_id: {module_id: {'completed': bool, 'completed_at': dt}}}
        user_progress_dict = {}
        for prog in progress_qs:
            user_id = prog['user__id']
            module_id = prog['module__id']
            if user_id not in user_progress_dict:
                user_progress_dict[user_id] = {}
            user_progress_dict[user_id][str(module_id)] = {  # str for key
                'completed': prog['is_completed'],
                'completed_at': prog['completed_at']
            }
        
        # Build response data
        data = {
            "course_id": str(course.id),
            "course_title": course.title,
            "modules": module_names,
            "learners": []
        }
        
        for enrollment in enrolled_users:
            user_id = enrollment['user__id']
            user_progress = user_progress_dict.get(user_id, {})
            
            module_progress_list = []
            for module_id in module_ids:
                prog = user_progress.get(module_id, {'completed': False, 'completed_at': None})
                module_progress_list.append({
                    "module_id": module_id,
                    "completed": prog['completed'],
                    "completed_at": prog['completed_at']
                })
            
            data["learners"].append({
                "user_id": str(user_id),
                "name": f"{enrollment['user__first_name']} {enrollment['user__last_name']}",
                "module_progress": module_progress_list
            })
        
        return Response(data)