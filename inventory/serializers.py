from rest_framework import serializers
from inventory.models import Product, StockLog, ServiceProductRequirement, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_name', 'email', 'phone', 'address', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    stock_status = serializers.SerializerMethodField()
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'category', 'unit', 
            'current_stock', 'reorder_level', 'price', 'supplier', 'supplier_name',
            'stock_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_stock_status(self, obj):
        if obj.current_stock <= obj.reorder_level:
            return 'LOW'
        elif obj.current_stock <= obj.reorder_level * 1.5:
            return 'MEDIUM'
        return 'GOOD'


class StockLogSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = StockLog
        fields = ['id', 'product', 'product_name', 'change_amount', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class ServiceProductRequirementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = ServiceProductRequirement
        fields = ['id', 'service', 'service_name', 'product', 'product_name', 'quantity_required']
        read_only_fields = ['id']
