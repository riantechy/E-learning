from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CourseCategory, Course, Module, Lesson, UserProgress, Enrollment
from .serializers import (
    CourseCategorySerializer, CourseSerializer, 
    ModuleSerializer, LessonSerializer, UserProgressSerializer
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


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]  # ⬅️ Only authenticated users

    def get_queryset(self):
        return Module.objects.filter(course_id=self.kwargs['course_pk'])
    
    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_pk'])
        serializer.save(course=course)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]  # ⬅️ Only authenticated users

    def get_queryset(self):
        return Lesson.objects.filter(module_id=self.kwargs['module_pk'])
    
    def perform_create(self, serializer):
        module = get_object_or_404(Module, pk=self.kwargs['module_pk'])
        serializer.save(module=module)

class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        serializer.save(user=self.request.user, lesson=lesson)

    @action(detail=False, methods=['get'], url_path='course')
    def course_progress(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course = get_object_or_404(Course, pk=course_id)
            progress = UserProgress.get_course_progress(request.user, course)
            return Response(progress)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
