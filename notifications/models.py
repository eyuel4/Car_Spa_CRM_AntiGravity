from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel
from customers.models import Customer
from billing.models import Receipt, Invoice

class NotificationChannel(TenantAwareModel):
    CHANNEL_TYPE_CHOICES = (
        ('WHATSAPP', 'WhatsApp'),
        ('TELEGRAM', 'Telegram'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    )
    
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    api_credentials = models.JSONField(default=dict, help_text="Store API keys, tokens, etc.")

    class Meta:
        unique_together = ('tenant', 'channel_type')

    def __str__(self):
        return f"{self.get_channel_type_display()} ({'Active' if self.is_active else 'Inactive'})"

class Notification(TenantAwareModel):
    NOTIFICATION_TYPE_CHOICES = (
        ('RECEIPT', 'Receipt'),
        ('INVOICE', 'Invoice'),
    )
    CHANNEL_CHOICES = (
        ('WHATSAPP', 'WhatsApp'),
        ('TELEGRAM', 'Telegram'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    )
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    recipient = models.CharField(max_length=255, help_text="Phone number or email")
    
    subject = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Link to document
    receipt = models.ForeignKey(Receipt, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')

    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.customer} via {self.get_channel_display()} ({self.status})"

    def send(self):
        """Placeholder for actual sending logic"""
        # TODO: Implement actual API calls based on channel
        # For now, just mark as sent
        self.save()
        return True

class SystemNotification(TenantAwareModel):
    """
    In-app notifications for system users (Staff, Managers, Owners).
    Separate from customer notifications (SMS/Email).
    """
    NOTIFICATION_TYPE_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('SUCCESS', 'Success'),
        ('ERROR', 'Error'),
    )
    
    CATEGORY_CHOICES = (
        # Jobs
        ('JOB_CREATED', 'Job Created'),
        ('JOB_ASSIGNED', 'Job Assigned'),
        ('JOB_STARTED', 'Job Started'),
        ('JOB_COMPLETED', 'Job Completed'),
        ('JOB_CANCELLED', 'Job Cancelled'),
        
        # Payments
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('INVOICE_GENERATED', 'Invoice Generated'),
        ('PAYMENT_DUE', 'Payment Due'),
        
        # Inventory
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
        ('STOCK_REPLENISHED', 'Stock Replenished'),
        
        # Customer
        ('NEW_CUSTOMER', 'New Customer'),
        ('LOYALTY_MILESTONE', 'Loyalty Milestone'),
        ('LOYALTY_REWARD_EARNED', 'Loyalty Reward Earned'),
        
        # System
        ('SYSTEM_ALERT', 'System Alert'),
        ('SYSTEM_ERROR', 'System Error'),
        ('SYSTEM_UPDATE', 'System Update'),
    )

    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='system_notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES, default='INFO')
from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel
from customers.models import Customer
from billing.models import Receipt, Invoice

class NotificationChannel(TenantAwareModel):
    CHANNEL_TYPE_CHOICES = (
        ('WHATSAPP', 'WhatsApp'),
        ('TELEGRAM', 'Telegram'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    )
    
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    api_credentials = models.JSONField(default=dict, help_text="Store API keys, tokens, etc.")

    class Meta:
        unique_together = ('tenant', 'channel_type')

    def __str__(self):
        return f"{self.get_channel_type_display()} ({'Active' if self.is_active else 'Inactive'})"

class Notification(TenantAwareModel):
    NOTIFICATION_TYPE_CHOICES = (
        ('RECEIPT', 'Receipt'),
        ('INVOICE', 'Invoice'),
    )
    CHANNEL_CHOICES = (
        ('WHATSAPP', 'WhatsApp'),
        ('TELEGRAM', 'Telegram'),
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    )
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    recipient = models.CharField(max_length=255, help_text="Phone number or email")
    
    subject = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Link to document
    receipt = models.ForeignKey(Receipt, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')

    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.customer} via {self.get_channel_display()} ({self.status})"

    def send(self):
        """Placeholder for actual sending logic"""
        # TODO: Implement actual API calls based on channel
        # For now, just mark as sent
        self.save()
        return True

class SystemNotification(TenantAwareModel):
    """
    In-app notifications for system users (Staff, Managers, Owners).
    Separate from customer notifications (SMS/Email).
    """
    NOTIFICATION_TYPE_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('SUCCESS', 'Success'),
        ('ERROR', 'Error'),
    )
    
    CATEGORY_CHOICES = (
        # Jobs
        ('JOB_CREATED', 'Job Created'),
        ('JOB_ASSIGNED', 'Job Assigned'),
        ('JOB_STARTED', 'Job Started'),
        ('JOB_COMPLETED', 'Job Completed'),
        ('JOB_CANCELLED', 'Job Cancelled'),
        
        # Payments
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('INVOICE_GENERATED', 'Invoice Generated'),
        ('PAYMENT_DUE', 'Payment Due'),
        
        # Inventory
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
        ('STOCK_REPLENISHED', 'Stock Replenished'),
        
        # Customer
        ('NEW_CUSTOMER', 'New Customer'),
        ('LOYALTY_MILESTONE', 'Loyalty Milestone'),
        ('LOYALTY_REWARD_EARNED', 'Loyalty Reward Earned'),
        
        # System
        ('SYSTEM_ALERT', 'System Alert'),
        ('SYSTEM_ERROR', 'System Error'),
        ('SYSTEM_UPDATE', 'System Update'),
    )

    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='system_notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES, default='INFO')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, null=True, blank=True, help_text="Business-specific notification category")
    link = models.CharField(max_length=255, blank=True, null=True, help_text="Optional link to navigate to")
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient} ({'Read' if self.is_read else 'Unread'})"


class RoleNotificationPreference(TenantAwareModel):
    """
    Role-based notification preferences - configurable by admin only.
    Determines which notification categories are enabled for each role.
    """
    
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    # Job notifications
    job_created_enabled = models.BooleanField(default=True)
    job_assigned_enabled = models.BooleanField(default=True)
    job_started_enabled = models.BooleanField(default=True)
    job_completed_enabled = models.BooleanField(default=True)
    job_cancelled_enabled = models.BooleanField(default=True)
    
    # Payment notifications
    payment_received_enabled = models.BooleanField(default=True)
    payment_failed_enabled = models.BooleanField(default=True)
    invoice_generated_enabled = models.BooleanField(default=True)
    payment_due_enabled = models.BooleanField(default=True)
    
    # Inventory notifications
    low_stock_enabled = models.BooleanField(default=True)
    out_of_stock_enabled = models.BooleanField(default=True)
    stock_replenished_enabled = models.BooleanField(default=False)
    
    # Customer notifications
    new_customer_enabled = models.BooleanField(default=True)
    loyalty_milestone_enabled = models.BooleanField(default=True)
    loyalty_reward_earned_enabled = models.BooleanField(default=False)
    
    # System notifications
    system_alert_enabled = models.BooleanField(default=True)
    system_error_enabled = models.BooleanField(default=True)
    system_update_enabled = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'role_notification_preferences'
        unique_together = [['tenant', 'role']]
        verbose_name = 'Role Notification Preference'
        verbose_name_plural = 'Role Notification Preferences'
        ordering = ['role']
    
    def __str__(self):
        return f"{self.get_role_display()} - {self.tenant.name if self.tenant else 'No Tenant'}"