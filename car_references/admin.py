from django.contrib import admin
from car_references.models import CarMake, CarModel


@admin.register(CarMake)
class CarMakeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['name']


@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'make', 'is_active', 'created_at']
    list_filter = ['make', 'is_active']
    search_fields = ['name', 'make__name']
    ordering = ['make__name', 'name']
    autocomplete_fields = ['make']
