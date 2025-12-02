from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from customers.models import Customer, Car
from customers.serializers import (
    CustomerListSerializer, CustomerDetailSerializer, 
    CustomerCreateSerializer, CarSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Customer CRUD operations.
    
    list: Get all customers (filtered by tenant)
    create: Create a new customer
    retrieve: Get customer details
    update: Update customer
    partial_update: Partially update customer
    destroy: Delete customer
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_corporate', 'visit_count']
    search_fields = ['first_name', 'last_name', 'phone_number', 'email']
    ordering_fields = ['created_at', 'last_visit', 'visit_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Automatic tenant filtering
        return Customer.objects.filter(tenant=self.request.user.tenant).prefetch_related('cars', 'corporate_profile')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        elif self.action == 'create':
            return CustomerCreateSerializer
        return CustomerDetailSerializer
    
    @action(detail=True, methods=['get'])
    def cars(self, request, pk=None):
        """Get all cars for a specific customer"""
        customer = self.get_object()
        cars = customer.cars.all()
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_car(self, request, pk=None):
        """Add a car to a customer"""
        customer = self.get_object()
        serializer = CarSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(tenant=request.user.tenant, customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CarViewSet(viewsets.ModelViewSet):
    """ViewSet for Car CRUD operations"""
    serializer_class = CarSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['customer', 'make', 'model']
    search_fields = ['plate_number', 'make', 'model']
    
    def get_queryset(self):
        return Car.objects.filter(tenant=self.request.user.tenant).select_related('customer')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
