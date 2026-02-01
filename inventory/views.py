from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from inventory.models import Product, StockLog, Supplier
from inventory.serializers import ProductSerializer, StockLogSerializer, SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Suppliers"""
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_name', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return Supplier.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product/Inventory management.
    
    Custom actions:
    - stock_logs: Get stock history for a product
    - restock: Add stock to a product
    - low_stock: Get products with low stock
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['unit', 'category', 'supplier']
    search_fields = ['name', 'sku']
    ordering_fields = ['name', 'current_stock', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        return Product.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def stock_logs(self, request, pk=None):
        """Get stock history for this product"""
        product = self.get_object()
        logs = product.stock_logs.all().order_by('-created_at')[:50]  # Last 50 logs
        serializer = StockLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Add stock to a product"""
        product = self.get_object()
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Restock')
        
        if not amount or float(amount) <= 0:
            return Response(
                {'error': 'Amount must be a positive number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount = float(amount)
        
        # Update stock
        product.current_stock += amount
        product.save()
        
        # Create log
        StockLog.objects.create(
            tenant=request.user.tenant,
            product=product,
            change_amount=amount,
            reason=reason
        )
        
        serializer = self.get_serializer(product)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock (at or below reorder level)"""
        products = self.get_queryset().filter(
            current_stock__lte=models.F('reorder_level')
        )
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class StockLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock logs (read-only)"""
    serializer_class = StockLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return StockLog.objects.filter(tenant=self.request.user.tenant).select_related('product')
