from django.db import models
from core.models import TenantAwareModel

class Customer(TenantAwareModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20) # Required by default
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Marketing & Classification
    is_corporate = models.BooleanField(default=False)
    visit_count = models.IntegerField(default=0)
    last_visit = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class CorporateProfile(TenantAwareModel):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='corporate_profile')
    company_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.company_name

class Driver(TenantAwareModel):
    corporate_profile = models.ForeignKey(CorporateProfile, on_delete=models.CASCADE, related_name='drivers')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.first_name} {self.last_name} (Driver)"

class Car(TenantAwareModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cars')
    # Optional: Link car to a specific driver if corporate? 
    # For now, keeping it simple as requested.
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    plate_number = models.CharField(max_length=20)
    color = models.CharField(max_length=50, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.plate_number})"
