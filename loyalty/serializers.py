from rest_framework import serializers
from loyalty.models import (
    LoyaltyConfiguration, LoyaltyTier, CustomerLoyalty,
    PointTransaction, RedemptionOption
)


class LoyaltyConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyConfiguration
        fields = ['id', 'points_per_dollar', 'points_expiry_days', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoyaltyTierSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = LoyaltyTier
        fields = [
            'id', 'name', 'tier_name', 'min_points_required',
            'points_multiplier', 'discount_percentage', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = [
            'id', 'points', 'transaction_type', 'expires_at',
            'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CustomerLoyaltySerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='current_tier.get_name_display', read_only=True)
    tier_details = LoyaltyTierSerializer(source='current_tier', read_only=True)
    recent_transactions = PointTransactionSerializer(
        source='transactions',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = CustomerLoyalty
        fields = [
            'id', 'customer', 'current_tier', 'tier_name', 'tier_details',
            'total_points', 'available_points', 'tier_achieved_date',
            'recent_transactions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_points', 'available_points', 'tier_achieved_date', 'created_at', 'updated_at']


class RedemptionOptionSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='free_service.name', read_only=True, allow_null=True)
    
    class Meta:
        model = RedemptionOption
        fields = [
            'id', 'name', 'points_required', 'redemption_type',
            'discount_value', 'free_service', 'service_name', 'is_active'
        ]
        read_only_fields = ['id']
