from rest_framework import serializers
from operations.models import Job, JobItem, JobTask


class JobTaskSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='job_item.service.name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    car_info = serializers.SerializerMethodField()
    staff_name = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = JobTask
        fields = [
            'id', 'job_item', 'staff', 'staff_name', 'task_name', 'status',
            'start_time', 'end_time', 'service_name', 'customer_name', 'car_info',
            'duration_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        customer = obj.job_item.job.customer
        return f"{customer.first_name} {customer.last_name}"
    
    def get_car_info(self, obj):
        car = obj.job_item.job.car
        return f"{car.make} {car.model} ({car.plate_number})"
    
    def get_staff_name(self, obj):
        return f"{obj.staff.first_name} {obj.staff.last_name}"
    
    def get_duration_hours(self, obj):
        if obj.start_time and obj.end_time:
            duration = obj.end_time - obj.start_time
            return round(duration.total_seconds() / 3600, 2)
        return None


class JobItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    tasks = JobTaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobItem
        fields = ['id', 'service', 'service_name', 'price', 'tasks', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    car_info = serializers.SerializerMethodField()
    items = JobItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'customer', 'customer_name', 'car', 'car_info',
            'status', 'payment_method', 'items', 'total_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"
    
    def get_car_info(self, obj):
        return f"{obj.car.make} {obj.car.model} ({obj.car.plate_number})"

    def get_total_price(self, obj):
        return sum(item.price for item in obj.items.all())


class JobDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    car_info = serializers.SerializerMethodField()
    items = JobItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'customer', 'customer_name', 'car', 'car_info',
            'status', 'payment_method', 'qr_code', 'items', 'total_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_code', 'created_at', 'updated_at']

    def get_total_price(self, obj):
        return sum(item.price for item in obj.items.all())
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"
    
    def get_car_info(self, obj):
        return f"{obj.car.make} {obj.car.model} ({obj.car.plate_number})"
