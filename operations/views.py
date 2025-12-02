from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from operations.models import Job, JobItem, JobTask
from operations.serializers import (
    JobListSerializer, JobDetailSerializer,
    JobItemSerializer, JobTaskSerializer
)


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job management.
    
    Custom actions:
    - items: Get all items for a job
    - tasks: Get all tasks for a job
    - add_item: Add a service to a job
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'payment_method']
    search_fields = ['customer__first_name', 'customer__last_name', 'car__plate_number']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Job.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer', 'car').prefetch_related('items__service', 'items__tasks')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Get all items for this job"""
        job = self.get_object()
        items = job.items.all().select_related('service').prefetch_related('tasks')
        serializer = JobItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add a service to this job"""
        from services.models import Service, ServicePrice
        
        job = self.get_object()
        service_id = request.data.get('service_id')
        
        try:
            service = Service.objects.get(id=service_id, tenant=request.user.tenant)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get price based on car type
        car_type = job.car.car_type if hasattr(job.car, 'car_type') else None
        price = service.price  # Default
        
        if car_type:
            try:
                service_price = ServicePrice.objects.get(service=service, car_type=car_type)
                price = service_price.price
            except ServicePrice.DoesNotExist:
                pass
        
        # Create job item
        job_item = JobItem.objects.create(
            tenant=request.user.tenant,
            job=job,
            service=service,
            price=price
        )
        
        serializer = JobItemSerializer(job_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for this job"""
        job = self.get_object()
        tasks = JobTask.objects.filter(
            job_item__job=job,
            tenant=request.user.tenant
        ).select_related('job_item__service', 'staff')
        
        serializer = JobTaskSerializer(tasks, many=True)
        return Response(serializer.data)


class JobTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task management.
    
    Custom actions:
    - start: Start a task (record start time)
    - complete: Complete a task (record end time)
    """
    serializer_class = JobTaskSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'staff', 'job_item__job']
    ordering_fields = ['created_at', 'start_time', 'end_time']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return JobTask.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('job_item__job__customer', 'job_item__job__car', 'job_item__service', 'staff')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a task"""
        task = self.get_object()
        
        if task.status != 'PENDING':
            return Response(
                {'error': 'Task must be in PENDING status to start'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'IN_PROGRESS'
        task.start_time = timezone.now()
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a task"""
        task = self.get_object()
        
        if task.status == 'DONE':
            return Response(
                {'error': 'Task is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'DONE'
        task.end_time = timezone.now()
        
        # If start_time wasn't set, set it to now
        if not task.start_time:
            task.start_time = task.end_time
        
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
