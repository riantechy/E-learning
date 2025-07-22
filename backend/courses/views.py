from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CourseCategory, Course, Module, Lesson, UserProgress, Enrollment, LessonSection, ModuleProgress
from .serializers import (
    CourseCategorySerializer, CourseSerializer, 
    ModuleSerializer, LessonSerializer, LessonSectionSerializer,
    UserProgressSerializer, ModuleProgressSerializer
)
from users.models import User


class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]  


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]  

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        course = self.get_object()
        if course.approve(request.user):
            return Response({'status': 'course approved'})
        return Response({'status': 'course not in pending state'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        course = self.get_object()
        reason = request.data.get('reason', '')
        if course.reject(request.user, reason):
            return Response({'status': 'course rejected'})
        return Response({'status': 'course not in pending state'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def publish(self, request, pk=None):
        course = self.get_object()
        course.publish()
        return Response({'status': 'course published'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(user=request.user, course=course)
        if created:
            return Response({'success': True})
        return Response({'success': False, 'message': 'Already enrolled'}, status=400)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def enrollment(self, request, pk=None):
        course = self.get_object()
        enrolled = Enrollment.objects.filter(user=request.user, course=course).exists()
        return Response({'enrolled': enrolled})

    @action(detail=False, methods=['get'])
    def total_enrollments(self, request):
        """Get total number of enrollments across all courses"""
        count = Enrollment.objects.count()
        return Response({'total_enrollments': count})
    
    @action(detail=True, methods=['get'])
    def enrollment_count(self, request, pk=None):
        """Get number of enrollments for this specific course"""
        course = self.get_object()
        count = Enrollment.objects.filter(course=course).count()
        return Response({
            'course_id': str(course.id),
            'course_title': course.title,
            'enrollment_count': count
        })
    
    @action(detail=False, methods=['get'])
    def user_enrollments(self, request):
        """Get all courses the user is enrolled in"""
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        data = [{
            'course_id': str(enrollment.course.id),
            'course_title': enrollment.course.title
        } for enrollment in enrollments]
        return Response(data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def progress(self, request, pk=None):
        """Get progress for a specific course"""
        course = self.get_object()
        try:
            # Check if user is enrolled
            if not Enrollment.objects.filter(user=request.user, course=course).exists():
                return Response(
                    {'error': 'You are not enrolled in this course'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            progress = UserProgress.get_course_progress(request.user, course)
            return Response(progress)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def completion_rates(self, request):
        """Get completion rates for all courses"""
        courses = Course.objects.filter(status='PUBLISHED')
        completion_data = []
        
        for course in courses:
            enrollments = Enrollment.objects.filter(course=course).count()
            if enrollments == 0:
                continue
                
            # Get all lessons in the course
            lessons = Lesson.objects.filter(module__course=course)
            total_lessons = lessons.count()
            
            if total_lessons == 0:
                continue
                
            # Get all users who completed all lessons
            completed_users = 0
            for enrollment in Enrollment.objects.filter(course=course):
                progress = UserProgress.get_course_progress(enrollment.user, course)
                if progress['percentage'] == 100:
                    completed_users += 1
                    
            completion_rate = round((completed_users / enrollments) * 100, 2) if enrollments > 0 else 0
            
            completion_data.append({
                'course_id': str(course.id),
                'course_title': course.title,
                'enrollments': enrollments,
                'completions': completed_users,
                'completion_rate': completion_rate
            })
        
        # Calculate overall completion rate
        total_enrollments = sum(item['enrollments'] for item in completion_data)
        total_completions = sum(item['completions'] for item in completion_data)
        overall_rate = round((total_completions / total_enrollments) * 100, 2) if total_enrollments > 0 else 0
        
        return Response({
            'overall_completion_rate': overall_rate,
            'courses': completion_data
        })
class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]  

    def get_queryset(self):
        return Module.objects.filter(course_id=self.kwargs['course_pk'])
    
    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_pk'])
        serializer.save(course=course)

class ModuleProgressViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # Handle GET /module-progress/ (get all module progress for user)
        progress = ModuleProgress.objects.filter(user=request.user)
        serializer = ModuleProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_progress(self, request):
        # Handle GET /module-progress/get_progress/?module_id=<id>
        module_id = request.query_params.get('module_id')
        if not module_id:
            return Response({'error': 'module_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(Module, id=module_id)
        progress, created = ModuleProgress.objects.get_or_create(
            user=request.user,
            module=module,
            defaults={'is_completed': False}
        )
        serializer = ModuleProgressSerializer(progress)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_module(self, request, pk=None):
        module = self.get_object()
        ModuleProgress.mark_module_completed(request.user, module)
        return Response({'status': 'module completed'})

    @action(detail=False, methods=['post'])
    def mark_completed(self, request):
        # Handle POST /module-progress/mark_completed/
        module_id = request.data.get('module_id')
        if not module_id:
            return Response({'error': 'module_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        module = get_object_or_404(Module, id=module_id)
        progress, created = ModuleProgress.objects.get_or_create(
            user=request.user,
            module=module,
            defaults={'is_completed': True}
        )
        
        if not created:
            progress.is_completed = True
            progress.save()
            
        serializer = ModuleProgressSerializer(progress)
        return Response(serializer.data)

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Lesson.objects.filter(module_id=self.kwargs['module_pk'])

    def perform_create(self, serializer):
        module = get_object_or_404(Module, pk=self.kwargs['module_pk'])
        serializer.save(module=module)

    def perform_update(self, serializer):
        module = get_object_or_404(Module, pk=self.kwargs['module_pk'])
        serializer.save(module=module)

    @action(detail=False, methods=['get'])
    def with_sections(self, request, course_pk=None, module_pk=None):
        lessons = Lesson.objects.filter(module_id=module_pk).order_by('order')
        lessons = lessons.prefetch_related('sections', 'sections__subsections')
        serializer = self.get_serializer(lessons, many=True)
        return Response(serializer.data)

class LessonSectionViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        lesson_id = self.kwargs.get('lesson_pk')
        return LessonSection.objects.filter(lesson_id=lesson_id).order_by('order')

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, id=self.kwargs.get('lesson_pk'))
        parent_section_id = self.request.data.get('parent_section')
        parent_section = None
        
        if parent_section_id:
            parent_section = get_object_or_404(LessonSection, id=parent_section_id)
        
        serializer.save(lesson=lesson, parent_section=parent_section)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(
                {
                    'status': 'success',
                    'message': 'Section deleted successfully',
                    'section_id': str(instance.id),
                    'lesson_id': str(instance.lesson.id)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'lesson_id'
    lookup_url_kwarg = 'lesson_id'

    def get_queryset(self):
        queryset = UserProgress.objects.filter(user=self.request.user)
        
        # Add lesson filter if provided
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # If filtering by lesson and only one record expected
        if request.query_params.get('lesson_id') and queryset.exists():
            serializer = self.get_serializer(queryset.first())
            return Response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    def get_object(self):
        lesson_id = self.kwargs.get('lesson_id')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        
        progress, created = UserProgress.objects.get_or_create(
            user=self.request.user,
            lesson=lesson,
            defaults={'is_completed': False}
        )
        return progress

    def perform_create(self, serializer):
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        serializer.save(user=self.request.user, lesson=lesson)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Http404:
            # Create new progress record if not found
            lesson_id = kwargs.get('lesson_id')
            lesson = get_object_or_404(Lesson, id=lesson_id)
            serializer = self.get_serializer(data={
                'lesson': lesson_id,
                'is_completed': request.data.get('is_completed', False)
            })
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def course_progress(self, request, course_id=None):
        """Get progress for a specific course"""
        course = get_object_or_404(Course, id=course_id)
        try:
            # Check if user is enrolled
            if not Enrollment.objects.filter(user=request.user, course=course).exists():
                return Response(
                    {'error': 'You are not enrolled in this course'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            progress = UserProgress.get_course_progress(request.user, course)
            return Response(progress)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def all_progress(self, request):
        """Get progress for all enrolled courses"""
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        progress_data = []
        
        for enrollment in enrollments:
            progress = UserProgress.get_course_progress(request.user, enrollment.course)
            progress_data.append({
                'course_id': str(enrollment.course.id),
                'course_title': enrollment.course.title,
                'percentage': progress['percentage']
            })
        
        return Response(progress_data)

    @action(detail=False, methods=['post'])
    def toggle_lesson_completion(self, request):
        lesson_id = request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        progress = UserProgress.toggle_completion(request.user, lesson)
        return Response(UserProgressSerializer(progress).data)
