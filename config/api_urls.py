from django.urls import path, include
from rest_framework.routers import DefaultRouter
from customers.views import CustomerViewSet, CarViewSet
from staff.views import StaffViewSet
from services.views import ServiceViewSet, CategoryViewSet, CarTypeViewSet
from operations.views import JobViewSet, JobTaskViewSet
from operations.visit_views import VisitViewSet
from operations.qc_views import QCChecklistItemViewSet, JobQCRecordViewSet
from inventory.views import ProductViewSet, StockLogViewSet, SupplierViewSet
from billing.views import (
    ReceiptViewSet, InvoiceViewSet, PaymentViewSet,
    TaxConfigurationViewSet, DiscountViewSet
)
from loyalty.views import CustomerLoyaltyViewSet, RedemptionOptionViewSet, LoyaltyTierViewSet
from notifications.views import NotificationViewSet, NotificationChannelViewSet, SystemNotificationViewSet, RoleNotificationPreferenceViewSet
from tenants.views import ShopViewSet, TenantViewSet
from car_references.views import CarMakeViewSet, CarModelViewSet
from core.views import DashboardStatsView

# Create router and register viewsets
router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'cars', CarViewSet, basename='car')
router.register(r'car-makes', CarMakeViewSet, basename='car-make')
router.register(r'car-models', CarModelViewSet, basename='car-model')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'car-types', CarTypeViewSet, basename='cartype')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'tasks', JobTaskViewSet, basename='task')
router.register(r'qc-checklist', QCChecklistItemViewSet, basename='qcchecklist')
router.register(r'qc-records', JobQCRecordViewSet, basename='qcrecord')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'stock-logs', StockLogViewSet, basename='stocklog')
router.register(r'receipts', ReceiptViewSet, basename='receipt')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'tax-config', TaxConfigurationViewSet, basename='taxconfig')
router.register(r'discounts', DiscountViewSet, basename='discount')
router.register(r'loyalty', CustomerLoyaltyViewSet, basename='loyalty')
router.register(r'redemption-options', RedemptionOptionViewSet, basename='redemption')
router.register(r'loyalty-tiers', LoyaltyTierViewSet, basename='loyaltytier')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-channels', NotificationChannelViewSet, basename='notificationchannel')
router.register(r'system-notifications', SystemNotificationViewSet, basename='system-notification')
router.register(r'role-notification-preferences', RoleNotificationPreferenceViewSet, basename='role-notification-preferences')
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'tenants', TenantViewSet, basename='tenant')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
