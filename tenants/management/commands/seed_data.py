from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tenants.models import Tenant, Shop
from customers.models import Customer, Car
from services.models import Service, Category, CarType
from staff.models import Staff
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with test data for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Shop.objects.all().delete()
            Tenant.objects.all().delete()
            Customer.objects.all().delete()
            Car.objects.all().delete()
            Service.objects.all().delete()
            Category.objects.all().delete()
            CarType.objects.all().delete()
            Staff.objects.all().delete()
            # Don't delete users - keep superuser accounts
            self.stdout.write(self.style.SUCCESS('Data cleared!'))

        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))

        # Create Tenants
        tenant1 = self.create_tenant(
            name="Premium Car Wash Co",
            subdomain="premium",
            phone="555-0100",
            email="info@premiumcarwash.com",
            address="100 Business Park Dr, Suite 200, New York, NY 10001"
        )

        tenant2 = self.create_tenant(
            name="Quick Clean Auto Spa",
            subdomain="quickclean",
            phone="555-0200",
            email="contact@quickclean.com",
            address="250 Commerce Boulevard, Los Angeles, CA 90001"
        )

        # Create Shops for Tenant 1
        shop1_1 = self.create_shop(
            tenant=tenant1,
            name="Premium Downtown",
            address="123 Main St, New York, NY 10001",
            phone="555-0101",
            email="downtown@premiumcarwash.com"
        )

        shop1_2 = self.create_shop(
            tenant=tenant1,
            name="Premium Airport",
            address="456 Airport Rd, New York, NY 10002",
            phone="555-0102",
            email="airport@premiumcarwash.com"
        )

        shop1_3 = self.create_shop(
            tenant=tenant1,
            name="Premium Mall Location",
            address="789 Shopping Center Dr, New York, NY 10003",
            phone="555-0103",
            email="mall@premiumcarwash.com"
        )

        # Create Shops for Tenant 2
        shop2_1 = self.create_shop(
            tenant=tenant2,
            name="Quick Clean Central",
            address="321 Central Ave, Los Angeles, CA 90001",
            phone="555-0201",
            email="central@quickclean.com"
        )

        shop2_2 = self.create_shop(
            tenant=tenant2,
            name="Quick Clean Beach",
            address="654 Ocean Blvd, Los Angeles, CA 90002",
            phone="555-0202",
            email="beach@quickclean.com"
        )

        # Create Car Types (shared across both tenants for demo)
        car_types = self.create_car_types(tenant1)

        # Create Service Categories and Services
        self.create_services(tenant1)
        self.create_services(tenant2)

        # Create Staff
        self.create_staff(tenant1, shop1_1)
        self.create_staff(tenant1, shop1_2)
        self.create_staff(tenant2, shop2_1)

        # Create Customers and Cars
        self.create_customers_and_cars(tenant1, car_types)
        self.create_customers_and_cars(tenant2, car_types)

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS(f'Created {Tenant.objects.count()} tenants'))
        self.stdout.write(self.style.SUCCESS(f'Created {Shop.objects.count()} shops'))
        self.stdout.write(self.style.SUCCESS(f'Created {Customer.objects.count()} customers'))
        self.stdout.write(self.style.SUCCESS(f'Created {Car.objects.count()} cars'))
        self.stdout.write(self.style.SUCCESS(f'Created {Service.objects.count()} services'))
        self.stdout.write(self.style.SUCCESS(f'Created {Staff.objects.count()} staff members'))

    def create_tenant(self, name, subdomain, phone, email, address):
        tenant, created = Tenant.objects.get_or_create(
            subdomain=subdomain,
            defaults={
                'name': name,
                'phone_number': phone,
                'email': email,
                'address': address,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Created tenant: {name}')
        else:
            self.stdout.write(f'  → Tenant already exists: {name}')
        return tenant

    def create_shop(self, tenant, name, address, phone, email):
        shop, created = Shop.objects.get_or_create(
            tenant=tenant,
            name=name,
            defaults={
                'address': address,
                'phone_number': phone,
                'email': email,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(f'    ✓ Created shop: {name}')
        else:
            self.stdout.write(f'    → Shop already exists: {name}')
        return shop

    def create_car_types(self, tenant):
        car_types = {}
        types_data = ['Sedan', 'SUV', 'Truck', 'Van', 'Luxury', 'Coupe', 'Hatchback']
        
        for type_name in types_data:
            # Check if it exists first for this tenant
            existing = CarType.objects.filter(tenant=tenant, name=type_name).first()
            if existing:
                car_types[type_name] = existing
                self.stdout.write(f'  → Car type already exists: {type_name}')
            else:
                car_type = CarType.objects.create(tenant=tenant, name=type_name)
                car_types[type_name] = car_type
                self.stdout.write(f'  ✓ Created car type: {type_name}')
        
        return car_types

    def create_services(self, tenant):
        # Create Categories
        categories_data = [
            ('Basic Wash', 'Standard washing services'),
            ('Detailing', 'Premium detailing services'),
            ('Specialty', 'Specialized services'),
        ]
        
        categories = {}
        for cat_name, cat_desc in categories_data:
            category, created = Category.objects.get_or_create(
                tenant=tenant,
                name=cat_name,
                defaults={'description': cat_desc}
            )
            categories[cat_name] = category

        # Create Services
        services_data = [
            ('Express Wash', 'Basic Wash', 'Quick exterior wash', 15.00, 15),
            ('Deluxe Wash', 'Basic Wash', 'Exterior wash + interior vacuum', 25.00, 25),
            ('Premium Wash', 'Basic Wash', 'Full wash with wax', 35.00, 35),
            ('Interior Detail', 'Detailing', 'Deep interior cleaning', 80.00, 90),
            ('Exterior Detail', 'Detailing', 'Paint correction and wax', 100.00, 120),
            ('Full Detail', 'Detailing', 'Complete interior and exterior detailing', 150.00, 180),
            ('Engine Cleaning', 'Specialty', 'Engine bay detail', 50.00, 45),
            ('Headlight Restoration', 'Specialty', 'Restore foggy headlights', 60.00, 60),
        ]

        for svc_name, cat_name, desc, price, duration in services_data:
            Service.objects.get_or_create(
                tenant=tenant,
                name=svc_name,
                defaults={
                    'category': categories[cat_name],
                    'description': desc,
                    'price': price,
                    'duration_minutes': duration,
                }
            )

    def create_staff(self, tenant, shop):
        from datetime import date
        staff_data = [
            ('John', 'Smith', 'Manager', '555-1001', 'john.smith@example.com'),
            ('Sarah', 'Johnson', 'Technician', '555-1002', 'sarah.j@example.com'),
            ('Mike', 'Davis', 'Detailer', '555-1003', 'mike.d@example.com'),
        ]

        for first, last, title, phone, email in staff_data:
            Staff.objects.get_or_create(
                tenant=tenant,
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'title': title,
                    'phone_number': phone,
                    'hire_date': date(2024, 1, 1),
                    'is_active': True,
                }
            )

    def create_customers_and_cars(self, tenant, car_types):
        customers_data = [
            ('John', 'Doe', '555-2001', 'john.doe@email.com', False),
            ('Jane', 'Smith', '555-2002', 'jane.smith@email.com', False),
            ('Bob', 'Johnson', '555-2003', 'bob.j@email.com', False),
            ('Corporate Fleet', 'Services', '555-3000', 'fleet@company.com', True),
        ]

        for first, last, phone, email, is_corp in customers_data:
            customer, created = Customer.objects.get_or_create(
                tenant=tenant,
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'phone_number': phone,
                    'is_corporate': is_corp,
                }
            )

            if created and not is_corp:
                # Create a car for individual customers
                Car.objects.create(
                    tenant=tenant,
                    customer=customer,
                    plate_number=f'ABC{customer.id:03d}',
                    make='Toyota',
                    model='Camry',
                    year=2020,
                    color='Silver'
                )
