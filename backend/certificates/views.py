from rest_framework import generics, status
from rest_framework.response import Response
from reportlab.lib.pagesizes import letter
from django.http import FileResponse
from .models import Certificate
from rest_framework.renderers import BaseRenderer
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .models import Certificate, CertificateTemplate
from .serializers import CertificateTemplateSerializer, CertificateSerializer
from reportlab.pdfgen import canvas
from io import BytesIO
from django.core.files.base import ContentFile
from courses.models import Course, ModuleProgress, Module
from users.models import User
import uuid
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.units import inch
from django.urls import reverse
from django.conf import settings
import qrcode
from reportlab.lib.utils import ImageReader

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

        # Check if certificate already exists
        if Certificate.objects.filter(user=user, course=course).exists():
            certificate = Certificate.objects.get(user=user, course=course)
            serializer = CertificateSerializer(certificate)
            return Response(serializer.data)

        # Get the certificate template
        template = CertificateTemplate.objects.first()
        if not template:
            return Response(
                {"detail": "No certificate templates available"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate certificate number
        cert_number = str(uuid.uuid4())[:8].upper()
        
        # Use FRONTEND_URL from settings for the verification URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/dashboard/certificates/verify/{cert_number}"

        # Generate QR code
        qr_buffer = BytesIO()
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)

        # Generate certificate
        buffer = BytesIO()
        pdf_reader = PdfReader(template.template_file.open('rb'))
        pdf_writer = PdfWriter()

        # Get the actual page size from the template
        first_page = pdf_reader.pages[0]
        mediabox = first_page.mediabox
        page_width = float(mediabox.width)  
        page_height = float(mediabox.height)
        
        # Determine if the page is landscape or portrait
        is_landscape = page_width > page_height
        
        # Use the actual page size from the template
        template_pagesize = (page_width, page_height)

        # Create a canvas to draw the student's name
        name_buffer = BytesIO()
        c = canvas.Canvas(name_buffer, pagesize=template_pagesize)
        full_name = f"{user.first_name} {user.last_name}"

        # Customize position and styling for the student's name
        c.setFont("Helvetica-Bold", 24)
        
        # Adjust name position based on page orientation
        if is_landscape:
            # For landscape: center horizontally, position vertically
            name_x = page_width / 2
            name_y = page_height * 0.5  # Adjust this value as needed
        else:
            # For portrait
            name_x = page_width / 2
            name_y = page_height * 0.5
            
        c.drawCentredString(name_x, name_y, full_name)
        c.save()

        # Merge the name with the template
        name_pdf = PdfReader(BytesIO(name_buffer.getvalue()))
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            if page_num == 0: 
                page.merge_page(name_pdf.pages[0])
            pdf_writer.add_page(page)

        # Create a new canvas for QR code and certificate number
        qr_cert_buffer = BytesIO()
        c = canvas.Canvas(qr_cert_buffer, pagesize=template_pagesize)
        
        # Add QR code with proper positioning based on page orientation
        qr_image = ImageReader(qr_buffer)
        
        if is_landscape:
            # For landscape: position more centered at bottom, not too close to edge
            qr_x = page_width - 200  # 200 points from right edge (more margin)
            qr_y = 80  # 80 points from bottom
            cert_text_x = qr_x - 20  # Position text to the left of QR code
            cert_text_y = qr_y - 10  # Text below QR code
        else:
            # For portrait
            qr_x = page_width - 150  # 150 points from right edge
            qr_y = 80  # 80 points from bottom
            cert_text_x = qr_x - 30  # Adjust text position
            cert_text_y = qr_y - 25
            
        c.drawImage(qr_image, qr_x, qr_y, width=100, height=100)
        
        # Add certificate number
        c.setFont("Helvetica", 10)
        c.drawString(cert_text_x, cert_text_y, f"Certificate ID: {cert_number}")
        
        c.save()

        # Merge QR code and certificate number
        qr_cert_pdf = PdfReader(BytesIO(qr_cert_buffer.getvalue()))
        final_writer = PdfWriter()
        for page_num in range(len(pdf_writer.pages)):
            page = pdf_writer.pages[page_num]
            if page_num == 0:
                page.merge_page(qr_cert_pdf.pages[0])
            final_writer.add_page(page)

        # Save the final PDF to buffer
        final_writer.write(buffer)
        buffer.seek(0)

        # Create certificate record
        certificate, created = Certificate.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'template': template,
                'certificate_number': cert_number,
                'verification_url': verification_url,
                'issued_date': timezone.now()
            }
        )
        if not created:
            serializer = CertificateSerializer(certificate)
            return Response(serializer.data)

        # Save PDF to certificate
        pdf = buffer.getvalue()
        certificate.pdf_file.save(
            f"certificate_{certificate.certificate_number}.pdf",
            ContentFile(pdf)
        )
        certificate.save()

        serializer = CertificateSerializer(certificate)
        from notifications.signals import create_certificate_notification
        create_certificate_notification(certificate)
        
        return Response(serializer.data)

class CertificateTemplateListCreateView(generics.ListCreateAPIView):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAuthenticated]  

# certificates/views.py
class CertificateTemplateDeleteView(generics.DestroyAPIView):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def perform_destroy(self, instance):
        instance.template_file.delete()
        super().perform_destroy(instance)

class UserCertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Certificate.objects.filter(user=self.request.user).select_related('course')
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

class VerifyCertificateView(generics.RetrieveAPIView):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    lookup_field = 'certificate_number'
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get the full user and course details
        user = instance.user
        course = instance.course
        
        # Format the response to match frontend expectations
        response_data = {
            "certificate": {
                "id": str(instance.id),
                "user": {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email
                },
                "course": {
                    "title": course.title,
                    "description": course.description
                },
                "issued_date": instance.issued_date,
                "certificate_number": instance.certificate_number,
                "verification_url": instance.verification_url,
                "pdf_file": instance.pdf_file.url if instance.pdf_file else None,
                "valid": True
            }
        }
        
        return Response(response_data)
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