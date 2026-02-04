"""
Test script for Visit API endpoints
Creates sample visits and tests all endpoints
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from tenants.models import Tenant
from customers.models import Customer, Car
from services.models import Service
from operations.models import Visit, VisitService

User = get_user_model()


def create_test_visits():
    """Create test visits for development"""
    
    # Get or create tenant
    tenant, _ = Tenant.objects.get_or_create(
        name="Test Car Spa",
        defaults={
            'phone_number': '555-0000',
            'email': 'test@carspa.com'
        }
    )
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='manager',
        defaults={
            'tenant': tenant,
            'role': 'MANAGER',
            'email': 'manager@carspa.com'
        }
    )
    if _:
        user.set_password('password123')
        user.save()
    
    # Create front desk user
    front_desk, _ = User.objects.get_or_create(
        username='frontdesk',
        defaults={
            'tenant': tenant,
            'role': 'FRONT_DESK',
            'email': 'frontdesk@carspa.com'
        }
    )
    if _:
        front_desk.set_password('password123')
        front_desk.save()
    
    # Create worker user
    worker, _ = User.objects.get_or_create(
        username='worker',
        defaults={
            'tenant': tenant,
            'role': 'WORKER',
            'email': 'worker@carspa.com'
        }
    )
    if _:
        worker.set_password('password123')
        worker.save()
    
    print(f"✓ Created users: manager, frontdesk, worker (password: password123)")
    
    # Get or create customer
    customer, _ = Customer.objects.get_or_create(
        tenant=tenant,
        phone_number='555-1234',
        defaults={
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com'
        }
    )
    
    # Get or create car
    car, _ = Car.objects.get_or_create(
        tenant=tenant,
        plate_number='ABC123',
        defaults={
            'customer': customer,
            'make_text': 'Toyota',
            'model_text': 'Camry',
            'car_type': 'SEDAN',
            'color': 'Silver'
        }
    )
    
    print(f"✓ Created customer: {customer}")
    print(f"✓ Created car: {car}")
    
    # Get or create services
    service1, _ = Service.objects.get_or_create(
        tenant=tenant,
        name='Basic Wash',
        defaults={
            'description': 'Exterior wash and dry',
            'price': 25.00,
            'duration_minutes': 30
        }
    )
    
    service2, _ = Service.objects.get_or_create(
        tenant=tenant,
        name='Interior Detail',
        defaults={
            'description': 'Complete interior cleaning',
            'price': 50.00,
            'duration_minutes': 60
        }
    )
    
    service3, _ = Service.objects.get_or_create(
        tenant=tenant,
        name='Wax & Polish',
        defaults={
            'description': 'Premium wax and polish',
            'price': 75.00,
            'duration_minutes': 90
        }
    )
    
    print(f"✓ Created services: Basic Wash, Interior Detail, Wax & Polish")
    
    # Create registered customer visit (CHECKED_IN)
    visit1, created = Visit.objects.get_or_create(
        tenant=tenant,
        ticket_id='V-001',
        defaults={
            'customer': customer,
            'customer_type': 'REGISTERED',
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'car': car,
            'car_info': f"{car.make_text} {car.model_text}",
            'car_plate': car.plate_number,
            'car_type': car.car_type,
            'phone_number': customer.phone_number,
            'status': 'CHECKED_IN'
        }
    )
    
    if created:
        # Add services
        VisitService.objects.create(
            tenant=tenant,
            visit=visit1,
            service=service1,
            price=service1.price
        )
        VisitService.objects.create(
            tenant=tenant,
            visit=visit1,
            service=service2,
            price=service2.price
        )
        visit1.calculate_totals()
        print(f"✓ Created visit: {visit1.ticket_id} (CHECKED_IN) - ${visit1.total}")
    
    # Create guest visit (IN_PROGRESS)
    visit2, created = Visit.objects.get_or_create(
        tenant=tenant,
        ticket_id='V-002',
        defaults={
            'customer_type': 'GUEST',
            'customer_name': 'Jane Smith',
            'car_info': 'Red Honda Accord',
            'car_plate': 'XYZ789',
            'car_type': 'SEDAN',
            'phone_number': '555-5678',
            'status': 'IN_PROGRESS'
        }
    )
    
    if created:
        # Add service
        VisitService.objects.create(
            tenant=tenant,
            visit=visit2,
            service=service1,
            price=service1.price
        )
        visit2.calculate_totals()
        print(f"✓ Created visit: {visit2.ticket_id} (IN_PROGRESS) - ${visit2.total}")
    
    # Create another registered visit (COMPLETED_WAITING_PICKUP)
    visit3, created = Visit.objects.get_or_create(
        tenant=tenant,
        ticket_id='V-003',
        defaults={
            'customer': customer,
            'customer_type': 'REGISTERED',
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'car': car,
            'car_info': f"{car.make_text} {car.model_text}",
            'car_plate': car.plate_number,
            'car_type': car.car_type,
            'phone_number': customer.phone_number,
            'status': 'COMPLETED_WAITING_PICKUP'
        }
    )
    
    if created:
        # Add services
        VisitService.objects.create(
            tenant=tenant,
            visit=visit3,
            service=service3,
            price=service3.price
        )
        visit3.calculate_totals()
        print(f"✓ Created visit: {visit3.ticket_id} (COMPLETED_WAITING_PICKUP) - ${visit3.total}")
    
    print("\n" + "="*50)
    print("Test data created successfully!")
    print("="*50)
    print("\nAPI Endpoints available:")
    print("  GET    /api/visits/                    - List all visits")
    print("  GET    /api/visits/?status=CHECKED_IN  - Filter by status")
    print("  GET    /api/visits/search/?q=ABC123    - Search customer/vehicle")
    print("  POST   /api/visits/                    - Create new visit")
    print("  GET    /api/visits/1/                  - Get visit detail")
    print("  PATCH  /api/visits/1/                  - Update visit")
    print("  POST   /api/visits/1/add_services/     - Add services")
    print("  POST   /api/visits/1/process_payment/  - Process payment")
    print("  POST   /api/visits/1/convert_to_customer/ - Convert guest")
    print("\nTest users:")
    print("  manager    / password123  (role: MANAGER)")
    print("  frontdesk  / password123  (role: FRONT_DESK)")
    print("  worker     / password123  (role: WORKER)")
    print("\nTest with:")
    print("  python manage.py runserver")
    print("  Then use Postman or the manager app")


if __name__ == '__main__':
    create_test_visits()
