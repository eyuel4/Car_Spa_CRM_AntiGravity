from django.db import models


class CarMake(models.Model):
    """
    Global car manufacturer/brand reference data.
    Shared across all tenants - not tenant-specific.
    """
    name = models.CharField(max_length=100, unique=True)
    logo_url = models.URLField(max_length=500, blank=True, help_text="URL to brand logo image")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        db_table = 'car_makes'
        verbose_name = 'Car Make'
        verbose_name_plural = 'Car Makes'

    def __str__(self):
        return self.name


class CarModel(models.Model):
    """
    Global car model reference data.
    Shared across all tenants - not tenant-specific.
    """
    make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name='models')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['make__name', 'name']
        unique_together = [['make', 'name']]
        db_table = 'car_models'
        verbose_name = 'Car Model'
        verbose_name_plural = 'Car Models'

    def __str__(self):
        return f"{self.make.name} {self.name}"
