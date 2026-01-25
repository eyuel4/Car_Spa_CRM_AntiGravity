from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel
import hashlib


class Customer(TenantAwareModel):
    """
    Unified customer model supporting both Individual and Corporate types.
    """
    CUSTOMER_TYPE_CHOICES = (
        ('INDIVIDUAL', 'Individual'),
        ('CORPORATE', 'Corporate'),
    )
    
    SEX_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_TO_SAY', 'Prefer not to say'),
    )
    
    # Common fields
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='INDIVIDUAL')
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    house_number = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='Ethiopia')
    qr_code = models.CharField(max_length=255, unique=True, blank=True, db_index=True)
    
    # Individual-specific fields
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    sex = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True)
    
    # Corporate-specific fields
    company_name = models.CharField(max_length=255, blank=True)
    tin_number = models.CharField(max_length=50, blank=True, help_text="Tax Identification Number")
    
    # Marketing & Classification
    is_corporate = models.BooleanField(default=False)  # Kept for backward compatibility
    visit_count = models.IntegerField(default=0)
    last_visit = models.DateTimeField(blank=True, null=True)
    
    # Loyalty fields (direct integration - no separate CustomerLoyalty model needed)
    loyalty_points = models.IntegerField(default=0, help_text="Current available loyalty points")
    total_lifetime_points = models.IntegerField(default=0, help_text="Total points ever earned")
    current_tier = models.ForeignKey('loyalty.LoyaltyTier', on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    tier_achieved_date = models.DateField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['qr_code']),
            models.Index(fields=['customer_type']),
        ]
    
    def __str__(self):
        if self.customer_type == 'CORPORATE':
            return self.company_name or f"Corporate Customer {self.id}"
        return f"{self.first_name} {self.last_name}" if self.first_name else f"Customer {self.id}"
    
    @property
    def full_name(self):
        """Returns full name for individuals or company name for corporate"""
        if self.customer_type == 'CORPORATE':
            return self.company_name
        return f"{self.first_name} {self.last_name}"
    
    def generate_qr_code(self):
        """Generate unique QR code for customer"""
        data = f"{self.tenant_id}-{self.id}-{self.phone_number}-{self.email or ''}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]
    
    def save(self, *args, **kwargs):
        # Auto-generate QR code on creation
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.qr_code:
            self.qr_code = self.generate_qr_code()
            super().save(update_fields=['qr_code'])
    
    def update_loyalty_tier(self):
        """Update customer's tier based on total lifetime points"""
        from loyalty.models import LoyaltyTier
        tier = LoyaltyTier.objects.filter(
            tenant=self.tenant,
            min_points_required__lte=self.total_lifetime_points
        ).order_by('-min_points_required').first()
        
        if tier and tier != self.current_tier:
            self.current_tier = tier
            self.tier_achieved_date = timezone.now().date()
            self.save(update_fields=['current_tier', 'tier_achieved_date'])
    
    def adjust_loyalty_points(self, points, reason, adjusted_by=None, transaction_type='ADJUSTMENT'):
        """
        Adjust loyalty points (can be positive or negative)
        Creates a LoyaltyTransaction record
        """
        from loyalty.models import LoyaltyTransaction
        
        # Update points
        self.loyalty_points += points
        if points > 0:
            self.total_lifetime_points += points
        self.save(update_fields=['loyalty_points', 'total_lifetime_points'])
        
        # Create transaction record
        LoyaltyTransaction.objects.create(
            tenant=self.tenant,
            customer=self,
            points=points,
            reason=reason,
            transaction_type=transaction_type,
            adjusted_by=adjusted_by
        )
        
        # Update tier if needed
        self.update_loyalty_tier()


class CorporateProfile(TenantAwareModel):
    """
    DEPRECATED: Kept for backward compatibility.
    New corporate customers use customer_type='CORPORATE' on Customer model.
    """
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='corporate_profile')
    company_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.company_name


class Driver(TenantAwareModel):
    """Driver associated with corporate accounts"""
    corporate_profile = models.ForeignKey(CorporateProfile, on_delete=models.CASCADE, related_name='drivers')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.first_name} {self.last_name} (Driver)"


class Car(TenantAwareModel):
    """
    Vehicle associated with a customer.
    Supports soft delete to maintain history.
    """
    CAR_TYPE_CHOICES = (
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('VAN', 'Van'),
        ('TRUCK', 'Truck'),
        ('COUPE', 'Coupe'),
        ('HATCHBACK', 'Hatchback'),
        ('WAGON', 'Wagon'),
        ('CONVERTIBLE', 'Convertible'),
        ('OTHER', 'Other'),
    )
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cars')
    
    # Car reference data (global)
    make = models.ForeignKey('car_references.CarMake', on_delete=models.PROTECT, null=True, blank=True)
    model = models.ForeignKey('car_references.CarModel', on_delete=models.PROTECT, null=True, blank=True)
    
    # Legacy text fields (kept for backward compatibility)
    make_text = models.CharField(max_length=100, blank=True, help_text="Legacy field - use make FK instead")
    model_text = models.CharField(max_length=100, blank=True, help_text="Legacy field - use model FK instead")
    
    # Car details
    car_type = models.CharField(max_length=50, choices=CAR_TYPE_CHOICES, blank=True)
    plate_number = models.CharField(max_length=20, unique=True, db_index=True)
    year = models.IntegerField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    mileage = models.IntegerField(blank=True, null=True, help_text="Current mileage")
    
    # Corporate-specific
    corporate_car_id = models.CharField(max_length=100, blank=True, help_text="Fleet ID for corporate vehicles")
    
    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['plate_number']),
            models.Index(fields=['is_deleted']),
        ]
        verbose_name = 'Car'
        verbose_name_plural = 'Cars'
    
    def __str__(self):
        make_name = self.make.name if self.make else self.make_text
        model_name = self.model.name if self.model else self.model_text
        return f"{make_name} {model_name} ({self.plate_number})"
    
    def soft_delete(self):
        """Soft delete a car"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def restore(self):
        """Restore a soft-deleted car"""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])
