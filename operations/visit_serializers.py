from rest_framework import serializers
from operations.models import Visit, VisitService
from customers.models import Customer, Car
from services.models import Service


class VisitServiceSerializer(serializers.ModelSerializer):
    """Serializer for services within a visit"""
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = VisitService
        fields = ['id', 'service', 'service_name', 'price', 'is_addon']
        read_only_fields = ['id']


class VisitListSerializer(serializers.ModelSerializer):
    """Serializer for visit list view (queue)"""
    services = VisitServiceSerializer(source='visit_services', many=True, read_only=True)
    
    class Meta:
        model = Visit
        fields = [
            'id', 'ticket_id', 'customer_type', 'customer_name',
            'car_info', 'car_plate', 'car_type', 'phone_number',
            'status', 'services', 'subtotal', 'tax', 'total',
            'checked_in_at', 'started_at', 'completed_at', 'paid_at'
        ]
        read_only_fields = ['id', 'ticket_id', 'checked_in_at']


class VisitDetailSerializer(serializers.ModelSerializer):
    """Serializer for visit detail view"""
    services = VisitServiceSerializer(source='visit_services', many=True, read_only=True)
    
    class Meta:
        model = Visit
        fields = [
            'id', 'ticket_id', 'customer', 'customer_type', 'customer_name',
            'car', 'car_info', 'car_plate', 'car_type', 'phone_number',
            'status', 'services', 'subtotal', 'tax', 'tip', 'total',
            'payment_method', 'payment_confirmation', 'notes',
            'checked_in_at', 'started_at', 'completed_at', 'paid_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ticket_id', 'checked_in_at', 'created_at', 'updated_at']


class VisitCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating visits"""
    
    class Meta:
        model = Visit
        fields = [
            'customer', 'customer_type', 'customer_name',
            'car', 'car_info', 'car_plate', 'car_type', 'phone_number'
        ]
    
    def validate(self, data):
        """Validate that required fields are present based on customer type"""
        customer_type = data.get('customer_type', 'REGISTERED')
        
        if customer_type == 'REGISTERED':
            if not data.get('customer'):
                raise serializers.ValidationError("Customer is required for registered customer type")
        else:  # GUEST
            if not data.get('customer_name'):
                raise serializers.ValidationError("Customer name is required for guest customer type")
            if not data.get('car_info'):
                raise serializers.ValidationError("Car info is required for guest customer type")
        
        return data
    
    def create(self, validated_data):
        """Create visit and populate customer_name and car_info if not provided"""
        # If registered customer, populate name and car info from relationships
        if validated_data.get('customer') and not validated_data.get('customer_name'):
            customer = validated_data['customer']
            validated_data['customer_name'] = f"{customer.first_name} {customer.last_name}"
        
        if validated_data.get('car') and not validated_data.get('car_info'):
            car = validated_data['car']
            make_name = car.make.name if car.make else car.make_text
            model_name = car.model.name if car.model else car.model_text
            validated_data['car_info'] = f"{make_name} {model_name}"
            if not validated_data.get('car_plate'):
                validated_data['car_plate'] = car.plate_number
            if not validated_data.get('car_type'):
                validated_data['car_type'] = car.car_type
        
        return super().create(validated_data)


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results"""
    customer_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    phone = serializers.CharField()
    vehicles = serializers.ListField(child=serializers.DictField())


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for vehicle in search results"""
    make_name = serializers.SerializerMethodField()
    model_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = ['id', 'make_name', 'model_name', 'plate_number', 'car_type', 'color']
    
    def get_make_name(self, obj):
        return obj.make.name if obj.make else obj.make_text
    
    def get_model_name(self, obj):
        return obj.model.name if obj.model else obj.model_text


class AddServicesSerializer(serializers.Serializer):
    """Serializer for adding services to a visit"""
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )


class ProcessPaymentSerializer(serializers.Serializer):
    """Serializer for processing payment"""
    payment_method = serializers.ChoiceField(choices=['CASH', 'CARD', 'ACCOUNT'])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    tip = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    payment_confirmation = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ConvertToCustomerSerializer(serializers.Serializer):
    """Serializer for converting guest to customer"""
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    car_make = serializers.CharField(max_length=100, required=False)
    car_model = serializers.CharField(max_length=100, required=False)
    car_color = serializers.CharField(max_length=50, required=False)
