from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import transaction

from customers.models import Customer, Car
from customers.serializers import (
    CustomerListSerializer, CustomerDetailSerializer,
    CarSerializer, CarCreateSerializer,
    IndividualCustomerOnboardingSerializer,
    CorporateCustomerOnboardingSerializer,
    LoyaltyAdjustmentSerializer
)
from car_references.models import CarMake, CarModel


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Customer CRUD operations with enhanced search and onboarding.
    
    Features:
    - Advanced search by phone, name, plate, QR code
    - Individual customer onboarding
    - Corporate customer onboarding
    - Loyalty points adjustment
    - QR code generation
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer_type', 'is_corporate', 'visit_count', 'current_tier']
    search_fields = ['first_name', 'last_name', 'company_name', 'phone_number', 'email', 'qr_code']
    ordering_fields = ['created_at', 'last_visit', 'visit_count', 'loyalty_points']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Automatic tenant filtering with optimized queries"""
        return Customer.objects.filter(
            tenant=self.request.user.tenant
        ).select_related(
            'current_tier'
        ).prefetch_related(
            'cars', 'corporate_profile'
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerDetailSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced search endpoint supporting:
        - Phone number (exact or partial)
        - License plate (exact or partial)
        - Customer name (first/last for individuals, company for corporate)
        - QR code (exact)
        
        Query params:
        - q: search query
        - type: search type (phone, plate, name, qr, all)
        """
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')
        
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset()
        
        if search_type == 'phone':
            queryset = queryset.filter(phone_number__icontains=query)
        elif search_type == 'plate':
            queryset = queryset.filter(cars__plate_number__icontains=query, cars__is_deleted=False).distinct()
        elif search_type == 'name':
            queryset = queryset.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(company_name__icontains=query)
            )
        elif search_type == 'qr':
            queryset = queryset.filter(qr_code=query)
        else:  # 'all'
            queryset = queryset.filter(
                Q(phone_number__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(company_name__icontains=query) |
                Q(qr_code=query) |
                Q(cars__plate_number__icontains=query, cars__is_deleted=False)
            ).distinct()
        
        serializer = CustomerListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def onboard_individual(self, request):
        """
        Onboard a new individual customer with their first car.
        Creates customer and car in a single transaction.
        """
        serializer = IndividualCustomerOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tenant = request.user.tenant
        
        with transaction.atomic():
            # Create customer
            customer = Customer.objects.create(
                tenant=tenant,
                customer_type='INDIVIDUAL',
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone_number=data['phone_number'],
                email=data.get('email', ''),
                address=data.get('address', ''),
                house_number=data.get('house_number', ''),
                state=data.get('state', ''),
                country=data.get('country', 'Ethiopia'),
                date_of_birth=data.get('date_of_birth'),
                sex=data.get('sex', ''),
                is_corporate=False
            )
            
            # Create car
            car_make = None
            car_model = None
            if data.get('car_make'):
                car_make = CarMake.objects.get(id=data['car_make'])
            if data.get('car_model'):
                car_model = CarModel.objects.get(id=data['car_model'])
            
            car = Car.objects.create(
                tenant=tenant,
                customer=customer,
                make=car_make,
                model=car_model,
                make_text=data.get('car_make_text', ''),
                model_text=data.get('car_model_text', ''),
                car_type=data['car_type'],
                plate_number=data['plate_number'],
                year=data.get('year'),
                color=data.get('color', ''),
                mileage=data.get('mileage')
            )
        
        # Return created customer with details
        response_serializer = CustomerDetailSerializer(customer)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def onboard_corporate(self, request):
        """
        Onboard a new corporate customer with multiple cars.
        Creates customer and all cars in a single transaction.
        """
        serializer = CorporateCustomerOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tenant = request.user.tenant
        
        with transaction.atomic():
            # Create customer
            customer = Customer.objects.create(
                tenant=tenant,
                customer_type='CORPORATE',
                company_name=data['company_name'],
                phone_number=data['phone_number'],
                email=data.get('email', ''),
                address=data.get('address', ''),
                house_number=data.get('house_number', ''),
                state=data.get('state', ''),
                country=data.get('country', 'Ethiopia'),
                tin_number=data.get('tin_number', ''),
                is_corporate=True
            )
            
            # Create cars
            for car_data in data['cars']:
                car_make = None
                car_model = None
                if car_data.get('make'):
                    car_make = CarMake.objects.get(id=car_data['make'])
                if car_data.get('model'):
                    car_model = CarModel.objects.get(id=car_data['model'])
                
                Car.objects.create(
                    tenant=tenant,
                    customer=customer,
                    make=car_make,
                    model=car_model,
                    make_text=car_data.get('make_text', ''),
                    model_text=car_data.get('model_text', ''),
                    car_type=car_data.get('car_type', ''),
                    plate_number=car_data['plate_number'],
                    year=car_data.get('year'),
                    color=car_data.get('color', ''),
                    mileage=car_data.get('mileage'),
                    corporate_car_id=car_data.get('corporate_car_id', '')
                )
        
        # Return created customer with details
        response_serializer = CustomerDetailSerializer(customer)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def adjust_loyalty_points(self, request, pk=None):
        """
        Manually adjust loyalty points for a customer.
        Restricted to admin/owner roles.
        """
        customer = self.get_object()
        serializer = LoyaltyAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Adjust points using the model method
        customer.adjust_loyalty_points(
            points=serializer.validated_data['points'],
            reason=serializer.validated_data['reason'],
            adjusted_by=request.user,
            transaction_type=serializer.validated_data.get('transaction_type', 'ADJUSTMENT')
        )
        
        # Return updated customer
        response_serializer = CustomerDetailSerializer(customer)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Get QR code for customer"""
        customer = self.get_object()
        return Response({
            'qr_code': customer.qr_code,
            'customer_id': customer.id,
            'customer_name': customer.full_name,
            'phone': customer.phone_number,
            'email': customer.email
        })
    
    @action(detail=True, methods=['get'])
    def cars(self, request, pk=None):
        """Get all active cars for a specific customer"""
        customer = self.get_object()
        cars = customer.cars.filter(is_deleted=False)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_car(self, request, pk=None):
        """Add a new car to a customer"""
        customer = self.get_object()
        serializer = CarCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(tenant=request.user.tenant, customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CarViewSet(viewsets.ModelViewSet):
    """ViewSet for Car CRUD operations with soft delete support"""
    serializer_class = CarSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'make', 'model', 'car_type', 'is_deleted']
    search_fields = ['plate_number', 'make__name', 'model__name', 'make_text', 'model_text']
    ordering_fields = ['created_at', 'year']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only active (non-deleted) cars by default"""
        queryset = Car.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer', 'make', 'model')
        
        # Allow filtering deleted cars with ?include_deleted=true
        if not self.request.query_params.get('include_deleted'):
            queryset = queryset.filter(is_deleted=False)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CarCreateSerializer
        return CarSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.soft_delete()
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a soft-deleted car"""
        car = self.get_object()
        car.restore()
        serializer = self.get_serializer(car)
        return Response(serializer.data)
