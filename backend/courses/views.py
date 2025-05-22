from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CourseCategory, Course, Module, Lesson, UserProgress
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
    permission_classes = [permissions.IsAuthenticated]  # ⬅️ Only authenticated users

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, pk=self.kwargs['lesson_pk'])
        serializer.save(user=self.request.user, lesson=lesson)
    
    @action(detail=False, methods=['get'])
    def course_progress(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        progress = UserProgress.get_course_progress(request.user, course_id)
        return Response(progress)
