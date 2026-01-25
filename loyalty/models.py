from django.db import models
from django.utils import timezone
from datetime import timedelta
from core.models import TenantAwareModel
from customers.models import Customer
from operations.models import Job
from services.models import Service

class LoyaltyConfiguration(TenantAwareModel):
    points_per_dollar = models.DecimalField(max_digits=5, decimal_places=2, default=1, help_text="Points earned per dollar spent")
    points_expiry_days = models.IntegerField(blank=True, null=True, help_text="Days until points expire (null = never)")

    def __str__(self):
        return f"Loyalty Config - {self.points_per_dollar} pts/$"

class LoyaltyTier(TenantAwareModel):
    TIER_CHOICES = (
        ('BRONZE', 'Bronze'),
        ('SILVER', 'Silver'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    )
    
    name = models.CharField(max_length=20, choices=TIER_CHOICES)
    min_points_required = models.IntegerField(help_text="Minimum total points to achieve this tier")
    points_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.0, help_text="e.g. 1.5 for 50% bonus")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Tier-specific discount %")

    class Meta:
        ordering = ['min_points_required']

    def __str__(self):
        return f"{self.get_name_display()} ({self.min_points_required}+ pts)"

class CustomerLoyalty(TenantAwareModel):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='loyalty')
    current_tier = models.ForeignKey(LoyaltyTier, on_delete=models.SET_NULL, null=True, blank=True, related_name='legacy_customers')
    total_points = models.IntegerField(default=0, help_text="Lifetime points earned")
    available_points = models.IntegerField(default=0, help_text="Points available for redemption")
    tier_achieved_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.customer} - {self.available_points} pts"

class PointTransaction(TenantAwareModel):
    TRANSACTION_TYPE_CHOICES = (
        ('EARNED', 'Earned'),
        ('REDEEMED', 'Redeemed'),
        ('EXPIRED', 'Expired'),
    )
    
    customer_loyalty = models.ForeignKey(CustomerLoyalty, on_delete=models.CASCADE, related_name='transactions')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='loyalty_transactions')
    points = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    expires_at = models.DateField(blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.transaction_type}: {self.points} pts"


class LoyaltyTransaction(TenantAwareModel):
    """
    Manual loyalty point adjustments by admins/owners.
    Separate from automatic point transactions.
    """
    TRANSACTION_TYPE_CHOICES = (
        ('EARNED', 'Earned'),
        ('ADJUSTMENT', 'Manual Adjustment'),
        ('REDEEMED', 'Redeemed'),
        ('BONUS', 'Bonus'),
        ('PENALTY', 'Penalty'),
    )
    
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='loyalty_adjustments')
    points = models.IntegerField(help_text="Can be positive or negative")
    reason = models.TextField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='ADJUSTMENT')
    adjusted_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, help_text="Admin who made the adjustment")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Loyalty Transaction'
        verbose_name_plural = 'Loyalty Transactions'
    
    def __str__(self):
        return f"{self.customer} - {self.transaction_type}: {self.points} pts"


class RedemptionOption(TenantAwareModel):
    REDEMPTION_TYPE_CHOICES = (
        ('DISCOUNT', 'Discount'),
        ('FREE_SERVICE', 'Free Service'),
    )
    
    name = models.CharField(max_length=100)
    points_required = models.IntegerField()
    redemption_type = models.CharField(max_length=20, choices=REDEMPTION_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Discount amount if type is DISCOUNT")
    free_service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, help_text="Service if type is FREE_SERVICE")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.points_required} pts)"
