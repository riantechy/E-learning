from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils import timezone
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
import random
import string

def migrate_lesson_completions(modeladmin, request, queryset):
    """
    Admin action to migrate lesson completions based on module completions
    """
    try:
        completed_modules = ModuleProgress.objects.filter(is_completed=True)
        stats = {
            'total_module_completions': completed_modules.count(),
            'lessons_processed': 0,
            'users_processed': 0
        }
        
        user_cache = set()
        
        for module_progress in completed_modules:
            user = module_progress.user
            module = module_progress.module
            completed_at = module_progress.completed_at or timezone.now()
            
            # Get all lessons in this module
            lessons = Lesson.objects.filter(module=module)
            
            for lesson in lessons:
                UserProgress.objects.update_or_create(
                    user=user,
                    lesson=lesson,
                    defaults={
                        'is_completed': True,
                        'completed_at': completed_at
                    }
                )
                stats['lessons_processed'] += 1
            
            if user.id not in user_cache:
                user_cache.add(user.id)
                stats['users_processed'] += 1
        
        # Show success message
        modeladmin.message_user(
            request,
            f"✅ Successfully migrated lesson completions! "
            f"Processed {stats['lessons_processed']} lessons for {stats['users_processed']} users "
            f"based on {stats['total_module_completions']} module completions.",
            messages.SUCCESS
        )
        
    except Exception as e:
        modeladmin.message_user(
            request,
            f"❌ Error during migration: {str(e)}",
            messages.ERROR
        )

# Add description for the admin action
migrate_lesson_completions.short_description = "📊 Migrate lesson completions from module completions"

def generate_random_password(length=12):
    """Generate a random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

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
            path('migrate-lesson-completions/', self.admin_site.admin_view(self.migrate_lesson_completions_view), name='courses_userprogress_migrate_lessons'),
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
    
    def migrate_lesson_completions_view(self, request):
        """
        Handle the migration via a dedicated admin view
        """
        if request.method == 'POST':
            migrate_lesson_completions(self, request, UserProgress.objects.all())
            return HttpResponseRedirect('../../')
        
        completed_modules_count = ModuleProgress.objects.filter(is_completed=True).count()
        context = {
            'title': 'Migrate Lesson Completions',
            'completed_modules_count': completed_modules_count,
            'opts': self.model._meta,
        }
        return render(request, 'admin/courses/migrate_lesson_completions_confirm.html', context)

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
            path('migrate-lesson-completions/', self.admin_site.admin_view(self.migrate_lesson_completions_view), name='courses_moduleprogress_migrate_lessons'),
            path('verify-migration/', self.admin_site.admin_view(self.verify_migration_view), name='courses_moduleprogress_verify_migration'),
        ]
        return custom_urls + urls
   

    def migrate_lesson_completions_view(self, request):
        """
        Handle the migration via a dedicated admin view
        """
        if request.method == 'POST':
            # Call the migration function without queryset parameter
            self.migrate_lesson_completions_action(request)
            return HttpResponseRedirect('../../')
        
        # Show confirmation page
        completed_modules_count = ModuleProgress.objects.filter(is_completed=True).count()
        context = {
            'title': 'Migrate Lesson Completions',
            'completed_modules_count': completed_modules_count,
            'opts': self.model._meta,
        }
        return render(request, 'admin/courses/migrate_lesson_completions_confirm.html', context)

    def migrate_lesson_completions_action(self, request):
        """
        Separate method for the migration logic that can be called from both actions and views
        """
        try:
            completed_modules = ModuleProgress.objects.filter(is_completed=True)
            stats = {
                'total_module_completions': completed_modules.count(),
                'lessons_processed': 0,
                'users_processed': 0,
                'created_count': 0,
                'updated_count': 0,
                'errors': []
            }
            
            user_cache = set()
            
            for module_progress in completed_modules:
                try:
                    user = module_progress.user
                    module = module_progress.module
                    completed_at = module_progress.completed_at or timezone.now()
                    
                    # Get all lessons in this module
                    lessons = Lesson.objects.filter(module=module)
                    
                    for lesson in lessons:
                        try:
                            # Use update_or_create to ensure the record is properly set
                            user_progress, created = UserProgress.objects.update_or_create(
                                user=user,
                                lesson=lesson,
                                defaults={
                                    'is_completed': True,
                                    'completed_at': completed_at
                                }
                            )
                            
                            if created:
                                stats['created_count'] += 1
                            else:
                                # Check if we actually updated an incomplete record
                                if not user_progress.is_completed:
                                    stats['updated_count'] += 1
                            
                            stats['lessons_processed'] += 1
                            
                        except Exception as e:
                            stats['errors'].append(f"Error processing lesson {lesson.id} for user {user.email}: {str(e)}")
                            continue
                    
                    if user.id not in user_cache:
                        user_cache.add(user.id)
                        stats['users_processed'] += 1
                        
                except Exception as e:
                    stats['errors'].append(f"Error processing module {module_progress.id}: {str(e)}")
                    continue
            
            # Show detailed success message
            message = (
                f"✅ Migration completed!\n"
                f"• Processed {stats['lessons_processed']} lessons\n"
                f"• Affected {stats['users_processed']} users\n"
                f"• Based on {stats['total_module_completions']} module completions\n"
                f"• Created {stats['created_count']} new records\n"
                f"• Updated {stats['updated_count']} existing records\n"
            )
            
            if stats['errors']:
                message += f"• {len(stats['errors'])} errors occurred"
            
            self.message_user(
                request,
                message,
                messages.SUCCESS if not stats['errors'] else messages.WARNING
            )
            
            # Log errors for debugging
            for error in stats['errors'][:5]:
                self.message_user(request, f"Error: {error}", messages.ERROR)
            
        except Exception as e:
            self.message_user(
                request,
                f"❌ Critical error during migration: {str(e)}",
                messages.ERROR
            )

    def verify_migration_view(self, request):
        """
        Verify that lesson completions match module completions
        """
        try:
            # Check a sample of users and modules
            sample_users = User.objects.filter(
                moduleprogress__is_completed=True
            ).distinct()[:5]
            
            verification_results = []
            
            for user in sample_users:
                user_modules = ModuleProgress.objects.filter(
                    user=user, 
                    is_completed=True
                )
                
                for module_progress in user_modules[:2]:  # Check first 2 modules per user
                    module = module_progress.module
                    lessons = Lesson.objects.filter(module=module)
                    completed_lessons = UserProgress.objects.filter(
                        user=user,
                        lesson__in=lessons,
                        is_completed=True
                    ).count()
                    
                    verification_results.append({
                        'user': user.email,
                        'module': module.title,
                        'total_lessons': lessons.count(),
                        'completed_lessons': completed_lessons,
                        'status': '✅ Complete' if completed_lessons == lessons.count() else '❌ Incomplete'
                    })
            
            # Show verification results
            message = "Verification Results:\n"
            for result in verification_results:
                message += (
                    f"• {result['user']} - {result['module']}: "
                    f"{result['completed_lessons']}/{result['total_lessons']} lessons - {result['status']}\n"
                )
            
            self.message_user(request, message, messages.INFO)
            
        except Exception as e:
            self.message_user(
                request,
                f"❌ Verification error: {str(e)}",
                messages.ERROR
            )

    def bulk_update_module_progress_view(self, request):
        """Handle bulk module progress update from Excel in the new format"""
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            
            try:
                df = pd.read_excel(excel_file)
                updated_count = 0
                user_created_count = 0
                enrollment_count = 0
                errors = []
                
                # Get the target course for enrollment
                target_course_id = '8960c8009c79401ba38ce11b9eced6e9'
                try:
                    target_course = Course.objects.get(id=target_course_id)
                except Course.DoesNotExist:
                    errors.append(f"Target course with ID {target_course_id} not found")
                    self.message_user(request, f"Error: {errors[0]}", level='error')
                    return redirect('admin:courses_moduleprogress_changelist')
                
                # Get all module IDs from columns (skip first 4 columns: No, NAME, EMAIL ADDRESS, PHONE NUMBER)
                module_columns = df.columns[4:]  # Skip first 4 columns (No., NAME, EMAIL ADDRESS, PHONE NUMBER)
                
                for index, row in df.iterrows():
                    try:
                        user_email = str(row.iloc[2]).strip().lower()  # EMAIL ADDRESS is 3rd column (index 2)
                        user_name = str(row.iloc[1]).strip()  # NAME is 2nd column (index 1)
                        phone_number = str(row.iloc[3]).strip()  # PHONE NUMBER is 4th column (index 3)
                        
                        if not user_email or user_email.lower() == 'nan' or user_email == 'email address':
                            continue  # Skip header rows or empty emails
                        
                        # Try to find user by email
                        try:
                            user = User.objects.get(email__iexact=user_email)
                        except User.DoesNotExist:
                            # Create new user
                            try:
                                # Split name into first and last name
                                name_parts = user_name.split(' ', 1)
                                first_name = name_parts[0] if name_parts else user_name
                                last_name = name_parts[1] if len(name_parts) > 1 else 'User'
                                
                                # Generate random password
                                temp_password = generate_random_password()
                                
                                # Create user with minimal required fields
                                user = User.objects.create_user(
                                    email=user_email,
                                    password=temp_password,
                                    first_name=first_name,
                                    last_name=last_name,
                                    phone=phone_number,
                                    gender='Other',  # Default value
                                    date_of_birth='1900-01-01',  # Default value
                                    county='Unknown',  # Default value
                                    education='Not specified',  # Default value
                                    role='LEARNER',
                                    is_verified=True,  # Auto-verify since we're creating via admin
                                    force_password_change=True  # Force password change on first login
                                )
                                
                                user_created_count += 1
                                errors.append(f"Row {index+1}: Created new user '{user_email}' with temporary password")
                                
                            except Exception as e:
                                errors.append(f"Row {index+1}: Failed to create user '{user_email}' - {str(e)}")
                                continue
                        
                        # Enroll user in the target course if not already enrolled
                        try:
                            enrollment, created = Enrollment.objects.get_or_create(
                                user=user,
                                course=target_course
                            )
                            if created:
                                enrollment_count += 1
                        except Exception as e:
                            errors.append(f"Row {index+1}: Failed to enroll user '{user_email}' in course - {str(e)}")
                        
                        # Process each module column
                        for module_id_col in module_columns:
                            cell_value = str(row[module_id_col])
                            
                            # Skip empty cells
                            if pd.isna(row[module_id_col]) or cell_value.lower() == 'nan' or not cell_value.strip():
                                continue
                            
                            # Check if cell contains completion data
                            if 'completed' in cell_value.lower():
                                try:
                                    # Clean the module ID - remove any non-alphanumeric characters except hyphens
                                    clean_module_id = str(module_id_col).strip()
                                    
                                    # Fix common UUID formatting issues
                                    # Remove any whitespace
                                    clean_module_id = clean_module_id.replace(' ', '')
                                    
                                    # If UUID is missing characters, try to pad it (this is a workaround)
                                    if len(clean_module_id) == 31 and '-' not in clean_module_id:
                                        # Try adding a character at the end (this might not be accurate)
                                        clean_module_id = clean_module_id + '0'
                                    
                                    # Extract date from "completed YYYY-MM-DD"
                                    date_str = cell_value.lower().replace('completed', '').strip()
                                    try:
                                        completed_date = pd.to_datetime(date_str)
                                    except:
                                        # If date parsing fails, use current date
                                        completed_date = timezone.now()
                                    
                                    try:
                                        module = Module.objects.get(id=clean_module_id)
                                        
                                        progress, created = ModuleProgress.objects.update_or_create(
                                            user=user,
                                            module=module,
                                            defaults={
                                                'is_completed': True,
                                                'completed_at': completed_date
                                            }
                                        )
                                        updated_count += 1
                                        
                                    except Module.DoesNotExist:
                                        errors.append(f"Row {index+1}: Module '{clean_module_id}' not found in database")
                                    except ValueError as e:
                                        if 'invalid UUID' in str(e):
                                            errors.append(f"Row {index+1}: Invalid UUID format '{clean_module_id}' - {str(e)}")
                                        else:
                                            errors.append(f"Row {index+1}: Error with module '{clean_module_id}' - {str(e)}")
                                    
                                except Exception as e:
                                    errors.append(f"Row {index+1}: Error processing module '{module_id_col}' - {str(e)}")
                            
                    except Exception as e:
                        errors.append(f"Row {index+1}: General error - {str(e)}")
                
                # Show success message with summary
                success_message = f"""
                Bulk update completed:
                - Created {user_created_count} new users
                - Enrolled {enrollment_count} users in course
                - Updated {updated_count} module progress records
                """
                
                if errors:
                    self.message_user(
                        request,
                        f'{success_message} {len(errors)} errors occurred.',
                        level='warning'
                    )
                    # Store only first 20 errors to avoid session size issues
                    request.session['bulk_operation_errors'] = errors[:20]
                else:
                    self.message_user(
                        request,
                        success_message
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
        """Export Excel template for bulk module progress update in the new format"""
        # Get some example modules
        modules = Module.objects.all()[:5]
        
        # Create DataFrame with the required column structure
        columns = ['No.', 'NAME', 'EMAIL ADDRESS', 'PHONE NUMBER']
        
        # Add module IDs as additional columns
        for module in modules:
            columns.append(str(module.id))
        
        df = pd.DataFrame(columns=columns)
        
        # Add example rows
        df.loc[0] = {
            'No.': 1,
            'NAME': 'John Doe',
            'EMAIL ADDRESS': 'student@example.com',
            'PHONE NUMBER': '1234567890'
        }
        
        # Fill module columns with example completion data
        for module in modules:
            df.loc[0][str(module.id)] = 'completed 2024-01-15'
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="module_progress_template_new_format.xlsx"'
        
        df.to_excel(response, index=False)
        return response