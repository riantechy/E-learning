from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from reportlab.lib.pagesizes import letter
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Certificate, CertificateTemplate
from .serializers import CertificateTemplateSerializer, CertificateSerializer
from reportlab.pdfgen import canvas
from io import BytesIO
from django.core.files.base import ContentFile
from .models import Certificate, CertificateTemplate
from courses.models import Course
from users.models import User
import uuid

class GenerateCertificateView(generics.GenericAPIView):
    def post(self, request, course_id):
        user = request.user
        course = Course.objects.get(id=course_id)
        
        # Check if user has completed course requirements
        from courses.models import UserProgress
        progress = UserProgress.get_course_progress(user, course)
        
        if progress['percentage'] < 100:
            return Response(
                {"detail": "Course not completed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if certificate already exists
        if Certificate.objects.filter(user=user, course=course).exists():
            return Response(
                {"detail": "Certificate already issued"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate certificate
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Customize this with your certificate design
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(300, 650, "Certificate of Completion")
        c.setFont("Helvetica", 18)
        c.drawCentredString(300, 600, f"This certifies that {user.get_full_name()}")
        c.drawCentredString(300, 570, f"has successfully completed the course")
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(300, 530, course.title)
        c.setFont("Helvetica", 14)
        c.drawCentredString(300, 500, f"on {timezone.now().strftime('%B %d, %Y')}")
        
        c.save()
        
        # Create certificate record
        certificate = Certificate.objects.create(
            user=user,
            course=course,
            certificate_number=str(uuid.uuid4())[:8].upper(),
            verification_url=f"https://yourplatform.com/verify/{uuid.uuid4()}"
        )
        
        # Save PDF
        pdf = buffer.getvalue()
        certificate.pdf_file.save(f"certificate_{certificate.certificate_number}.pdf", ContentFile(pdf))
        certificate.save()
        
        return Response({
            "certificate_id": certificate.id,
            "download_url": certificate.pdf_file.url
        })

class CertificateTemplateListCreateView(generics.ListCreateAPIView):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAdminUser]  

class UserCertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)

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