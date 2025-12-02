"""
Utility functions for notification system
"""
from notifications.models import SystemNotification, RoleNotificationPreference

# Default notification preferences by role
DEFAULT_ROLE_PREFERENCES = {
    'OWNER': {
        # Owners get all notifications
        'job_created_enabled': True,
        'job_assigned_enabled': True,
        'job_started_enabled': True,
        'job_completed_enabled': True,
        'job_cancelled_enabled': True,
        'payment_received_enabled': True,
        'payment_failed_enabled': True,
        'invoice_generated_enabled': True,
        'payment_due_enabled': True,
        'low_stock_enabled': True,
        'out_of_stock_enabled': True,
        'stock_replenished_enabled': True,
        'new_customer_enabled': True,
        'loyalty_milestone_enabled': True,
        'loyalty_reward_earned_enabled': True,
        'system_alert_enabled': True,
        'system_error_enabled': True,
        'system_update_enabled': True,
    },
    'MANAGER': {
        # Managers get most notifications except some system ones
        'job_created_enabled': True,
        'job_assigned_enabled': True,
        'job_started_enabled': True,
        'job_completed_enabled': True,
        'job_cancelled_enabled': True,
        'payment_received_enabled': True,
        'payment_failed_enabled': True,
        'invoice_generated_enabled': True,
        'payment_due_enabled': True,
        'low_stock_enabled': True,
        'out_of_stock_enabled': True,
        'stock_replenished_enabled': False,
        'new_customer_enabled': True,
        'loyalty_milestone_enabled': True,
        'loyalty_reward_earned_enabled': False,
        'system_alert_enabled': True,
        'system_error_enabled': True,
        'system_update_enabled': False,
    },
    'STAFF': {
        # Staff get only job-related and critical notifications
        'job_created_enabled': False,
        'job_assigned_enabled': True,  # Only jobs assigned to them
        'job_started_enabled': True,
        'job_completed_enabled': True,
        'job_cancelled_enabled': True,
        'payment_received_enabled': False,
        'payment_failed_enabled': False,
        'invoice_generated_enabled': False,
        'payment_due_enabled': False,
        'low_stock_enabled': True,
        'out_of_stock_enabled': True,
        'stock_replenished_enabled': False,
        'new_customer_enabled': False,
        'loyalty_milestone_enabled': False,
        'loyalty_reward_earned_enabled': False,
        'system_alert_enabled': True,
        'system_error_enabled': False,
        'system_update_enabled': False,
    }
}

# Map category to preference field name
CATEGORY_FIELD_MAP = {
    'JOB_CREATED': 'job_created_enabled',
    'JOB_ASSIGNED': 'job_assigned_enabled',
    'JOB_STARTED': 'job_started_enabled',
    'JOB_COMPLETED': 'job_completed_enabled',
    'JOB_CANCELLED': 'job_cancelled_enabled',
    'PAYMENT_RECEIVED': 'payment_received_enabled',
    'PAYMENT_FAILED': 'payment_failed_enabled',
    'INVOICE_GENERATED': 'invoice_generated_enabled',
    'PAYMENT_DUE': 'payment_due_enabled',
    'LOW_STOCK': 'low_stock_enabled',
    'OUT_OF_STOCK': 'out_of_stock_enabled',
    'STOCK_REPLENISHED': 'stock_replenished_enabled',
    'NEW_CUSTOMER': 'new_customer_enabled',
    'LOYALTY_MILESTONE': 'loyalty_milestone_enabled',
    'LOYALTY_REWARD_EARNED': 'loyalty_reward_earned_enabled',
    'SYSTEM_ALERT': 'system_alert_enabled',
    'SYSTEM_ERROR': 'system_error_enabled',
    'SYSTEM_UPDATE': 'system_update_enabled',
}

# Map category to notification type
CATEGORY_TYPE_MAP = {
    'JOB_CREATED': 'INFO',
    'JOB_ASSIGNED': 'INFO',
    'JOB_STARTED': 'INFO',
    'JOB_COMPLETED': 'SUCCESS',
    'JOB_CANCELLED': 'WARNING',
    'PAYMENT_RECEIVED': 'SUCCESS',
    'PAYMENT_FAILED': 'ERROR',
    'INVOICE_GENERATED': 'INFO',
    'PAYMENT_DUE': 'WARNING',
    'LOW_STOCK': 'WARNING',
    'OUT_OF_STOCK': 'ERROR',
    'STOCK_REPLENISHED': 'SUCCESS',
    'NEW_CUSTOMER': 'INFO',
    'LOYALTY_MILESTONE': 'SUCCESS',
    'LOYALTY_REWARD_EARNED': 'SUCCESS',
    'SYSTEM_ALERT': 'WARNING',
    'SYSTEM_ERROR': 'ERROR',
    'SYSTEM_UPDATE': 'INFO',
}


def get_type_from_category(category):
    """Map category to notification type"""
    return CATEGORY_TYPE_MAP.get(category, 'INFO')


def create_notification_if_enabled(user, category, title, message, link=None):
    """
    Create notification only if enabled for user's role.
    
    Args:
        user: User instance (recipient)
        category: Notification category (e.g., 'JOB_CREATED')
        title: Notification title
        message: Notification message
        link: Optional link to navigate to
    
    Returns:
        SystemNotification instance if created, None otherwise
    """
    # Get role preferences for user's role
    try:
        prefs = RoleNotificationPreference.objects.get(
            tenant=user.tenant,
            role=user.role
        )
    except RoleNotificationPreference.DoesNotExist:
        # If no preferences exist, use defaults
        prefs_data = DEFAULT_ROLE_PREFERENCES.get(user.role, {})
        prefs = RoleNotificationPreference.objects.create(
            tenant=user.tenant,
            role=user.role,
            **prefs_data
        )
    
    # Check if this category is enabled for the user's role
    field_name = CATEGORY_FIELD_MAP.get(category)
    if field_name and getattr(prefs, field_name, True):
        # Role has this category enabled, create notification
        notification_type = get_type_from_category(category)
        return SystemNotification.objects.create(
            recipient=user,
            title=title,
            message=message,
            category=category,
            notification_type=notification_type,
            link=link,
            tenant=user.tenant
        )
    return None
