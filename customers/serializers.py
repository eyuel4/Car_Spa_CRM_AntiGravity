from rest_framework import serializers
from customers.models import Customer, Car, CorporateProfile, Driver
from car_references.serializers import CarMakeSerializer, CarModelSerializer
from loyalty.serializers import LoyaltyTierSerializer


class CarSerializer(serializers.ModelSerializer):
    """Serializer for Car model with car reference support"""
    make_details = CarMakeSerializer(source='make', read_only=True)
    model_details = CarModelSerializer(source='model', read_only=True)
    make_name = serializers.CharField(source='make.name', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    
    class Meta:
        model = Car
        fields = [
            'id', 'customer', 'make', 'model', 'make_details', 'model_details',
            'make_name', 'model_name', 'make_text', 'model_text',
            'car_type', 'plate_number', 'year', 'color', 'mileage',
            'corporate_car_id', 'is_deleted', 'deleted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'is_deleted', 'deleted_at', 'created_at', 'updated_at']


class CarCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating cars"""
    class Meta:
        model = Car
        fields = [
            'make', 'model', 'make_text', 'model_text', 'car_type',
            'plate_number', 'year', 'color', 'mileage', 'corporate_car_id'
        ]
    
    def validate(self, data):
        # Ensure either FK or text fields are provided
        if not data.get('make') and not data.get('make_text'):
            raise serializers.ValidationError("Either make or make_text must be provided")
        if not data.get('model') and not data.get('model_text'):
            raise serializers.ValidationError("Either model or model_text must be provided")
        return data


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
    """Lightweight serializer for list views with loyalty info"""
    full_name = serializers.CharField(read_only=True)
    current_tier_name = serializers.CharField(source='current_tier.name', read_only=True)
    car_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'full_name', 'phone_number', 'email',
            'loyalty_points', 'current_tier_name', 'car_count',
            'visit_count', 'last_visit', 'created_at'
        ]
        read_only_fields = ['id', 'visit_count', 'last_visit', 'created_at']
    
    def get_car_count(self, obj):
        return obj.cars.filter(is_deleted=False).count()


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested relationships and loyalty info"""
    cars = CarSerializer(many=True, read_only=True)
    corporate_profile = CorporateProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    current_tier_details = LoyaltyTierSerializer(source='current_tier', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            # Common fields
            'id', 'customer_type', 'phone_number', 'email', 'address',
            'house_number', 'state', 'country', 'qr_code',
            # Individual fields
            'first_name', 'last_name', 'full_name', 'date_of_birth', 'sex',
            # Corporate fields
            'company_name', 'tin_number',
            # Loyalty fields
            'loyalty_points', 'total_lifetime_points', 'current_tier',
            'current_tier_details', 'tier_achieved_date',
            # Legacy
            'is_corporate', 'visit_count', 'last_visit',
            # Relationships
            'cars', 'corporate_profile',
            # Timestamps
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'qr_code', 'loyalty_points', 'total_lifetime_points',
            'current_tier', 'tier_achieved_date', 'visit_count', 'last_visit',
            'created_at', 'updated_at'
        ]


class IndividualCustomerOnboardingSerializer(serializers.Serializer):
    """Serializer for individual customer onboarding"""
    # Customer info
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    house_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, default='Ethiopia')
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    sex = serializers.ChoiceField(choices=Customer.SEX_CHOICES, required=False, allow_blank=True)
    
    # Car info
    car_type = serializers.ChoiceField(choices=Car.CAR_TYPE_CHOICES)
    car_make = serializers.IntegerField(required=False, allow_null=True)  # FK to CarMake
    car_model = serializers.IntegerField(required=False, allow_null=True)  # FK to CarModel
    car_make_text = serializers.CharField(max_length=100, required=False, allow_blank=True)
    car_model_text = serializers.CharField(max_length=100, required=False, allow_blank=True)
    plate_number = serializers.CharField(max_length=20)
    year = serializers.IntegerField(required=False, allow_null=True)
    color = serializers.CharField(max_length=50, required=False, allow_blank=True)
    mileage = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        # Ensure either FK or text fields for car make/model
        if not data.get('car_make') and not data.get('car_make_text'):
            raise serializers.ValidationError("Either car_make or car_make_text must be provided")
        if not data.get('car_model') and not data.get('car_model_text'):
            raise serializers.ValidationError("Either car_model or car_model_text must be provided")
        return data


class CorporateCustomerOnboardingSerializer(serializers.Serializer):
    """Serializer for corporate customer onboarding"""
    # Corporate info
    company_name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    house_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, default='Ethiopia')
    tin_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Cars (multiple)
    cars = serializers.ListField(child=serializers.DictField(), min_length=1)
    
    def validate_cars(self, value):
        """Validate each car in the list"""
        for car_data in value:
            if 'plate_number' not in car_data:
                raise serializers.ValidationError("Each car must have a plate_number")
            # Ensure either FK or text fields
            if not car_data.get('make') and not car_data.get('make_text'):
                raise serializers.ValidationError("Each car must have either make or make_text")
            if not car_data.get('model') and not car_data.get('model_text'):
                raise serializers.ValidationError("Each car must have either model or model_text")
        return value


class LoyaltyAdjustmentSerializer(serializers.Serializer):
    """Serializer for manual loyalty point adjustments"""
    points = serializers.IntegerField(help_text="Can be positive or negative")
    reason = serializers.CharField()
    transaction_type = serializers.ChoiceField(
        choices=[
            ('EARNED', 'Earned'),
            ('ADJUSTMENT', 'Manual Adjustment'),
            ('REDEEMED', 'Redeemed'),
            ('BONUS', 'Bonus'),
            ('PENALTY', 'Penalty'),
        ],
        default='ADJUSTMENT'
    )
