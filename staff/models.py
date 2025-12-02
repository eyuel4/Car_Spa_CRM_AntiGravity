from django.db import models
from django.core.exceptions import ValidationError
from core.models import TenantAwareModel
from tenants.models import Shop

SEX_CHOICES = [
    ('MALE', 'Male'),
    ('FEMALE', 'Female'),
    ('OTHER', 'Other'),
    ('PREFER_NOT_TO_SAY', 'Prefer not to say'),
]

class Staff(TenantAwareModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    house_number = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    sex = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True, null=True)
    title = models.CharField(max_length=100)
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Current monthly salary")
    shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    is_manager = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    photo = models.ImageField(upload_to='staff_photos/', null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.title})"

    @property
    def current_compensation(self):
        latest = self.compensation_history.order_by('-effective_date').first()
        return latest.amount if latest else (self.salary or 0)

    class Meta:
        ordering = ['-created_at']

class CompensationHistory(TenantAwareModel):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='compensation_history')
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly Salary Amount")
    effective_date = models.DateField()
    reason = models.CharField(max_length=255, blank=True, null=True, help_text="e.g. Hiring, Annual Review")

    class Meta:
        ordering = ['-effective_date']

    def __str__(self):
        return f"{self.staff} - {self.amount} ({self.effective_date})"

class SalaryPayment(TenantAwareModel):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='salary_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.staff} - {self.amount} on {self.payment_date.date()}"


class EmergencyContact(TenantAwareModel):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='emergency_contacts')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    sex = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True, null=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., Spouse, Parent, Sibling")
    is_primary = models.BooleanField(default=False, help_text="Mark as primary emergency contact")

    class Meta:
        ordering = ['-is_primary', 'first_name']
        constraints = [
            models.UniqueConstraint(
                fields=['staff', 'is_primary'],
                condition=models.Q(is_primary=True),
                name='unique_primary_contact_per_staff'
            )
        ]

    def clean(self):
        # Ensure max 2 emergency contacts per staff
        if not self.pk:  # Only check on creation
            existing_count = EmergencyContact.objects.filter(
                tenant=self.tenant,
                staff=self.staff
            ).count()
            if existing_count >= 2:
                raise ValidationError('Maximum 2 emergency contacts allowed per staff member.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.staff.first_name} {self.staff.last_name}"
