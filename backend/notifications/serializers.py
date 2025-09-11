# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationPreference
from users.models import User

class NotificationSerializer(serializers.ModelSerializer):
    time_since = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
    
    def get_time_since(self, obj):
        from django.utils import timezone
        from django.utils.timesince import timesince
        return timesince(obj.created_at, timezone.now())

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ('user',)

class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    notification_preferences = NotificationPreferenceSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'notification_preferences']