from rest_framework import serializers
from operations.qc_models import QCChecklistItem, JobQCRecord, QCChecklistResponse


class QCChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCChecklistItem
        fields = ['id', 'name', 'order', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class QCChecklistResponseSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='checklist_item.name', read_only=True)
    
    class Meta:
        model = QCChecklistResponse
        fields = ['id', 'checklist_item', 'item_name', 'checked', 'notes']
        read_only_fields = ['id']


class JobQCRecordSerializer(serializers.ModelSerializer):
    responses = QCChecklistResponseSerializer(many=True, read_only=True)
    checked_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JobQCRecord
        fields = [
            'id', 'job', 'checked_by', 'checked_by_name', 'checked_at',
            'passed', 'notes', 'responses'
        ]
        read_only_fields = ['id', 'checked_at']
    
    def get_checked_by_name(self, obj):
        if obj.checked_by:
            return obj.checked_by.username
        return None
