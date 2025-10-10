from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from django.contrib import admin

admin.site.site_header = "Whitebox E-learning Admin"
admin.site.site_title = "Whitebox E-learning Admin Portal"
admin.site.index_title = "Welcome to Whitebox E-learning Administration"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active', 'is_verified')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

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
