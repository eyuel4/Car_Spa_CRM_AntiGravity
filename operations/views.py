from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models
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
    
    @action(detail=True, methods=['post'])
    def start_qc(self, request, pk=None):
        """Start QC process for a job"""
        from operations.qc_models import JobQCRecord, QCChecklistItem, QCChecklistResponse
        
        job = self.get_object()
        
        # Create QC Record if not exists
        qc_record, created = JobQCRecord.objects.get_or_create(
            job=job,
            defaults={
                'tenant': request.user.tenant,
                'checked_by': request.user
            }
        )
        
        # Update job status
        job.status = 'QC'
        job.save()
        
        # Populate Checklist Items
        # 1. Global Items (service is null)
        # 2. Service-specific items (match job items)
        
        # Get Job's service IDs
        service_ids = job.items.values_list('service_id', flat=True)
        
        checklist_items = QCChecklistItem.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).filter(
            models.Q(service__isnull=True) | models.Q(service_id__in=service_ids)
        ).distinct()
        
        # Create empty responses for each item if not exists
        for item in checklist_items:
            QCChecklistResponse.objects.get_or_create(
                tenant=request.user.tenant,
                qc_record=qc_record,
                checklist_item=item
            )
            
        return Response({'status': 'QC Started', 'qc_record_id': qc_record.id})

    @action(detail=True, methods=['get', 'post'])
    def qc_checklist(self, request, pk=None):
        """Get or Update QC checklist"""
        from operations.qc_models import JobQCRecord, QCChecklistResponse
        
        job = self.get_object()
        try:
            qc_record = job.qc_record
        except JobQCRecord.DoesNotExist:
             return Response({'error': 'QC not started for this job'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'GET':
            responses = qc_record.responses.select_related('checklist_item').order_by('checklist_item__order')
            data = [{
                'id': r.id,
                'item_name': r.checklist_item.name,
                'checked': r.checked,
                'notes': r.notes
            } for r in responses]
            return Response(data)
            
        if request.method == 'POST':
            # Update checklist items
            updates = request.data.get('updates', []) # List of {id: 1, checked: true}
            for update in updates:
                try:
                    resp = QCChecklistResponse.objects.get(id=update['id'], tenant=request.user.tenant)
                    resp.checked = update.get('checked', resp.checked)
                    resp.notes = update.get('notes', resp.notes)
                    resp.save()
                except QCChecklistResponse.DoesNotExist:
                    pass
            return Response({'status': 'Checklist Updated'})
            
    @action(detail=True, methods=['post'])
    def finish_qc(self, request, pk=None):
        """Complete QC and Job"""
        job = self.get_object()
        passed = request.data.get('passed', True)
        
        if hasattr(job, 'qc_record'):
            job.qc_record.passed = passed
            job.qc_record.save()
            
        if passed:
            job.status = 'COMPLETED'
            job.completed_at = timezone.now()
            job.save()
            
        return Response({'status': 'Job Completed' if passed else 'QC Failed'})


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
