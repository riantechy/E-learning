from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from django.contrib import admin
from django.urls import path
import pandas as pd
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib import messages
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import io
from django.db.models import Count, Q

admin.site.site_header = "Whitebox E-learning Admin"
admin.site.site_title = "Whitebox E-learning Admin Portal"
admin.site.index_title = "Welcome to Whitebox E-learning Administration"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'role', 'date_joined', 'is_staff', 'is_active', 'is_verified')
    list_filter = ('role', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    # Add custom action for exporting selected users
    actions = ['export_selected_users']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {
            'fields': (
                'first_name', 'last_name', 'gender', 'phone', 'date_of_birth',
                'county', 'education', 'innovation', 'innovation_stage',
                'innovation_in_whitebox', 'innovation_industry',
                'training', 'training_institution', 'role'
            )
        }),
        ('Permissions', {
            'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'password1', 'password2',
                'is_staff', 'is_active', 'role'
            ),
        }),
    )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('student-registrations-report/', 
                 self.admin_site.admin_view(self.student_registrations_report),
                 name='student_registrations_report'),
            path('student-registrations-export/', 
                 self.admin_site.admin_view(self.export_student_registrations),
                 name='student_registrations_export'),
        ]
        return custom_urls + urls
    
    def student_registrations_report(self, request):
        """
        View to filter and display student registrations by date range
        """
        context = {
            'title': 'Student Registrations Report',
            'site_header': admin.site.site_header,
            'site_title': admin.site.site_title,
            'index_title': admin.site.index_title,
            'has_permission': request.user.is_authenticated,
            'is_popup': False,
        }
        
        # Default date range: last 30 days
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Get date parameters from request
        if request.method == 'GET' and 'start_date' in request.GET and 'end_date' in request.GET:
            try:
                start_date_str = request.GET.get('start_date')
                end_date_str = request.GET.get('end_date')
                
                if start_date_str:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                    start_date = timezone.make_aware(start_date)
                
                if end_date_str:
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                    end_date = timezone.make_aware(end_date)
                    # Set end_date to end of day
                    end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError:
                messages.error(request, 'Invalid date format. Please use YYYY-MM-DD format.')
        
        # Filter learners within date range
        learners = User.objects.filter(
            role='LEARNER',
            date_joined__gte=start_date,
            date_joined__lte=end_date
        ).order_by('-date_joined')
        
        # Get registration statistics
        total_count = learners.count()
        daily_counts = learners.extra(
            select={'date': "DATE(date_joined)"}
        ).values('date').annotate(count=Count('id')).order_by('-date')
        
        # Get county distribution
        county_distribution = learners.values('county').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Get gender distribution
        gender_distribution = learners.values('gender').annotate(
            count=Count('id')
        ).order_by('-count')
        
        context.update({
            'learners': learners,
            'total_count': total_count,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'daily_counts': daily_counts[:10],  # Last 10 days
            'county_distribution': county_distribution[:10],  # Top 10 counties
            'gender_distribution': gender_distribution,
            'opts': self.model._meta,
        })
        
        return render(request, 'admin/student_registrations_report.html', context)
    
    def export_student_registrations(self, request):
        """
        Export student registrations to CSV based on date range
        """
        # Get date parameters
        start_date_str = request.GET.get('start_date', '')
        end_date_str = request.GET.get('end_date', '')
        
        # Set default date range if not provided
        if not start_date_str or not end_date_str:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                start_date = timezone.make_aware(start_date)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                end_date = timezone.make_aware(end_date)
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError:
                messages.error(request, 'Invalid date format')
                return HttpResponseRedirect(reverse('admin:student_registrations_report'))
        
        # Filter learners
        learners = User.objects.filter(
            role='LEARNER',
            date_joined__gte=start_date,
            date_joined__lte=end_date
        ).order_by('-date_joined')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="student_registrations_{start_date_str}_to_{end_date_str}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Student ID', 'Email', 'First Name', 'Last Name', 
            'Gender', 'Phone', 'Date of Birth', 'County',
            'Education', 'Registration Date', 'Is Verified'
        ])
        
        for learner in learners:
            writer.writerow([
                str(learner.id),
                learner.email,
                learner.first_name,
                learner.last_name,
                learner.gender,
                learner.phone,
                learner.date_of_birth,
                learner.county,
                learner.education,
                learner.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                'Yes' if learner.is_verified else 'No'
            ])
        
        return response
    
    def export_selected_users(self, request, queryset):
        """
        Admin action to export selected users to CSV
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="selected_students.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Student ID', 'Email', 'First Name', 'Last Name', 
            'Gender', 'Phone', 'County', 'Registration Date', 'Status'
        ])
        
        for user in queryset.filter(role='LEARNER'):
            writer.writerow([
                str(user.id),
                user.email,
                user.first_name,
                user.last_name,
                user.gender,
                user.phone,
                user.county,
                user.date_joined.strftime('%Y-%m-%d'),
                'Active' if user.is_active else 'Inactive'
            ])
        
        self.message_user(request, f"Exported {queryset.count()} students to CSV")
        return response
    
    export_selected_users.short_description = "Export selected students to CSV"


    def export_to_excel(self, request):
        """
        Export student registrations to Excel
        """
        # ... similar to CSV export function but using pandas
        import pandas as pd
        from io import BytesIO
        
        # Get data
        learners = User.objects.filter(role='LEARNER')
        
        # Create DataFrame
        data = []
        for learner in learners:
            data.append({
                'Student ID': str(learner.id),
                'Email': learner.email,
                'First Name': learner.first_name,
                'Last Name': learner.last_name,
                'Gender': learner.gender,
                'Phone': learner.phone,
                'Date of Birth': learner.date_of_birth,
                'County': learner.county,
                'Education': learner.education,
                'Registration Date': learner.date_joined,
                'Verified': 'Yes' if learner.is_verified else 'No'
            })
        
        df = pd.DataFrame(data)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Student Registrations', index=False)
        
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="student_registrations.xlsx"'
        
        return response