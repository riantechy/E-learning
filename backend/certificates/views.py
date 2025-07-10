from rest_framework import generics, status
from rest_framework.response import Response
from reportlab.lib.pagesizes import letter
from django.http import FileResponse
from .models import Certificate
from rest_framework.renderers import BaseRenderer
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Certificate, CertificateTemplate
from .serializers import CertificateTemplateSerializer, CertificateSerializer
from reportlab.pdfgen import canvas
from io import BytesIO
from django.core.files.base import ContentFile
from courses.models import Course, ModuleProgress, Module
from users.models import User
import uuid
from django.urls import reverse
from django.conf import settings
class GenerateCertificateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, course_id):
        user = request.user
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has completed course requirements
        from courses.models import UserProgress
        progress = UserProgress.get_course_progress(user, course)
        module_progress = ModuleProgress.objects.filter(
            user=user,
            module__course=course,
            is_completed=True
        ).count()
        total_modules = Module.objects.filter(course=course).count()

        if progress['percentage'] < 100 or module_progress < total_modules:
            return Response(
                {"detail": "Course not completed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if progress['percentage'] < 100:
            return Response(
                {"detail": "Course not completed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if certificate already exists
        if Certificate.objects.filter(user=user, course=course).exists():
            certificate = Certificate.objects.get(user=user, course=course)
            serializer = CertificateSerializer(certificate)
            return Response(serializer.data)
        
        # Get default template or first available template
        template = CertificateTemplate.objects.first()
        if not template:
            return Response(
                {"detail": "No certificate templates available"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate certificate
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Certificate design
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(300, 700, "CERTIFICATE OF ACHIEVEMENT")

        c.setFont("Helvetica", 16)
        c.drawCentredString(300, 650, "This is to certify that")

        c.setFont("Helvetica-Bold", 24)
        # Combine first and last names
        full_name = f"{user.first_name} {user.last_name}"
        c.drawCentredString(300, 620, full_name)  # Display full name

        c.setFont("Helvetica", 16)
        c.drawCentredString(300, 580, "has successfully completed the course")

        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(300, 540, f'"{course.title}"')

        c.setFont("Helvetica", 14)
        c.drawCentredString(300, 500, f"on {timezone.now().strftime('%B %d, %Y')}")
                
        # Add certificate number
        cert_number = str(uuid.uuid4())[:8].upper()
        c.setFont("Helvetica", 12)
        c.drawString(50, 100, f"Certificate ID: {cert_number}")
        
        # Add verification URL
        verification_url = request.build_absolute_uri(
            reverse('verify-certificate', kwargs={'certificate_number': cert_number})
        )
        c.drawString(50, 80, f"Verify at: {verification_url}")
        
        # Add decorative border
        c.rect(20, 20, 550, 750)
        
        c.save()
        
        # Create certificate record
        certificate, created = Certificate.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'template': template,
                'certificate_number': cert_number,
                'verification_url': verification_url
            }
        )
        if not created:
            serializer = CertificateSerializer(certificate)
            return Response(serializer.data)
    
        # certificate = Certificate.objects.create(
        #     user=user,
        #     course=course,
        #     template=template,
        #     certificate_number=cert_number,
        #     verification_url=verification_url
        # )
        
        # Save PDF
        pdf = buffer.getvalue()
        certificate.pdf_file.save(
            f"certificate_{certificate.certificate_number}.pdf", 
            ContentFile(pdf)
        )
        certificate.save()
        
        serializer = CertificateSerializer(certificate)
        return Response(serializer.data)

class CertificateTemplateListCreateView(generics.ListCreateAPIView):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAdminUser]  


class UserCertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Certificate.objects.filter(user=self.request.user)
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

class VerifyCertificateView(generics.RetrieveAPIView):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    lookup_field = 'certificate_number'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            **serializer.data,
            "valid": True
        })
class BinaryFileRenderer(BaseRenderer):
    media_type = 'application/pdf'
    format = 'pdf'
    charset = None
    render_style = 'binary'

    def render(self, data, media_type=None, renderer_context=None):
        return data

class DownloadCertificateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    renderer_classes = [BinaryFileRenderer]
    
    def get(self, request, certificate_id, *args, **kwargs):
        try:
            certificate = Certificate.objects.get(id=certificate_id)
            
            # Check if the requesting user owns the certificate or is admin
            if certificate.user != request.user and not request.user.is_staff:
                return Response(
                    {"detail": "You don't have permission to download this certificate"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            if not certificate.pdf_file:
                return Response(
                    {"detail": "PDF file not found for this certificate"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            file = certificate.pdf_file.open('rb')
            response = FileResponse(
                file,
                as_attachment=True,
                filename=f"certificate_{certificate.certificate_number}.pdf",
                content_type='application/pdf'
            )
            return response
            
        except Certificate.DoesNotExist:
            return Response(
                {"detail": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )