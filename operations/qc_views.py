from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from operations.qc_models import QCChecklistItem, JobQCRecord, QCChecklistResponse
from operations.qc_serializers import (
    QCChecklistItemSerializer, JobQCRecordSerializer, QCChecklistResponseSerializer
)


class QCChecklistItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for QC Checklist Items (configurable by tenant).
    Managers can configure what items to check during QC.
    """
    serializer_class = QCChecklistItemSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        return QCChecklistItem.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class JobQCRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job QC Records.
    
    Custom actions:
    - perform_qc: Perform QC check for a job with checklist responses
    """
    serializer_class = JobQCRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['job', 'passed']
    
    def get_queryset(self):
        return JobQCRecord.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('job', 'checked_by').prefetch_related('responses')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, checked_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def perform_qc(self, request):
        """
        Perform QC check for a job.
        
        Expected payload:
        {
            "job_id": 1,
            "passed": true,
            "notes": "All good",
            "responses": [
                {"checklist_item": 1, "checked": true, "notes": ""},
                {"checklist_item": 2, "checked": true, "notes": ""}
            ]
        }
        """
        from operations.models import Job
        
        job_id = request.data.get('job_id')
        passed = request.data.get('passed', True)
        notes = request.data.get('notes', '')
        responses_data = request.data.get('responses', [])
        
        try:
            job = Job.objects.get(id=job_id, tenant=request.user.tenant)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create QC record
        qc_record = JobQCRecord.objects.create(
            tenant=request.user.tenant,
            job=job,
            checked_by=request.user,
            passed=passed,
            notes=notes
        )
        
        # Create checklist responses
        for response_data in responses_data:
            QCChecklistResponse.objects.create(
                tenant=request.user.tenant,
                qc_record=qc_record,
                checklist_item_id=response_data.get('checklist_item'),
                checked=response_data.get('checked', False),
                notes=response_data.get('notes', '')
            )
        
        # Update job status
        if passed:
            job.status = 'READY'  # Ready for pickup
        else:
            job.status = 'IN_PROGRESS'  # Send back to work
        job.save()
        
        serializer = self.get_serializer(qc_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
