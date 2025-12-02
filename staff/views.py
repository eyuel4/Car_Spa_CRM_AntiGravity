from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers as drf_serializers
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from calendar import monthrange
from staff.models import Staff, EmergencyContact
from staff.serializers import (
    StaffListSerializer, StaffDetailSerializer, StaffCreateSerializer, EmergencyContactSerializer
)


class StaffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Staff CRUD operations.
    
    Includes custom actions for:
    - tasks: Get staff's assigned tasks
    - performance: Get performance metrics
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'title']
    search_fields = ['first_name', 'last_name', 'phone_number', 'email']
    ordering_fields = ['hire_date', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Staff.objects.filter(tenant=self.request.user.tenant).prefetch_related(
            'compensation_history', 'salary_payments', 'emergency_contacts', 'shop'
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StaffListSerializer
        elif self.action == 'create':
            return StaffCreateSerializer
        return StaffDetailSerializer
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks assigned to this staff member"""
        from operations.models import JobTask
        from operations.serializers import JobTaskSerializer
        
        staff = self.get_object()
        tasks = JobTask.objects.filter(
            tenant=request.user.tenant,
            staff=staff
        ).select_related('job_item__job', 'job_item__service').order_by('-created_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        serializer = JobTaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Override to handle permissions and validations"""
        user = self.request.user
        
        # Only Owner can set is_manager
        if 'is_manager' in serializer.validated_data and serializer.validated_data['is_manager']:
            if user.role != 'OWNER':
                serializer.validated_data['is_manager'] = False
        
        # Set tenant and save
        staff = serializer.save(tenant=user.tenant)
        
        # Validate and create emergency contacts (handled in serializer, but double-check here)
        if hasattr(serializer, 'validated_data'):
            emergency_contacts_data = serializer.validated_data.get('emergency_contacts', [])
            if len(emergency_contacts_data) > 2:
                raise drf_serializers.ValidationError({'emergency_contacts': 'Maximum 2 emergency contacts allowed.'})
    
    def perform_update(self, serializer):
        """Override to handle permissions"""
        user = self.request.user
        staff = self.get_object()
        
        # Only Owner can set is_manager
        if 'is_manager' in serializer.validated_data:
            if user.role != 'OWNER':
                # Remove is_manager from update if user is not Owner
                serializer.validated_data.pop('is_manager', None)
        
        # Only Owner can edit hire_date after creation
        if 'hire_date' in serializer.validated_data:
            if user.role != 'OWNER' and staff.pk:
                # Restore original hire_date if not Owner
                serializer.validated_data['hire_date'] = staff.hire_date
        
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def upload_photo(self, request, pk=None):
        """Upload photo for staff member"""
        staff = self.get_object()
        if 'photo' not in request.FILES:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        staff.photo = request.FILES['photo']
        staff.save()
        
        serializer = self.get_serializer(staff)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post', 'put', 'delete'])
    def emergency_contacts(self, request, pk=None):
        """Manage emergency contacts for staff"""
        staff = self.get_object()
        
        if request.method == 'GET':
            contacts = EmergencyContact.objects.filter(tenant=request.user.tenant, staff=staff)
            serializer = EmergencyContactSerializer(contacts, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Check max 2 contacts
            existing_count = EmergencyContact.objects.filter(tenant=request.user.tenant, staff=staff).count()
            if existing_count >= 2:
                return Response(
                    {'error': 'Maximum 2 emergency contacts allowed per staff member.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = EmergencyContactSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(tenant=request.user.tenant, staff=staff)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'PUT':
            contact_id = request.data.get('id')
            if not contact_id:
                return Response({'error': 'Contact ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                contact = EmergencyContact.objects.get(id=contact_id, tenant=request.user.tenant, staff=staff)
            except EmergencyContact.DoesNotExist:
                return Response({'error': 'Contact not found'}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = EmergencyContactSerializer(contact, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            contact_id = request.query_params.get('id')
            if not contact_id:
                return Response({'error': 'Contact ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                contact = EmergencyContact.objects.get(id=contact_id, tenant=request.user.tenant, staff=staff)
                contact.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except EmergencyContact.DoesNotExist:
                return Response({'error': 'Contact not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get performance metrics for this staff member"""
        from operations.models import JobTask
        
        staff = self.get_object()
        
        # Get date range from query params (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        tasks = JobTask.objects.filter(
            tenant=request.user.tenant,
            staff=staff,
            created_at__gte=start_date
        )
        
        # Calculate metrics
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='DONE').count()
        
        # Calculate total hours worked
        completed_with_times = tasks.filter(
            status='DONE',
            start_time__isnull=False,
            end_time__isnull=False
        )
        
        total_hours = 0
        for task in completed_with_times:
            duration = task.end_time - task.start_time
            total_hours += duration.total_seconds() / 3600
        
        avg_task_duration = total_hours / completed_tasks if completed_tasks > 0 else 0
        
        return Response({
            'period_days': days,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'total_hours_worked': round(total_hours, 2),
            'average_task_duration_hours': round(avg_task_duration, 2),
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
        })
    
    @action(detail=True, methods=['get'])
    def monthly_performance(self, request, pk=None):
        """Get monthly breakdown of services completed"""
        from operations.models import JobTask
        from django.db.models.functions import TruncMonth
        
        staff = self.get_object()
        year = int(request.query_params.get('year', timezone.now().year))
        
        # Get all completed tasks for the year
        tasks = JobTask.objects.filter(
            tenant=request.user.tenant,
            staff=staff,
            status='DONE',
            created_at__year=year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Format response
        monthly_data = []
        for item in tasks:
            monthly_data.append({
                'month': item['month'].strftime('%Y-%m'),
                'month_name': item['month'].strftime('%B'),
                'services_completed': item['count']
            })
        
        # Fill in months with 0 if no tasks
        all_months = []
        for month in range(1, 13):
            month_date = timezone.datetime(year, month, 1, tzinfo=timezone.get_current_timezone())
            month_str = month_date.strftime('%Y-%m')
            month_name = month_date.strftime('%B')
            
            existing = next((m for m in monthly_data if m['month'] == month_str), None)
            if existing:
                all_months.append(existing)
            else:
                all_months.append({
                    'month': month_str,
                    'month_name': month_name,
                    'services_completed': 0
                })
        
        return Response({
            'year': year,
            'monthly_breakdown': all_months,
            'total_services': sum(m['services_completed'] for m in all_months)
        })
