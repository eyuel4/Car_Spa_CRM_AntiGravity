from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from loyalty.models import CustomerLoyalty, PointTransaction, RedemptionOption, LoyaltyTier
from loyalty.serializers import (
    CustomerLoyaltySerializer, PointTransactionSerializer,
    RedemptionOptionSerializer, LoyaltyTierSerializer
)


class CustomerLoyaltyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Customer Loyalty (read-only for customers).
    
    Custom actions:
    - me: Get current user's loyalty status
    - redeem: Redeem points for rewards
    """
    serializer_class = CustomerLoyaltySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer', 'current_tier']
    
    def get_queryset(self):
        return CustomerLoyalty.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer', 'current_tier').prefetch_related('transactions')
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's loyalty status"""
        # Assuming user has a related customer profile
        try:
            customer = request.user.customer  # Adjust based on your user-customer relationship
            loyalty = CustomerLoyalty.objects.get(
                tenant=request.user.tenant,
                customer=customer
            )
            serializer = self.get_serializer(loyalty)
            return Response(serializer.data)
        except (AttributeError, CustomerLoyalty.DoesNotExist):
            return Response(
                {'error': 'Loyalty profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        """Redeem points for a reward"""
        loyalty = self.get_object()
        redemption_option_id = request.data.get('redemption_option_id')
        
        try:
            option = RedemptionOption.objects.get(
                id=redemption_option_id,
                tenant=request.user.tenant,
                is_active=True
            )
        except RedemptionOption.DoesNotExist:
            return Response(
                {'error': 'Redemption option not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if customer has enough points
        if loyalty.available_points < option.points_required:
            return Response(
                {'error': f'Insufficient points. Required: {option.points_required}, Available: {loyalty.available_points}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deduct points
        loyalty.available_points -= option.points_required
        loyalty.save()
        
        # Create transaction
        PointTransaction.objects.create(
            tenant=request.user.tenant,
            customer_loyalty=loyalty,
            points=-option.points_required,
            transaction_type='REDEEMED',
            description=f"Redeemed: {option.name}"
        )
        
        serializer = self.get_serializer(loyalty)
        return Response({
            'message': f'Successfully redeemed {option.name}',
            'loyalty': serializer.data
        })


class RedemptionOptionViewSet(viewsets.ModelViewSet):
    """ViewSet for Redemption Options"""
    serializer_class = RedemptionOptionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'redemption_type']
    
    def get_queryset(self):
        return RedemptionOption.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('free_service')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class LoyaltyTierViewSet(viewsets.ModelViewSet):
    """ViewSet for Loyalty Tiers"""
    serializer_class = LoyaltyTierSerializer
    
    def get_queryset(self):
        return LoyaltyTier.objects.filter(tenant=self.request.user.tenant).order_by('min_points_required')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
