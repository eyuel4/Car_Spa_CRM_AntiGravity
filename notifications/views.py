from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from notifications.models import Notification, NotificationChannel, SystemNotification, RoleNotificationPreference
from notifications.serializers import NotificationSerializer, NotificationChannelSerializer, SystemNotificationSerializer, RoleNotificationPreferenceSerializer
from notifications.utils import DEFAULT_ROLE_PREFERENCES


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notifications.
    
    Custom actions:
    - mark_read: Mark notification as read (future feature)
    """
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'notification_type', 'channel', 'status']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer')
    
    def perform_create(self, serializer):
        notification = serializer.save(tenant=self.request.user.tenant)
        # Automatically send notification after creation
        notification.send()
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend a failed notification"""
        notification = self.get_object()
        
        if notification.status == 'SENT':
            return Response(
                {'error': 'Notification already sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and try sending again
        notification.status = 'PENDING'
        notification.error_message = None
        notification.save()
        
        success = notification.send()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)


class NotificationChannelViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification Channels configuration"""
    serializer_class = NotificationChannelSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['channel_type', 'is_active']
    
    def get_queryset(self):
        return NotificationChannel.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class SystemNotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for System Notifications (In-App).
    """
    serializer_class = SystemNotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'category']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        # Users can only see their own notifications
        return SystemNotification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})


class RoleNotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    Admin-only endpoint for managing role-based notification preferences.
    Only OWNER and MANAGER roles can access this.
    """
    serializer_class = RoleNotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only allow OWNER and MANAGER to access
        if self.request.user.role not in ['OWNER', 'MANAGER']:
            return RoleNotificationPreference.objects.none()
        return RoleNotificationPreference.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        # Only OWNER and MANAGER can create
        if self.request.user.role not in ['OWNER', 'MANAGER']:
            return Response(
                {'error': 'Only admins can configure notification preferences'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def initialize_defaults(self, request):
        """Initialize default preferences for all roles"""
        if request.user.role not in ['OWNER', 'MANAGER']:
            return Response(
                {'error': 'Only admins can initialize preferences'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        created_prefs = []
        for role, defaults in DEFAULT_ROLE_PREFERENCES.items():
            prefs, created = RoleNotificationPreference.objects.get_or_create(
                tenant=request.user.tenant,
                role=role,
                defaults=defaults
            )
            if created:
                created_prefs.append(prefs)
        
        serializer = self.get_serializer(created_prefs, many=True)
        return Response({
            'message': f'Initialized {len(created_prefs)} role preferences',
            'preferences': serializer.data
        })

    @action(detail=False, methods=['get'])
    def configuration(self, request):
        """
        Return the schema/configuration for notification settings UI.
        This allows the frontend to render the settings dynamically.
        """
        # Define the structure of settings
        # This maps the display categories to the actual model fields
        schema = [
            {
                "category": "Job Updates",
                "items": [
                    {"key": "job_created_enabled", "label": "Job Created"},
                    {"key": "job_assigned_enabled", "label": "Job Assigned"},
                    {"key": "job_started_enabled", "label": "Job Started"},
                    {"key": "job_completed_enabled", "label": "Job Completed"},
                    {"key": "job_cancelled_enabled", "label": "Job Cancelled"},
                ]
            },
            {
                "category": "Payments & Billing",
                "items": [
                    {"key": "payment_received_enabled", "label": "Payment Received"},
                    {"key": "payment_failed_enabled", "label": "Payment Failed"},
                    {"key": "invoice_generated_enabled", "label": "Invoice Generated"},
                    {"key": "payment_due_enabled", "label": "Payment Due"},
                ]
            },
            {
                "category": "Inventory",
                "items": [
                    {"key": "low_stock_enabled", "label": "Low Stock Alert"},
                    {"key": "out_of_stock_enabled", "label": "Out of Stock Alert"},
                    {"key": "stock_replenished_enabled", "label": "Stock Replenished"},
                ]
            },
            {
                "category": "Customers & Loyalty",
                "items": [
                    {"key": "new_customer_enabled", "label": "New Customer"},
                    {"key": "loyalty_milestone_enabled", "label": "Loyalty Milestone"},
                    {"key": "loyalty_reward_earned_enabled", "label": "Reward Earned"},
                ]
            },
            {
                "category": "System",
                "items": [
                    {"key": "system_alert_enabled", "label": "System Alerts"},
                    {"key": "system_error_enabled", "label": "System Errors"},
                    {"key": "system_update_enabled", "label": "System Updates"},
                ]
            }
        ]
        return Response(schema)
