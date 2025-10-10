from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.shortcuts import render, redirect
import pandas as pd
from .models import (
    CourseCategory,
    Course,
    Module,
    Lesson,
    LessonSection,
    UserProgress,
    Enrollment,
    ModuleProgress
)
from users.models import User

@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'created_at', 'published_at', 'is_featured', 'enrollment_count')
    list_filter = ('status', 'is_featured', 'category')
    search_fields = ('title', 'description')
    actions = ['enroll_users', 'export_enrollments_template', 'bulk_enroll_users']
    change_list_template = 'admin/courses/course_change_list.html'
    change_form_template = 'admin/courses/course_change_form.html'
    
    def enrollment_count(self, obj):
        return obj.enrollment_set.count()
    enrollment_count.short_description = 'Enrollments'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-enroll/', self.admin_site.admin_view(self.bulk_enroll_view), name='courses_course_bulk_enroll'),
            path('export-enrollment-template/', self.admin_site.admin_view(self.export_enrollment_template_view), name='courses_course_export_template'),
        ]
        return custom_urls + urls

    def bulk_enroll_view(self, request):
        """Handle bulk enrollment from Excel"""
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            course_id = request.POST.get('course_id')
            
            try:
                course = Course.objects.get(id=course_id)
                df = pd.read_excel(excel_file)
                enrolled_count = 0
                errors = []
                
                for index, row in df.iterrows():
                    try:
                        user_email = row.get('user_email', '').strip()
                        user_id = row.get('user_id', '')
                        
                        if user_email:
                            user = User.objects.get(email=user_email)
                        elif user_id:
                            user = User.objects.get(id=user_id)
                        else:
                            errors.append(f"Row {index+1}: No user identifier provided")
                            continue
                        
                        enrollment, created = Enrollment.objects.get_or_create(
                            user=user,
                            course=course
                        )
                        if created:
                            enrolled_count += 1
                            
                    except User.DoesNotExist:
                        errors.append(f"Row {index+1}: User not found")
                    except Exception as e:
                        errors.append(f"Row {index+1}: {str(e)}")
                
                if errors:
                    self.message_user(
                        request,
                        f'Enrolled {enrolled_count} users. Errors: {len(errors)}',
                        level='warning'
                    )
                    # Store errors in session to display
                    request.session['bulk_operation_errors'] = errors[:10]
                else:
                    self.message_user(
                        request,
                        f'Successfully enrolled {enrolled_count} users in {course.title}'
                    )
                
                return redirect('admin:courses_course_changelist')
                    
            except Exception as e:
                self.message_user(
                    request,
                    f'Error processing Excel file: {str(e)}',
                    level='error'
                )
        
        # Show upload form
        courses = Course.objects.all()
        context = {
            'title': 'Bulk Enroll Users',
            'courses': courses,
            'opts': self.model._meta,
        }
        return render(request, 'admin/courses/bulk_enroll_upload.html', context)

    def export_enrollment_template_view(self, request):
        """Export Excel template for bulk enrollment"""
        df = pd.DataFrame(columns=[
            'user_email',
            'user_id',
            'notes'
        ])
        
        # Add example rows
        df.loc[0] = ['student1@example.com', '', 'Use either email or user ID']
        df.loc[1] = ['', 'user-uuid-here', 'User ID is optional if email is provided']
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="bulk_enrollment_template.xlsx"'
        
        df.to_excel(response, index=False)
        return response

    def enroll_users(self, request, queryset):
        from django.template.response import TemplateResponse
        
        if 'apply' in request.POST:
            user_ids = request.POST.getlist('users')
            enrolled_count = 0
            
            for user_id in user_ids:
                user = User.objects.get(id=user_id)
                for course in queryset:
                    enrollment, created = Enrollment.objects.get_or_create(
                        user=user,
                        course=course
                    )
                    if created:
                        enrolled_count += 1
            
            self.message_user(
                request,
                f'Successfully enrolled {enrolled_count} users in {len(queryset)} course(s)'
            )
            return None
        
        users = User.objects.filter(is_active=True)
        context = {
            'title': 'Enroll Users in Selected Courses',
            'courses': queryset,
            'users': users,
        }
        return TemplateResponse(request, 'admin/courses/bulk_enroll.html', context)
    
    enroll_users.short_description = "Enroll users in selected courses"

    def export_enrollments_template(self, request, queryset):
        """Export Excel template for bulk enrollment"""
        if len(queryset) != 1:
            self.message_user(request, "Please select exactly one course for template export", level='error')
            return
        
        course = queryset.first()
        
        df = pd.DataFrame(columns=[
            'user_email',
            'user_id',
            'notes'
        ])
        
        df.loc[0] = ['student@example.com', '', f'Template for {course.title}']
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="enrollment_template_{course.title}.xlsx"'
        
        df.to_excel(response, index=False)
        return response
    
    export_enrollments_template.short_description = "Export enrollment template"

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course',)
    search_fields = ('title',)

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'content_type', 'order', 'is_required', 'duration_minutes')
    list_filter = ('content_type', 'is_required')
    search_fields = ('title',)

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'is_completed', 'completed_at', 'last_accessed')
    list_filter = ('is_completed',)
    search_fields = ('user__email', 'lesson__title')
    change_list_template = 'admin/courses/userprogress_change_list.html'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-update-progress/', self.admin_site.admin_view(self.bulk_update_progress_view), name='courses_userprogress_bulk_update'),
            path('export-progress-template/', self.admin_site.admin_view(self.export_progress_template_view), name='courses_userprogress_export_template'),
        ]
        return custom_urls + urls

    def bulk_update_progress_view(self, request):
        """Handle bulk progress update from Excel"""
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            
            try:
                df = pd.read_excel(excel_file)
                updated_count = 0
                errors = []
                
                for index, row in df.iterrows():
                    try:
                        user_email = row.get('user_email', '').strip()
                        lesson_id = row.get('lesson_id', '')
                        is_completed = row.get('is_completed', False)
                        
                        if not user_email or not lesson_id:
                            errors.append(f"Row {index+1}: Missing required fields")
                            continue
                        
                        user = User.objects.get(email=user_email)
                        lesson = Lesson.objects.get(id=lesson_id)
                        
                        progress, created = UserProgress.objects.update_or_create(
                            user=user,
                            lesson=lesson,
                            defaults={'is_completed': bool(is_completed)}
                        )
                        updated_count += 1
                        
                    except User.DoesNotExist:
                        errors.append(f"Row {index+1}: User not found")
                    except Lesson.DoesNotExist:
                        errors.append(f"Row {index+1}: Lesson not found")
                    except Exception as e:
                        errors.append(f"Row {index+1}: {str(e)}")
                
                if errors:
                    self.message_user(
                        request,
                        f'Updated {updated_count} progress records. Errors: {len(errors)}',
                        level='warning'
                    )
                    request.session['bulk_operation_errors'] = errors[:10]
                else:
                    self.message_user(
                        request,
                        f'Successfully updated {updated_count} progress records'
                    )
                
                return redirect('admin:courses_userprogress_changelist')
                    
            except Exception as e:
                self.message_user(
                    request,
                    f'Error processing Excel file: {str(e)}',
                    level='error'
                )
        
        context = {
            'title': 'Bulk Update User Progress',
            'opts': self.model._meta,
        }
        return render(request, 'admin/courses/bulk_progress_upload.html', context)

    def export_progress_template_view(self, request):
        """Export Excel template for bulk progress update"""
        # Get some example lessons
        lessons = Lesson.objects.all()[:3]
        
        df = pd.DataFrame(columns=[
            'user_email',
            'lesson_id',
            'is_completed',
            'notes'
        ])
        
        # Add example rows
        for i, lesson in enumerate(lessons):
            df.loc[i] = [
                'student@example.com',
                str(lesson.id),
                'TRUE',
                f'Lesson: {lesson.title}'
            ]
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="progress_update_template.xlsx"'
        
        df.to_excel(response, index=False)
        return response

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('course', 'enrolled_at')
    search_fields = ('user__email', 'course__title')

@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'module', 'is_completed', 'completed_at')
    list_filter = ('is_completed', 'module__course')
    search_fields = ('user__email', 'module__title')
    change_list_template = 'admin/courses/moduleprogress_change_list.html'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-update-module-progress/', self.admin_site.admin_view(self.bulk_update_module_progress_view), name='courses_moduleprogress_bulk_update'),
            path('export-module-progress-template/', self.admin_site.admin_view(self.export_module_progress_template_view), name='courses_moduleprogress_export_template'),
        ]
        return custom_urls + urls

    def bulk_update_module_progress_view(self, request):
        """Handle bulk module progress update from Excel"""
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            
            try:
                df = pd.read_excel(excel_file)
                updated_count = 0
                errors = []
                
                for index, row in df.iterrows():
                    try:
                        user_email = row.get('user_email', '').strip()
                        module_id = row.get('module_id', '')
                        is_completed = row.get('is_completed', False)
                        
                        if not user_email or not module_id:
                            errors.append(f"Row {index+1}: Missing required fields")
                            continue
                        
                        user = User.objects.get(email=user_email)
                        module = Module.objects.get(id=module_id)
                        
                        progress, created = ModuleProgress.objects.update_or_create(
                            user=user,
                            module=module,
                            defaults={'is_completed': bool(is_completed)}
                        )
                        updated_count += 1
                        
                    except User.DoesNotExist:
                        errors.append(f"Row {index+1}: User not found")
                    except Module.DoesNotExist:
                        errors.append(f"Row {index+1}: Module not found")
                    except Exception as e:
                        errors.append(f"Row {index+1}: {str(e)}")
                
                if errors:
                    self.message_user(
                        request,
                        f'Updated {updated_count} module progress records. Errors: {len(errors)}',
                        level='warning'
                    )
                    request.session['bulk_operation_errors'] = errors[:10]
                else:
                    self.message_user(
                        request,
                        f'Successfully updated {updated_count} module progress records'
                    )
                
                return redirect('admin:courses_moduleprogress_changelist')
                    
            except Exception as e:
                self.message_user(
                    request,
                    f'Error processing Excel file: {str(e)}',
                    level='error'
                )
        
        context = {
            'title': 'Bulk Update Module Progress',
            'opts': self.model._meta,
        }
        return render(request, 'admin/courses/bulk_module_progress_upload.html', context)

    def export_module_progress_template_view(self, request):
        """Export Excel template for bulk module progress update"""
        modules = Module.objects.all()[:3]
        
        df = pd.DataFrame(columns=[
            'user_email',
            'module_id',
            'is_completed',
            'notes'
        ])
        
        for i, module in enumerate(modules):
            df.loc[i] = [
                'student@example.com',
                str(module.id),
                'TRUE',
                f'Module: {module.title}'
            ]
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="module_progress_template.xlsx"'
        
        df.to_excel(response, index=False)
        return response