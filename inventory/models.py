from django.db import models
from core.models import TenantAwareModel
from services.models import Service

class Product(TenantAwareModel):
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, help_text="e.g. ml, pcs, liters")
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=10)

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
