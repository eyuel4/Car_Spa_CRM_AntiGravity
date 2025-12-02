from rest_framework import serializers
from notifications.models import Notification, NotificationChannel, SystemNotification, RoleNotificationPreference


class NotificationChannelSerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source='get_channel_type_display', read_only=True)
    
    class Meta:
        model = NotificationChannel
        fields = ['id', 'channel_type', 'channel_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
        # Don't expose api_credentials for security


class NotificationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    channel_name = serializers.CharField(source='get_channel_display', read_only=True)
    notification_type_name = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'customer', 'customer_name', 'notification_type', 'notification_type_name',
            'channel', 'channel_name', 'recipient', 'subject', 'message',
            'status', 'sent_at', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'sent_at', 'error_message', 'created_at']
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"


class SystemNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemNotification
        fields = ['id', 'title', 'message', 'is_read', 'notification_type', 'category', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']


class RoleNotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleNotificationPreference
        fields = '__all__'
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
