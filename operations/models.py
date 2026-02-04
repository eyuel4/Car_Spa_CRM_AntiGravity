from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel
from customers.models import Customer, Car
from services.models import Service
from staff.models import Staff

# Import QC models
from operations.qc_models import QCChecklistItem, JobQCRecord, QCChecklistResponse

class Job(TenantAwareModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('QC', 'Quality Check'),
        ('COMPLETED', 'Completed'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('MOBILE_TRANSFER', 'Mobile Transfer'),
        ('MOBILE_BANKING', 'Mobile Banking'),
        ('CARD', 'Card'),
        ('OTHER', 'Other'),
    )

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    qr_code = models.ImageField(upload_to='job_qrcodes/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Job #{self.id} - {self.car} ({self.status})"

class JobItem(TenantAwareModel):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='items')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price at the time of booking")

    def __str__(self):
        return f"{self.service.name} for Job #{self.job.id}"

class JobTask(TenantAwareModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    )

    job_item = models.ForeignKey(JobItem, on_delete=models.CASCADE, related_name='tasks')
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    task_name = models.CharField(max_length=100, help_text="Specific task like 'Wash' or 'Polish'")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.task_name} - {self.staff} ({self.status})"


class Visit(TenantAwareModel):
    """
    Visit model for manager app workflow.
    Supports both registered customers and guests.
    Status flow: CHECKED_IN → IN_PROGRESS → COMPLETED_WAITING_PICKUP → PAID
    """
    STATUS_CHOICES = (
        ('CHECKED_IN', 'Checked In'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED_WAITING_PICKUP', 'Completed - Waiting Pickup'),
        ('PAID', 'Paid'),
    )
    
    CUSTOMER_TYPE_CHOICES = (
        ('REGISTERED', 'Registered'),
        ('GUEST', 'Guest'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('ACCOUNT', 'Account'),
    )
    
    # Auto-generated ticket ID
    ticket_id = models.CharField(max_length=20, unique=True, db_index=True)
    
    # Customer info (nullable for guests)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits')
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='REGISTERED')
    customer_name = models.CharField(max_length=200, help_text="Guest name or cached registered customer name")
    
    # Car info (nullable for guests)
    car = models.ForeignKey(Car, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits')
    car_info = models.CharField(max_length=200, help_text="Car description for guests or cached info")
    car_plate = models.CharField(max_length=20, blank=True, null=True)
    car_type = models.CharField(max_length=50, blank=True, null=True, help_text="SEDAN, SUV, TRUCK, VAN")
    
    # Contact
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="For SMS notifications")
    
    # Status
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='CHECKED_IN')
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tip = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    payment_confirmation = models.CharField(max_length=100, blank=True, null=True, help_text="3rd party confirmation number")
    
    # Timestamps
    checked_in_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-checked_in_at']
        indexes = [
            models.Index(fields=['ticket_id']),
            models.Index(fields=['status']),
            models.Index(fields=['customer_type']),
            models.Index(fields=['phone_number']),
        ]
    
    def __str__(self):
        return f"{self.ticket_id} - {self.customer_name} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Auto-generate ticket ID on creation
        if not self.ticket_id:
            # Get the last visit for this tenant
            last_visit = Visit.objects.filter(tenant=self.tenant).order_by('-id').first()
            if last_visit and last_visit.ticket_id.startswith('V-'):
                try:
                    last_number = int(last_visit.ticket_id.split('-')[1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            self.ticket_id = f"V-{new_number:03d}"
        
        # Update timestamps based on status
        if self.pk:
            old_visit = Visit.objects.get(pk=self.pk)
            if old_visit.status != self.status:
                if self.status == 'IN_PROGRESS' and not self.started_at:
                    self.started_at = timezone.now()
                elif self.status == 'COMPLETED_WAITING_PICKUP' and not self.completed_at:
                    self.completed_at = timezone.now()
                elif self.status == 'PAID' and not self.paid_at:
                    self.paid_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Calculate subtotal, tax, and total from services"""
        self.subtotal = sum(vs.price for vs in self.visit_services.all())
        # Tax rate: 15% (can be made configurable)
        self.tax = self.subtotal * 0.15
        self.total = self.subtotal + self.tax + self.tip
        self.save(update_fields=['subtotal', 'tax', 'total'])


class VisitService(TenantAwareModel):
    """
    Through model for Visit-Service relationship.
    Stores price at time of booking.
    """
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='visit_services')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price at time of booking")
    is_addon = models.BooleanField(default=False, help_text="True if this is an add-on service")
    
    class Meta:
        unique_together = ('visit', 'service')
    
    def __str__(self):
        return f"{self.service.name} for {self.visit.ticket_id}"
