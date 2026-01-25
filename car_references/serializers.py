from rest_framework import serializers
from car_references.models import CarMake, CarModel


class CarMakeSerializer(serializers.ModelSerializer):
    """Serializer for car makes"""
    models_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CarMake
        fields = ['id', 'name', 'logo_url', 'is_active', 'models_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()


class CarModelSerializer(serializers.ModelSerializer):
    """Serializer for car models"""
    make_name = serializers.CharField(source='make.name', read_only=True)
    make_logo = serializers.CharField(source='make.logo_url', read_only=True)
    
    class Meta:
        model = CarModel
        fields = ['id', 'make', 'make_name', 'make_logo', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CarModelListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing models"""
    class Meta:
        model = CarModel
        fields = ['id', 'name']
