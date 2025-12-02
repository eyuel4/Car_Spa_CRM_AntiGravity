import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant
from customers.models import Customer, Car
from services.models import Category, Service, CarType, ServicePrice
from inventory.models import Product, ServiceProductRequirement, StockLog
from staff.models import Staff
from operations.models import Job, JobItem, JobTask

def verify_operations():
    tenant, _ = Tenant.objects.get_or_create(name="Test Spa", subdomain="testspa")
    print(f"Using Tenant: {tenant.name}")

    # 1. Setup Dynamic Pricing
    sedan, _ = CarType.objects.get_or_create(tenant=tenant, name="Sedan")
    suv, _ = CarType.objects.get_or_create(tenant=tenant, name="SUV")
    
    category, _ = Category.objects.get_or_create(tenant=tenant, name="Washing")
    service, _ = Service.objects.get_or_create(
        tenant=tenant, category=category, name="Premium Wash",
        defaults={'price': 50.00, 'duration_minutes': 45}
    )
    
    # SUV costs more (override)
    ServicePrice.objects.get_or_create(
        tenant=tenant, service=service, car_type=suv,
        defaults={'price': 75.00, 'duration_minutes': 60}
    )
    print(f"Service: {service.name} | Base: {service.price} | SUV: 75.00")

    # 2. Setup Inventory
    shampoo, _ = Product.objects.get_or_create(
        tenant=tenant, name="Car Shampoo", unit="ml", 
        defaults={'current_stock': 5000}
    )
    # Recipe: 1 Premium Wash uses 100ml Shampoo
    ServiceProductRequirement.objects.create(
        tenant=tenant, service=service, product=shampoo, quantity_required=100
    )
    print(f"Inventory: {shampoo.name} has {shampoo.current_stock} {shampoo.unit}")

    # 3. Create Customer, Car, and Staff
    customer, _ = Customer.objects.get_or_create(
        tenant=tenant, first_name="John", last_name="Doe",
        defaults={'phone_number': '555-1234'}
    )
    suv_car, _ = Car.objects.get_or_create(
        tenant=tenant, customer=customer, plate_number="SUV-999",
        defaults={'make': 'Ford', 'model': 'Explorer'}
    )
    staff, _ = Staff.objects.get_or_create(
        tenant=tenant, first_name="Bob", last_name="Builder",
        defaults={'phone_number': '555-WORK', 'title': 'Detailer', 'hire_date': timezone.now().date()}
    )
    
    # 4. Create Job for SUV (Should use SUV Price)
    job = Job.objects.create(tenant=tenant, customer=customer, car=suv_car, status='PENDING')
    
    # Add Service to Job (Use car-specific price or fallback to base)
    try:
        price_obj = ServicePrice.objects.get(service=service, car_type=suv)
        final_price = price_obj.price
    except ServicePrice.DoesNotExist:
        final_price = service.price  # Fallback to base price

    job_item = JobItem.objects.create(tenant=tenant, job=job, service=service, price=final_price)
    print(f"Job Created: {job} | Item: {job_item.service.name} @ {job_item.price}")

    # 5. Assign Task to Staff
    task = JobTask.objects.create(
        tenant=tenant, job_item=job_item, staff=staff, task_name="Exterior Wash",
        status='IN_PROGRESS', start_time=timezone.now()
    )
    print(f"Task Started: {task.task_name} by {task.staff.first_name}")

    # 6. Complete Job & Deduct Inventory (Simulation)
    job.status = 'COMPLETED'
    job.save()
    
    # Deduct stock
    req = ServiceProductRequirement.objects.get(service=service)
    shampoo.current_stock -= req.quantity_required
    shampoo.save()
    StockLog.objects.create(tenant=tenant, product=shampoo, change_amount=-req.quantity_required, reason=f"Job #{job.id}")
    
    print(f"Job Completed. New Stock: {shampoo.current_stock} {shampoo.unit}")

if __name__ == "__main__":
    verify_operations()
