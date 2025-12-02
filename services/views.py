from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from services.models import Service, Category, CarType, ServicePrice
from services.serializers import (
    ServiceListSerializer, ServiceDetailSerializer,
    CategorySerializer, CarTypeSerializer, ServicePriceSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Service Categories"""
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        return Category.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class CarTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for Car Types"""
    serializer_class = CarTypeSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['name']
    
    def get_queryset(self):
        return CarType.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Services with dynamic pricing.
    
    Custom actions:
    - pricing: Get pricing for all car types
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        return Service.objects.filter(tenant=self.request.user.tenant).select_related('category').prefetch_related('prices')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceListSerializer
        return ServiceDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def pricing(self, request, pk=None):
        """Get pricing for all car types for this service"""
        service = self.get_object()
        prices = service.prices.all().select_related('car_type')
        serializer = ServicePriceSerializer(prices, many=True)
        
        # Include base price as fallback
        return Response({
            'base_price': service.price,
            'base_duration': service.duration_minutes,
            'car_type_pricing': serializer.data
        })
