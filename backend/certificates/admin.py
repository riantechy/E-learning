from django.contrib import admin
from .models import CertificateTemplate, Certificate

@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'issued_date', 'certificate_number')
    search_fields = ('user__email', 'course__title', 'certificate_number')
    list_filter = ('issued_date',)
    # raw_id_fields = ('user', 'course')
