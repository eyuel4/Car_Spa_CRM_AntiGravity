from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from operations.models import Visit, VisitService
from operations.visit_serializers import (
    VisitListSerializer, VisitDetailSerializer, VisitCreateSerializer,
    SearchResultSerializer, VehicleSerializer, AddServicesSerializer,
    ProcessPaymentSerializer, ConvertToCustomerSerializer, LinkCustomerSerializer
)
from customers.models import Customer, Car
from services.models import Service


class VisitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Visit management.
    
    Endpoints:
    - list: Get visits with optional status filtering
    - retrieve: Get visit detail
    - create: Create new visit
    - partial_update: Update visit (status, notes)
    - search: Search customer/vehicle
    - add_services: Add services to visit
    - process_payment: Process payment
    - convert_to_customer: Convert guest to customer
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer_type']
    search_fields = ['ticket_id', 'customer_name', 'car_plate', 'phone_number']
    ordering_fields = ['checked_in_at', 'started_at', 'completed_at']
    ordering = ['-checked_in_at']
    
    def get_queryset(self):
        return Visit.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer', 'car').prefetch_related('visit_services__service')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VisitListSerializer
        elif self.action == 'create':
            return VisitCreateSerializer
        return VisitDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for customers and their vehicles by query.
        Query can be: plate number, phone number, or name
        """
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({'results': []})
        
        # Search customers by phone or name
        customers = Customer.objects.filter(
            tenant=request.user.tenant
        ).filter(
            Q(phone_number__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).prefetch_related('cars').distinct()[:10]
        
        # Also search by plate number
        cars_by_plate = Car.objects.filter(
            tenant=request.user.tenant,
            plate_number__icontains=query,
            is_deleted=False
        ).select_related('customer').distinct()[:10]
        
        # Combine results
        customer_ids = set()
        results = []
        
        # Add customers from direct search
        for customer in customers:
            if customer.id not in customer_ids:
                customer_ids.add(customer.id)
                vehicles = VehicleSerializer(
                    customer.cars.filter(is_deleted=False),
                    many=True
                ).data
                results.append({
                    'customer_id': customer.id,
                    'customer_name': f"{customer.first_name} {customer.last_name}",
                    'phone': customer.phone_number,
                    'vehicles': vehicles
                })
        
        # Add customers from plate search
        for car in cars_by_plate:
            if car.customer.id not in customer_ids:
                customer_ids.add(car.customer.id)
                vehicles = VehicleSerializer(
                    car.customer.cars.filter(is_deleted=False),
                    many=True
                ).data
                results.append({
                    'customer_id': car.customer.id,
                    'customer_name': f"{car.customer.first_name} {car.customer.last_name}",
                    'phone': car.customer.phone_number,
                    'vehicles': vehicles
                })
        
        return Response({'results': results})
    
    @action(detail=True, methods=['post'])
    def add_services(self, request, pk=None):
        """Add services to a visit"""
        visit = self.get_object()
        serializer = AddServicesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service_ids = serializer.validated_data['service_ids']
        
        # Get services
        services = Service.objects.filter(
            id__in=service_ids,
            tenant=request.user.tenant
        )
        
        if services.count() != len(service_ids):
            return Response(
                {'error': 'One or more services not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Add services to visit
        for service in services:
            # Check if already added
            if VisitService.objects.filter(visit=visit, service=service).exists():
                continue
            
            # Determine price based on car type
            price = service.price
            if visit.car_type:
                from services.models import ServicePrice
                try:
                    # Use filter().first() to avoid MultipleObjectsReturned and Handle Case Sensitivity
                    service_price = ServicePrice.objects.filter(
                        service=service,
                        car_type__name__iexact=visit.car_type
                    ).first()
                    
                    if service_price:
                        price = service_price.price
                except Exception as e:
                    print(f"Error finding price: {e}")
                    pass
            
            # Create visit service
            VisitService.objects.create(
                tenant=request.user.tenant,
                visit=visit,
                service=service,
                price=price,
                is_addon=False  # Can be enhanced to detect add-ons
            )
        
        # Recalculate totals
        # Refresh from db to clear prefetch_related cache and see new services
        visit.refresh_from_db()
        visit.calculate_totals()
        
        # Return updated visit
        serializer = VisitDetailSerializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process payment for a visit"""
        visit = self.get_object()
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update visit with payment info
        visit.payment_method = serializer.validated_data['payment_method']
        visit.tip = serializer.validated_data.get('tip', 0)
        visit.payment_confirmation = serializer.validated_data.get('payment_confirmation', '')
        visit.status = 'PAID'
        visit.paid_at = timezone.now()
        
        # Recalculate total with tip
        visit.calculate_totals()
        
        visit.save()
        
        # Return updated visit
        response_serializer = VisitDetailSerializer(visit)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'])
    def convert_to_customer(self, request, pk=None):
        """Convert a guest visit to a registered customer"""
        visit = self.get_object()
        
        if visit.customer_type != 'GUEST':
            return Response(
                {'error': 'Visit is not a guest visit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ConvertToCustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Create customer
        customer = Customer.objects.create(
            tenant=request.user.tenant,
            customer_type='INDIVIDUAL',
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data['phone_number'],
            email=data.get('email', '')
        )
        
        # Create car if info provided
        car = None
        if data.get('car_make') and data.get('car_model'):
            # Try to find or create car
            car = Car.objects.create(
                tenant=request.user.tenant,
                customer=customer,
                make_text=data['car_make'],
                model_text=data['car_model'],
                plate_number=visit.car_plate or f"TEMP-{visit.id}",
                color=data.get('car_color', ''),
                car_type=visit.car_type or ''
            )
        
        # Update visit
        visit.customer = customer
        visit.car = car
        visit.customer_type = 'REGISTERED'
        visit.save()
        
        # Return updated visit
        response_serializer = VisitDetailSerializer(visit)
        return Response(response_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Update visit (typically status or notes)"""
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def link_customer(self, request, pk=None):
        """Link a visit to an existing registered customer"""
        visit = self.get_object()
        
        serializer = LinkCustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        customer_id = serializer.validated_data['customer_id']
        
        # Look up the customer
        try:
            customer = Customer.objects.get(
                id=customer_id,
                tenant=request.user.tenant
            )
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update visit to link to customer
        visit.customer = customer
        visit.customer_type = 'REGISTERED'
        visit.customer_name = f"{customer.first_name} {customer.last_name}"
        if customer.phone_number:
            visit.phone_number = customer.phone_number
        visit.save()
        
        # Return updated visit
        response_serializer = VisitDetailSerializer(visit)
        return Response(response_serializer.data)
