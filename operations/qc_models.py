from django.db import models
from core.models import TenantAwareModel


class QCChecklistItem(TenantAwareModel):
    """Quality Control checklist items configurable by tenant"""
    service = models.ForeignKey('services.Service', on_delete=models.CASCADE, null=True, blank=True, related_name='qc_items', help_text="If null, applies to all jobs (Global)")
    name = models.CharField(max_length=200, help_text="QC item description")
    order = models.IntegerField(default=0, help_text="Display order")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class JobQCRecord(TenantAwareModel):
    """Records QC completion for a job"""
    job = models.OneToOneField('operations.Job', on_delete=models.CASCADE, related_name='qc_record')
    checked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='qc_checks')
    checked_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"QC for Job #{self.job.id} - {'Passed' if self.passed else 'Failed'}"


class QCChecklistResponse(TenantAwareModel):
    """Individual checklist item responses for a job"""
    qc_record = models.ForeignKey(JobQCRecord, on_delete=models.CASCADE, related_name='responses')
    checklist_item = models.ForeignKey(QCChecklistItem, on_delete=models.CASCADE)
    checked = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.checklist_item.name}: {'✓' if self.checked else '✗'}"
