from django.db import models
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
