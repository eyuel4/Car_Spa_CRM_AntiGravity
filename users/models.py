from django.contrib.auth.models import AbstractUser
from django.db import models
from tenants.models import Tenant

class User(AbstractUser):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('FRONT_DESK', 'Front Desk'),
        ('WORKER', 'Worker'),
        ('STAFF', 'Staff'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
