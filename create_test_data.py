import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.contrib.auth import get_user_model
from tenants.models import Tenant
from customers.models import Customer, Car
from services.models import Category, Service, CarType, ServicePrice
from staff.models import Staff
from operations.models import Job, JobItem, JobTask
from operations.qc_models import QCChecklistItem

User = get_user_model()

print("Creating test data...")

# Get or create a test tenant
tenant, created = Tenant.objects.get_or_create(
    subdomain='demo',
    defaults={
        'name': 'Demo Car Spa',
        'phone_number': '555-DEMO',
        'email': 'demo@carspa.com'
    }
)
if created:
    print(f"✓ Created tenant: {tenant.name}")
else:
    print(f"✓ Using existing tenant: {tenant.name}")

# Get admin user
admin = User.objects.get(username='admin')

# Create Car Types
sedan, _ = CarType.objects.get_or_create(name='Sedan', tenant=tenant)
suv, _ = CarType.objects.get_or_create(name='SUV', tenant=tenant)
truck, _ = CarType.objects.get_or_create(name='Truck', tenant=tenant)

print(f"✓ Created {CarType.objects.filter(tenant=tenant).count()} car types")

# Create Categories
exterior, _ = Category.objects.get_or_create(
    name='Exterior Wash',
    tenant=tenant,
    defaults={'description': 'Exterior cleaning services'}
)
interior, _ = Category.objects.get_or_create(
    name='Interior Detailing',
    tenant=tenant,
    defaults={'description': 'Interior cleaning services'}
)
premium, _ = Category.objects.get_or_create(
    name='Premium Services',
    tenant=tenant,
    defaults={'description': 'Premium detailing services'}
)

print(f"✓ Created {Category.objects.filter(tenant=tenant).count()} categories")

# Create Services
services_data = [
    ('Basic Wash', exterior, 'Hand wash exterior', 15.00, 30),
    ('Premium Wash', exterior, 'Premium hand wash with wax', 30.00, 45),
    ('Interior Vacuum', interior, 'Complete interior vacuuming', 20.00, 30),
    ('Leather Treatment', interior, 'Leather conditioning and protection', 40.00, 60),
    ('Full Detail', premium, 'Complete interior and exterior detail', 150.00, 180),
    ('Engine Bay Cleaning', premium, 'Deep clean engine compartment', 50.00, 45),
]

for name, category, desc, price, duration in services_data:
    service, created = Service.objects.get_or_create(
        name=name,
        tenant=tenant,
        defaults={'category': category, 'description': desc, 'price': price, 'duration_minutes': duration}
    )
    if created:
        # Create pricing for each car type
        ServicePrice.objects.get_or_create(
            service=service,
            car_type=sedan,
            tenant=tenant,
            defaults={'price': price}
        )
        ServicePrice.objects.get_or_create(
            service=service,
            car_type=suv,
            tenant=tenant,
            defaults={'price': price * 1.3}
        )
        ServicePrice.objects.get_or_create(
            service=service,
            car_type=truck,
            tenant=tenant,
            defaults={'price': price * 1.5}
        )

print(f"✓ Created {Service.objects.filter(tenant=tenant).count()} services")

# Create Staff Members
from datetime import date

staff_data = [
    ('John', 'Smith', '555-STAFF1', 'Wash Specialist'),
    ('Maria', 'Garcia', '555-STAFF2', 'Detail Technician'),
    ('David', 'Lee', '555-STAFF3', 'Senior Detailer'),
    ('Sarah', 'Johnson', '555-STAFF4', 'Interior Specialist'),
]

for first, last, phone, title in staff_data:
    Staff.objects.get_or_create(
        first_name=first,
        last_name=last,
        tenant=tenant,
        defaults={
            'title': title,
            'phone_number': phone,
            'hire_date': date.today(),
            'is_active': True
        }
    )

print(f"✓ Created {Staff.objects.filter(tenant=tenant).count()} staff members")

# Create QC Checklist Items
qc_items = [
    ('Exterior Clean', 1),
    ('Interior Vacuumed', 2),
    ('Windows Clear', 3),
    ('Tires Dressed', 4),
    ('Air Freshener', 5),
]

for name, order in qc_items:
    QCChecklistItem.objects.get_or_create(
        name=name,
        tenant=tenant,
        defaults={'order': order, 'is_active': True}
    )

print(f"✓ Created {QCChecklistItem.objects.filter(tenant=tenant).count()} QC checklist items")

# Create Test Customers and Cars
customers_data = [
    ('John', 'Doe', '555-0101', 'john.doe@email.com', False, 'Toyota', 'Camry', 'ABC-123', 'Silver'),
    ('Jane', 'Smith', '555-0102', 'jane.smith@email.com', False, 'Honda', 'CR-V', 'XYZ-789', 'Blue'),
    ('Bob', 'Wilson', '555-0103', 'bob.wilson@email.com', True, 'Ford', 'F-150', 'TRK-456', 'Black'),
    ('Alice', 'Brown', '555-0104', 'alice.brown@email.com', False, 'Tesla', 'Model 3', 'EV-2023', 'White'),
]

for first, last, phone, email, is_corp, make, model, plate, color in customers_data:
    customer, _ = Customer.objects.get_or_create(
        phone_number=phone,
        tenant=tenant,
        defaults={
            'first_name': first,
            'last_name': last,
            'email': email,
            'is_corporate': is_corp
        }
    )
    Car.objects.get_or_create(
        customer=customer,
        plate_number=plate,
        tenant=tenant,
        defaults={
            'make': make,
            'model': model,
            'color': color
        }
    )

print(f"✓ Created {Customer.objects.filter(tenant=tenant).count()} customers and {Car.objects.filter(tenant=tenant).count()} cars")

# Create Test Jobs
print("\nCreating test jobs...")

# Job 1: PENDING - Just created, no tasks assigned
customer1 = Customer.objects.get(phone_number='555-0101', tenant=tenant)
car1 = Car.objects.get(plate_number='ABC-123', tenant=tenant)
job1 = Job.objects.create(customer=customer1, car=car1, status='PENDING', tenant=tenant)
basic_wash = Service.objects.get(name='Basic Wash', tenant=tenant)
interior_vacuum = Service.objects.get(name='Interior Vacuum', tenant=tenant)
JobItem.objects.create(job=job1, service=basic_wash, price=basic_wash.price, tenant=tenant)
JobItem.objects.create(job=job1, service=interior_vacuum, price=interior_vacuum.price, tenant=tenant)
print(f"✓ Job #{job1.id}: PENDING - {customer1.full_name} - {car1.make} {car1.model}")

# Job 2: IN_PROGRESS - Has tasks, some completed
customer2 = Customer.objects.get(phone_number='555-0102', tenant=tenant)
car2 = Car.objects.get(plate_number='XYZ-789', tenant=tenant)
job2 = Job.objects.create(customer=customer2, car=car2, status='IN_PROGRESS', tenant=tenant)
premium_wash = Service.objects.get(name='Premium Wash', tenant=tenant)
leather_treatment = Service.objects.get(name='Leather Treatment', tenant=tenant)
item2a = JobItem.objects.create(job=job2, service=premium_wash, price=premium_wash.price, tenant=tenant)
item2b = JobItem.objects.create(job=job2, service=leather_treatment, price=leather_treatment.price, tenant=tenant)

# Create tasks for job 2
staff1 = Staff.objects.filter(tenant=tenant).first()
staff2 = Staff.objects.filter(tenant=tenant).all()[1]
task2a = JobTask.objects.create(job_item=item2a, staff=staff1, task_name='Premium Wash', status='DONE', tenant=tenant)
task2b = JobTask.objects.create(job_item=item2b, staff=staff2, task_name='Leather Treatment', status='IN_PROGRESS', tenant=tenant)
print(f"✓ Job #{job2.id}: IN_PROGRESS - {customer2.full_name} - {car2.make} {car2.model}")

# Job 3: IN_PROGRESS - All tasks completed, ready for QC
customer3 = Customer.objects.get(phone_number='555-0103', tenant=tenant)
car3 = Car.objects.get(plate_number='TRK-456', tenant=tenant)
job3 = Job.objects.create(customer=customer3, car=car3, status='IN_PROGRESS', tenant=tenant)
full_detail = Service.objects.get(name='Full Detail', tenant=tenant)
item3 = JobItem.objects.create(job=job3, service=full_detail, price=full_detail.price, tenant=tenant)
task3 = JobTask.objects.create(job_item=item3, staff=Staff.objects.filter(tenant=tenant).all()[2], task_name='Full Detail', status='DONE', tenant=tenant)
print(f"✓ Job #{job3.id}: IN_PROGRESS (Ready for QC) - {customer3.full_name} - {car3.make} {car3.model}")

# Job 4: QC - In quality control
customer4 = Customer.objects.get(phone_number='555-0104', tenant=tenant)
car4 = Car.objects.get(plate_number='EV-2023', tenant=tenant)
job4 = Job.objects.create(customer=customer4, car=car4, status='QC', tenant=tenant)
engine_bay = Service.objects.get(name='Engine Bay Cleaning', tenant=tenant)
item4a = JobItem.objects.create(job=job4, service=basic_wash, price=basic_wash.price, tenant=tenant)
item4b = JobItem.objects.create(job=job4, service=engine_bay, price=engine_bay.price, tenant=tenant)
task4a = JobTask.objects.create(job_item=item4a, staff=staff1, task_name='Basic Wash', status='DONE', tenant=tenant)
task4b = JobTask.objects.create(job_item=item4b, staff=staff2, task_name='Engine Bay Cleaning', status='DONE', tenant=tenant)
print(f"✓ Job #{job4.id}: QC - {customer4.full_name} - {car4.make} {car4.model}")

print("\n" + "="*50)
print("✅ Test data created successfully!")
print("="*50)
print(f"\nSummary:")
print(f"  • {Customer.objects.filter(tenant=tenant).count()} Customers")
print(f"  • {Car.objects.filter(tenant=tenant).count()} Cars")
print(f"  • {Service.objects.filter(tenant=tenant).count()} Services")
print(f"  • {Staff.objects.filter(tenant=tenant).count()} Staff Members")
print(f"  • {Job.objects.filter(tenant=tenant).count()} Jobs")
print(f"  • {QCChecklistItem.objects.filter(tenant=tenant).count()} QC Checklist Items")
print(f"\nYou can now test the Manager App with realistic data!")
