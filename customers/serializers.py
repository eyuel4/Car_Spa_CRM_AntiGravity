from rest_framework import serializers
from customers.models import Customer, Car, CorporateProfile, Driver


class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ['id', 'make', 'model', 'plate_number', 'color', 'year', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CorporateProfileSerializer(serializers.ModelSerializer):
    drivers = DriverSerializer(many=True, read_only=True)
    
    class Meta:
        model = CorporateProfile
        fields = ['id', 'company_name', 'tax_id', 'drivers', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'full_name', 'phone_number', 'email', 'is_corporate', 'visit_count', 'last_visit']
        read_only_fields = ['id', 'visit_count', 'last_visit']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested relationships"""
    cars = CarSerializer(many=True, read_only=True)
    corporate_profile = CorporateProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'phone_number', 'email', 'address',
            'is_corporate', 'visit_count', 'last_visit', 'cars', 'corporate_profile',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'visit_count', 'last_visit', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating customers"""
    corporate_profile_data = CorporateProfileSerializer(required=False, write_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'phone_number', 'email', 'address',
            'is_corporate', 'corporate_profile_data'
        ]
    
    def create(self, validated_data):
        corporate_data = validated_data.pop('corporate_profile_data', None)
        tenant = self.context['request'].user.tenant
        
        customer = Customer.objects.create(tenant=tenant, **validated_data)
        
        if corporate_data and validated_data.get('is_corporate'):
            CorporateProfile.objects.create(
                tenant=tenant,
                customer=customer,
                **corporate_data
            )
        
        return customer
