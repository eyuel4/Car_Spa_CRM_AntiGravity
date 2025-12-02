from rest_framework import serializers
from staff.models import Staff, CompensationHistory, SalaryPayment, EmergencyContact
from tenants.serializers import ShopSerializer


class CompensationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompensationHistory
        fields = ['id', 'amount', 'effective_date', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class SalaryPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryPayment
        fields = ['id', 'amount', 'payment_date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'first_name', 'last_name', 'sex', 'phone', 'address',
            'state', 'country', 'relationship', 'is_primary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    full_name = serializers.SerializerMethodField()
    current_compensation = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'title', 'phone_number', 'is_active', 'hire_date', 'current_compensation', 'photo', 'photo_url']
        read_only_fields = ['id', 'current_compensation']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class StaffDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested relationships"""
    full_name = serializers.SerializerMethodField()
    current_compensation = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    compensation_history = CompensationHistorySerializer(many=True, read_only=True)
    salary_payments = SalaryPaymentSerializer(many=True, read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    shop = ShopSerializer(read_only=True)
    shop_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'phone_number', 'email',
            'address', 'city', 'state', 'house_number', 'country', 'date_of_birth', 'sex',
            'title', 'hire_date', 'salary', 'shop', 'shop_id', 'is_manager', 'is_active',
            'current_compensation', 'compensation_history', 'salary_payments',
            'emergency_contacts', 'photo', 'photo_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_compensation', 'created_at', 'updated_at', 'photo_url']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None
    
    def update(self, instance, validated_data):
        shop_id = validated_data.pop('shop_id', None)
        emergency_contacts_data = validated_data.pop('emergency_contacts', None)
        
        if shop_id is not None:
            from tenants.models import Shop
            try:
                instance.shop = Shop.objects.get(id=shop_id, tenant=instance.tenant)
            except Shop.DoesNotExist:
                instance.shop = None
        
        # Update staff instance
        staff = super().update(instance, validated_data)
        
        # Handle emergency contacts update if provided
        if emergency_contacts_data is not None:
            # Validate max 2 contacts
            if len(emergency_contacts_data) > 2:
                raise serializers.ValidationError({'emergency_contacts': 'Maximum 2 emergency contacts allowed.'})
            
            # Delete existing contacts
            EmergencyContact.objects.filter(tenant=instance.tenant, staff=staff).delete()
            
            # Create new contacts
            for contact_data in emergency_contacts_data:
                EmergencyContact.objects.create(tenant=instance.tenant, staff=staff, **contact_data)
        
        return staff


class StaffCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating staff with initial compensation and emergency contacts"""
    initial_compensation = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    shop_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Staff
        fields = [
            'first_name', 'last_name', 'phone_number', 'email', 'address', 'city', 'state',
            'house_number', 'country', 'date_of_birth', 'sex', 'title', 'hire_date',
            'salary', 'shop_id', 'is_manager', 'photo', 'initial_compensation', 'emergency_contacts'
        ]
    
    def create(self, validated_data):
        initial_comp = validated_data.pop('initial_compensation', None)
        emergency_contacts_data = validated_data.pop('emergency_contacts', [])
        shop_id = validated_data.pop('shop_id', None)
        tenant = self.context['request'].user.tenant
        
        # Handle shop assignment
        shop = None
        if shop_id:
            from tenants.models import Shop
            try:
                shop = Shop.objects.get(id=shop_id, tenant=tenant)
            except Shop.DoesNotExist:
                pass
        
        staff = Staff.objects.create(tenant=tenant, shop=shop, **validated_data)
        
        # Create initial compensation record if provided
        if initial_comp:
            CompensationHistory.objects.create(
                tenant=tenant,
                staff=staff,
                amount=initial_comp,
                effective_date=staff.hire_date,
                reason="Hiring"
            )
        
        # Create emergency contacts (max 2)
        for contact_data in emergency_contacts_data[:2]:
            EmergencyContact.objects.create(tenant=tenant, staff=staff, **contact_data)
        
        return staff
