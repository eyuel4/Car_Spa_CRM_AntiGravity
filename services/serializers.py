from rest_framework import serializers
from services.models import Service, Category, CarType, ServicePrice


class CarTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarType
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ServicePriceSerializer(serializers.ModelSerializer):
    car_type_name = serializers.CharField(source='car_type.name', read_only=True)
    
    class Meta:
        model = ServicePrice
        fields = ['id', 'car_type', 'car_type_name', 'price', 'duration_minutes']
        read_only_fields = ['id']


class ServiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'category', 'category_name', 'price', 'duration_minutes', 'image', 'image_url']
        read_only_fields = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ServiceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with pricing for all car types"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    prices = ServicePriceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'category', 'category_name', 'description',
            'price', 'duration_minutes', 'prices', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
