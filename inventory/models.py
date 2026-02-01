from django.db import models
from core.models import TenantAwareModel
from services.models import Service

class Supplier(TenantAwareModel):
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Product(TenantAwareModel):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True, default='')
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, default='General')
    unit = models.CharField(max_length=20, help_text="e.g. ml, pcs, liters")
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Cost price per unit")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"

class ServiceProductRequirement(TenantAwareModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='product_requirements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='service_requirements')
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity used per service")

    def __str__(self):
        return f"{self.service.name} needs {self.quantity_required} {self.product.unit} of {self.product.name}"

class StockLog(TenantAwareModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='logs')
    change_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Negative for usage, Positive for restock")
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name}: {self.change_amount}"
