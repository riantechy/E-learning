from django.urls import path
from .views import (
    GenerateCertificateView,
    CertificateTemplateListCreateView,
    UserCertificateListView,
    VerifyCertificateView,
    CertificateTemplateDeleteView,
    DownloadCertificateView
)

urlpatterns = [
    path('generate/<uuid:course_id>/', GenerateCertificateView.as_view(), name='generate-certificate'),
    path('templates/', CertificateTemplateListCreateView.as_view(), name='certificate-templates'),
    path('templates/<uuid:pk>/', CertificateTemplateDeleteView.as_view(), name='delete-certificate-template'),
    path('user/', UserCertificateListView.as_view(), name='user-certificates'),
    path('verify/<str:certificate_number>/', VerifyCertificateView.as_view(), name='verify-certificate'),
    path('download/<uuid:certificate_id>/', DownloadCertificateView.as_view(), name='download-certificate'),
]