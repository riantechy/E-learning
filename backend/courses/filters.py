import django_filters
from .models import Course

class CourseFilter(django_filters.FilterSet):
    class Meta:
        model = Course
        fields = {
            'title': ['icontains'],
            'status': ['exact'],
            'category': ['exact'],
            'duration_hours': ['gte', 'lte'],
            'is_featured': ['exact'],
        }
