from django.db import models
from django.utils import timezone
from core.models import TenantAwareModel
from customers.models import Customer
from operations.models import Job

class TaxConfiguration(TenantAwareModel):
    name = models.CharField(max_length=100, help_text="e.g. VAT, Sales Tax")
    rate = models.DecimalField(max_digits=5, decimal_places=4, help_text="e.g. 0.15 for 15%")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.rate * 100}%)"

class Discount(TenantAwareModel):
    DISCOUNT_TYPE_CHOICES = (
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    )
    
    name = models.CharField(max_length=100)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage (e.g. 10) or Fixed Amount (e.g. 5.00)")
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(blank=True, null=True)
    valid_until = models.DateField(blank=True, null=True)

    def __str__(self):
        if self.discount_type == 'PERCENTAGE':
            return f"{self.name} ({self.value}%)"
        return f"{self.name} (${self.value})"

class Receipt(TenantAwareModel):
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    
    # Financial breakdown
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    issued_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Receipt #{self.receipt_number} - ${self.total}"

class Invoice(TenantAwareModel):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    )
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    
    # Billing period
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    
    # Financial breakdown
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Dates
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.customer} (${self.total})"

class InvoiceLineItem(TenantAwareModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='invoice_line_items')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.description} - ${self.amount}"

class Payment(TenantAwareModel):
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('MOBILE_TRANSFER', 'Mobile Transfer'),
        ('MOBILE_BANKING', 'Mobile Banking'),
        ('CARD', 'Card'),
        ('OTHER', 'Other'),
    )
    
    # Link to either Job (receipt payment) or Invoice (corporate payment)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='payments', blank=True, null=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments', blank=True, null=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField(default=timezone.now)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        if self.job:
            return f"Payment for Job #{self.job.id} - ${self.amount}"
        return f"Payment for Invoice #{self.invoice.invoice_number} - ${self.amount}"
