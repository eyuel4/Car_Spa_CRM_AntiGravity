from django.contrib import admin
from .models import Tenant, Shop


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'email', 'phone_number', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'subdomain', 'email', 'phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'subdomain')
        }),
        ('Contact Details', {
            'fields': ('address', 'phone_number', 'email', 'website')
        }),
        ('Branding', {
            'fields': ('logo',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'phone_number', 'email', 'is_active', 'created_at')
    list_filter = ('is_active', 'tenant', 'created_at')
    search_fields = ('name', 'tenant__name', 'phone_number', 'email', 'address')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_select_related = ('tenant',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'name', 'is_active')
        }),
        ('Contact Details', {
            'fields': ('address', 'phone_number', 'email')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_shops', 'deactivate_shops']
    
    def activate_shops(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} shop(s) activated successfully.')
    activate_shops.short_description = 'Activate selected shops'
    
    def deactivate_shops(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} shop(s) deactivated successfully.')
    deactivate_shops.short_description = 'Deactivate selected shops'
