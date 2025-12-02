from django.db import models
from core.models import TenantAwareModel

class Category(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class CarType(TenantAwareModel):
    name = models.CharField(max_length=50, help_text="e.g. Sedan, SUV, Truck")

    def __str__(self):
        return self.name

class Service(TenantAwareModel):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.IntegerField()
    image = models.ImageField(upload_to='service_images/', null=True, blank=True)

    def __str__(self):
        return f"{self.name}"

class ServicePrice(TenantAwareModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='prices')
    car_type = models.ForeignKey(CarType, on_delete=models.CASCADE, related_name='service_prices')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.IntegerField(blank=True, null=True, help_text="Override duration for this car type")

    class Meta:
        unique_together = ('service', 'car_type')

    def __str__(self):
        return f"{self.service.name} ({self.car_type.name}) - {self.price}"
