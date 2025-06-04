from django.urls import path
from .views import (
    GenerateCertificateView,
    CertificateTemplateListCreateView,
    UserCertificateListView,
    VerifyCertificateView,
)

urlpatterns = [
    path('generate/<uuid:course_id>/', GenerateCertificateView.as_view(), name='generate-certificate'),
    path('templates/', CertificateTemplateListCreateView.as_view(), name='certificate-templates'),
    path('user/', UserCertificateListView.as_view(), name='user-certificates'),
    path('verify/<str:certificate_number>/', VerifyCertificateView.as_view(), name='verify-certificate'),
]