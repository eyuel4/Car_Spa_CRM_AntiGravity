from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from tenants.models import Tenant, Shop
from customers.models import Customer, Car
from services.models import Service, Category, CarType, ServicePrice
from staff.models import Staff, EmergencyContact
from operations.models import Job, JobItem, JobTask
from operations.qc_models import QCChecklistItem, JobQCRecord, QCChecklistResponse
from inventory.models import Product, ServiceProductRequirement, StockLog
from loyalty.models import (
    LoyaltyConfiguration, LoyaltyTier, CustomerLoyalty, 
    RedemptionOption, LoyaltyTransaction
)
from billing.models import (
    TaxConfiguration, Discount, Receipt, Invoice, 
    InvoiceLineItem, Payment
)
from car_references.models import CarMake, CarModel
from notifications.models import NotificationChannel, RoleNotificationPreference

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive test data for all tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--subdomain',
            type=str,
            default='test',
            help='Subdomain for the test tenant (default: test)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self._clear_data()
            self.stdout.write(self.style.SUCCESS('Data cleared!'))

        subdomain = options['subdomain']
        self.stdout.write(self.style.SUCCESS(f'Starting comprehensive data seeding for tenant: {subdomain}...'))

        # Create Tenant
        tenant = self.create_tenant(subdomain)
        
        # Create User
        user = self.create_user(tenant)
        
        # Create Shop
        shop = self.create_shop(tenant)
        
        # Create Car References (global)
        car_makes_models = self.create_car_references()
        
        # Create Car Types
        car_types = self.create_car_types(tenant)
        
        # Create Categories
        categories = self.create_categories(tenant)
        
        # Create Services with Pricing
        services = self.create_services(tenant, categories, car_types)
        
        # Create Inventory Products
        products = self.create_products(tenant)
        
        # Link Products to Services
        self.link_products_to_services(tenant, services, products)
        
        # Create Loyalty Configuration
        loyalty_config = self.create_loyalty_config(tenant)
        loyalty_tiers = self.create_loyalty_tiers(tenant)
        redemption_options = self.create_redemption_options(tenant, services)
        
        # Create Tax Configuration
        tax_configs = self.create_tax_configs(tenant)
        
        # Create Discounts
        discounts = self.create_discounts(tenant)
        
        # Create Staff
        staff_members = self.create_staff(tenant, shop)
        
        # Create Emergency Contacts for Staff
        self.create_emergency_contacts(tenant, staff_members)
        
        # Create Customers (Individual and Corporate)
        customers = self.create_customers(tenant)
        
        # Create Cars
        cars = self.create_cars(tenant, customers, car_makes_models)
        
        # Create Customer Loyalty Records
        self.create_customer_loyalty(tenant, customers, loyalty_tiers)
        
        # Create QC Checklist Items
        qc_items = self.create_qc_checklist(tenant)
        
        # Create Jobs with different statuses
        jobs = self.create_jobs(tenant, customers, cars, services, staff_members)
        
        # Create Receipts and Payments
        self.create_receipts_and_payments(tenant, jobs, discounts, tax_configs)
        
        # Create Notification Channels
        self.create_notification_channels(tenant)
        
        # Create Role Notification Preferences
        self.create_role_notification_preferences(tenant)
        
        # Print Summary
        self.print_summary(tenant)

    def _clear_data(self):
        """Clear all tenant-aware data"""
        # Note: We don't delete Users or Car References (global)
        JobQCRecord.objects.all().delete()
        QCChecklistResponse.objects.all().delete()
        JobTask.objects.all().delete()
        JobItem.objects.all().delete()
        Job.objects.all().delete()
        QCChecklistItem.objects.all().delete()
        Payment.objects.all().delete()
        InvoiceLineItem.objects.all().delete()
        Invoice.objects.all().delete()
        Receipt.objects.all().delete()
        Discount.objects.all().delete()
        TaxConfiguration.objects.all().delete()
        LoyaltyTransaction.objects.all().delete()
        CustomerLoyalty.objects.all().delete()
        RedemptionOption.objects.all().delete()
        LoyaltyTier.objects.all().delete()
        LoyaltyConfiguration.objects.all().delete()
        StockLog.objects.all().delete()
        ServiceProductRequirement.objects.all().delete()
        Product.objects.all().delete()
        ServicePrice.objects.all().delete()
        Service.objects.all().delete()
        Category.objects.all().delete()
        CarType.objects.all().delete()
        Car.objects.all().delete()
        Customer.objects.all().delete()
        EmergencyContact.objects.all().delete()
        Staff.objects.all().delete()
        RoleNotificationPreference.objects.all().delete()
        NotificationChannel.objects.all().delete()
        Shop.objects.all().delete()
        Tenant.objects.all().delete()

    def create_tenant(self, subdomain):
        tenant, created = Tenant.objects.get_or_create(
            subdomain=subdomain,
            defaults={
                'name': 'Test Car Spa',
                'phone_number': '+251-911-123-456',
                'email': 'test@carspa.com',
                'address': '123 Test Street, Addis Ababa, Ethiopia',
                'language': 'en',
            }
        )
        if created:
            self.stdout.write(f'  ✓ Created tenant: {tenant.name}')
        else:
            self.stdout.write(f'  → Using existing tenant: {tenant.name}')
        return tenant

    def create_user(self, tenant):
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'testuser@carspa.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'OWNER',
                'tenant': tenant,
                'phone_number': '+251-911-000-001',
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(f'  ✓ Created user: {user.username} (password: testpass123)')
        else:
            self.stdout.write(f'  → Using existing user: {user.username}')
        return user

    def create_shop(self, tenant):
        shop, created = Shop.objects.get_or_create(
            tenant=tenant,
            name='Main Location',
            defaults={
                'address': '123 Test Street, Addis Ababa',
                'phone_number': '+251-911-123-457',
                'email': 'main@carspa.com',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(f'  ✓ Created shop: {shop.name}')
        else:
            self.stdout.write(f'  → Using existing shop: {shop.name}')
        return shop

    def create_car_references(self):
        """Create global car makes and models"""
        makes_data = {
            'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Hilux'],
            'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot'],
            'Ford': ['F-150', 'Explorer', 'Mustang', 'Ranger'],
            'BMW': ['3 Series', '5 Series', 'X5', 'X3'],
            'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE'],
        }
        
        car_makes_models = {}
        for make_name, models_list in makes_data.items():
            make, _ = CarMake.objects.get_or_create(name=make_name)
            car_makes_models[make_name] = {'make': make, 'models': []}
            
            for model_name in models_list:
                model, _ = CarModel.objects.get_or_create(
                    make=make,
                    name=model_name
                )
                car_makes_models[make_name]['models'].append(model)
        
        self.stdout.write(f'  ✓ Created {CarMake.objects.count()} car makes and {CarModel.objects.count()} models')
        return car_makes_models

    def create_car_types(self, tenant):
        car_types = {}
        types_data = ['Sedan', 'SUV', 'Truck', 'Van', 'Luxury', 'Coupe', 'Hatchback']
        
        for type_name in types_data:
            car_type, _ = CarType.objects.get_or_create(
                tenant=tenant,
                name=type_name
            )
            car_types[type_name] = car_type
        
        self.stdout.write(f'  ✓ Created {len(car_types)} car types')
        return car_types

    def create_categories(self, tenant):
        categories = {}
        categories_data = [
            ('Basic Wash', 'Standard washing services'),
            ('Detailing', 'Premium detailing services'),
            ('Specialty', 'Specialized services'),
            ('Interior', 'Interior cleaning and treatment'),
        ]
        
        for cat_name, cat_desc in categories_data:
            category, _ = Category.objects.get_or_create(
                tenant=tenant,
                name=cat_name,
                defaults={'description': cat_desc}
            )
            categories[cat_name] = category
        
        self.stdout.write(f'  ✓ Created {len(categories)} categories')
        return categories

    def create_services(self, tenant, categories, car_types):
        services = {}
        services_data = [
            ('Express Wash', 'Basic Wash', 'Quick exterior wash', 15.00, 15),
            ('Deluxe Wash', 'Basic Wash', 'Exterior wash + interior vacuum', 25.00, 25),
            ('Premium Wash', 'Basic Wash', 'Full wash with wax', 35.00, 35),
            ('Interior Detail', 'Detailing', 'Deep interior cleaning', 80.00, 90),
            ('Exterior Detail', 'Detailing', 'Paint correction and wax', 100.00, 120),
            ('Full Detail', 'Detailing', 'Complete interior and exterior detailing', 150.00, 180),
            ('Engine Cleaning', 'Specialty', 'Engine bay detail', 50.00, 45),
            ('Headlight Restoration', 'Specialty', 'Restore foggy headlights', 60.00, 60),
            ('Leather Treatment', 'Interior', 'Leather conditioning and protection', 40.00, 60),
            ('Carpet Shampoo', 'Interior', 'Deep carpet cleaning', 35.00, 45),
        ]

        for svc_name, cat_name, desc, base_price, duration in services_data:
            service, created = Service.objects.get_or_create(
                tenant=tenant,
                name=svc_name,
                defaults={
                    'category': categories[cat_name],
                    'description': desc,
                    'price': base_price,
                    'duration_minutes': duration,
                }
            )
            services[svc_name] = service
            
            # Create pricing for different car types
            if created:
                for car_type_name, car_type in car_types.items():
                    multiplier = 1.0
                    if car_type_name == 'SUV':
                        multiplier = 1.3
                    elif car_type_name == 'Truck':
                        multiplier = 1.5
                    elif car_type_name == 'Luxury':
                        multiplier = 1.2
                    
                    ServicePrice.objects.get_or_create(
                        tenant=tenant,
                        service=service,
                        car_type=car_type,
                        defaults={
                            'price': Decimal(str(base_price * multiplier)),
                            'duration_minutes': duration,
                        }
                    )
        
        self.stdout.write(f'  ✓ Created {len(services)} services with pricing')
        return services

    def create_products(self, tenant):
        products = {}
        products_data = [
            ('Car Shampoo', 'ml', 5000, 500),
            ('Wax', 'ml', 2000, 200),
            ('Interior Cleaner', 'ml', 3000, 300),
            ('Tire Shine', 'ml', 1500, 150),
            ('Glass Cleaner', 'ml', 2500, 250),
            ('Microfiber Towels', 'pcs', 100, 10),
            ('Sponges', 'pcs', 50, 5),
        ]
        
        for name, unit, stock, reorder in products_data:
            product, _ = Product.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'unit': unit,
                    'current_stock': stock,
                    'reorder_level': reorder,
                }
            )
            products[name] = product
            
            # Create stock log entry
            if Product.objects.filter(tenant=tenant, name=name).count() == 1:
                StockLog.objects.create(
                    tenant=tenant,
                    product=product,
                    change_amount=stock,
                    reason='Initial stock'
                )
        
        self.stdout.write(f'  ✓ Created {len(products)} products')
        return products

    def link_products_to_services(self, tenant, services, products):
        requirements = [
            ('Premium Wash', 'Car Shampoo', 100),
            ('Premium Wash', 'Wax', 50),
            ('Interior Detail', 'Interior Cleaner', 200),
            ('Interior Detail', 'Microfiber Towels', 5),
            ('Full Detail', 'Car Shampoo', 150),
            ('Full Detail', 'Wax', 75),
            ('Full Detail', 'Interior Cleaner', 250),
            ('Full Detail', 'Tire Shine', 100),
            ('Full Detail', 'Microfiber Towels', 10),
        ]
        
        for svc_name, prod_name, qty in requirements:
            if svc_name in services and prod_name in products:
                ServiceProductRequirement.objects.get_or_create(
                    tenant=tenant,
                    service=services[svc_name],
                    product=products[prod_name],
                    defaults={'quantity_required': qty}
                )
        
        self.stdout.write(f'  ✓ Linked products to services')

    def create_loyalty_config(self, tenant):
        config, _ = LoyaltyConfiguration.objects.get_or_create(
            tenant=tenant,
            defaults={
                'points_per_dollar': Decimal('1.0'),
                'points_expiry_days': 365,
            }
        )
        self.stdout.write(f'  ✓ Created loyalty configuration')
        return config

    def create_loyalty_tiers(self, tenant):
        tiers = {}
        tiers_data = [
            ('BRONZE', 0, Decimal('1.0'), Decimal('0')),
            ('SILVER', 500, Decimal('1.1'), Decimal('5')),
            ('GOLD', 1500, Decimal('1.25'), Decimal('10')),
            ('PLATINUM', 5000, Decimal('1.5'), Decimal('15')),
        ]
        
        for name, min_points, multiplier, discount in tiers_data:
            tier, _ = LoyaltyTier.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'min_points_required': min_points,
                    'points_multiplier': multiplier,
                    'discount_percentage': discount,
                }
            )
            tiers[name] = tier
        
        self.stdout.write(f'  ✓ Created {len(tiers)} loyalty tiers')
        return tiers

    def create_redemption_options(self, tenant, services):
        options = {}
        redemption_data = [
            ('10% Discount', 100, 'DISCOUNT', None, None),
            ('20% Discount', 200, 'DISCOUNT', None, None),
            ('Free Express Wash', 150, 'FREE_SERVICE', None, 'Express Wash'),
            ('Free Premium Wash', 300, 'FREE_SERVICE', None, 'Premium Wash'),
        ]
        
        for name, points, r_type, discount_val, service_name in redemption_data:
            free_service = None
            if service_name and service_name in services:
                free_service = services[service_name]
            
            option, _ = RedemptionOption.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'points_required': points,
                    'redemption_type': r_type,
                    'discount_value': discount_val,
                    'free_service': free_service,
                    'is_active': True,
                }
            )
            options[name] = option
        
        self.stdout.write(f'  ✓ Created {len(options)} redemption options')
        return options

    def create_tax_configs(self, tenant):
        configs = {}
        tax_data = [
            ('VAT', Decimal('0.15')),  # 15% VAT
            ('Service Tax', Decimal('0.05')),  # 5% Service Tax
        ]
        
        for name, rate in tax_data:
            config, _ = TaxConfiguration.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'rate': rate,
                    'is_active': True,
                }
            )
            configs[name] = config
        
        self.stdout.write(f'  ✓ Created {len(configs)} tax configurations')
        return configs

    def create_discounts(self, tenant):
        discounts = {}
        discount_data = [
            ('New Customer Discount', 'PERCENTAGE', Decimal('10'), True),
            ('Weekend Special', 'PERCENTAGE', Decimal('15'), True),
            ('Bulk Service Discount', 'FIXED', Decimal('20'), True),
        ]
        
        for name, d_type, value, is_active in discount_data:
            discount, _ = Discount.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'discount_type': d_type,
                    'value': value,
                    'is_active': is_active,
                }
            )
            discounts[name] = discount
        
        self.stdout.write(f'  ✓ Created {len(discounts)} discounts')
        return discounts

    def create_staff(self, tenant, shop):
        staff_members = []
        staff_data = [
            ('John', 'Smith', 'Manager', '+251-911-100-001', 'john.smith@carspa.com', True, Decimal('5000')),
            ('Sarah', 'Johnson', 'Senior Detailer', '+251-911-100-002', 'sarah.j@carspa.com', False, Decimal('3500')),
            ('Mike', 'Davis', 'Detailer', '+251-911-100-003', 'mike.d@carspa.com', False, Decimal('3000')),
            ('Emily', 'Brown', 'Wash Specialist', '+251-911-100-004', 'emily.b@carspa.com', False, Decimal('2800')),
            ('David', 'Wilson', 'Interior Specialist', '+251-911-100-005', 'david.w@carspa.com', False, Decimal('3200')),
        ]
        
        for first, last, title, phone, email, is_manager, salary in staff_data:
            staff, created = Staff.objects.get_or_create(
                tenant=tenant,
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'title': title,
                    'phone_number': phone,
                    'hire_date': date(2024, 1, 1),
                    'is_active': True,
                    'is_manager': is_manager,
                    'shop': shop,
                    'salary': salary,
                }
            )
            staff_members.append(staff)
        
        self.stdout.write(f'  ✓ Created {len(staff_members)} staff members')
        return staff_members

    def create_emergency_contacts(self, tenant, staff_members):
        if not staff_members:
            return
        
        contact_data = [
            ('Jane', 'Smith', 'MALE', '+251-911-200-001', 'Spouse', True),
            ('Robert', 'Johnson', 'MALE', '+251-911-200-002', 'Parent', False),
        ]
        
        for first, last, sex, phone, relationship, is_primary in contact_data:
            if staff_members:
                EmergencyContact.objects.get_or_create(
                    tenant=tenant,
                    staff=staff_members[0],
                    phone=phone,
                    defaults={
                        'first_name': first,
                        'last_name': last,
                        'sex': sex,
                        'relationship': relationship,
                        'is_primary': is_primary,
                    }
                )
        
        self.stdout.write(f'  ✓ Created emergency contacts')

    def create_customers(self, tenant):
        customers = []
        customers_data = [
            # Individual customers
            ('John', 'Doe', 'INDIVIDUAL', '+251-911-200-001', 'john.doe@email.com', False, 'MALE', None, None),
            ('Jane', 'Smith', 'INDIVIDUAL', '+251-911-200-002', 'jane.smith@email.com', False, 'FEMALE', None, None),
            ('Bob', 'Johnson', 'INDIVIDUAL', '+251-911-200-003', 'bob.j@email.com', False, 'MALE', None, None),
            ('Alice', 'Brown', 'INDIVIDUAL', '+251-911-200-004', 'alice.brown@email.com', False, 'FEMALE', None, None),
            ('Charlie', 'Wilson', 'INDIVIDUAL', '+251-911-200-005', 'charlie.w@email.com', False, 'MALE', None, None),
            # Corporate customers
            (None, None, 'CORPORATE', '+251-911-300-001', 'fleet@company.com', True, None, 'Corporate Fleet Services', 'TIN-123456'),
            (None, None, 'CORPORATE', '+251-911-300-002', 'business@enterprise.com', True, None, 'Enterprise Solutions Ltd', 'TIN-789012'),
        ]
        
        for first, last, c_type, phone, email, is_corp, sex, company_name, tin in customers_data:
            defaults = {
                'phone_number': phone,
                'email': email,
                'customer_type': c_type,
                'is_corporate': is_corp,
            }
            
            if c_type == 'INDIVIDUAL':
                defaults.update({
                    'first_name': first,
                    'last_name': last,
                    'sex': sex,
                })
            else:
                defaults.update({
                    'company_name': company_name,
                    'tin_number': tin,
                })
            
            customer, _ = Customer.objects.get_or_create(
                tenant=tenant,
                phone_number=phone,
                defaults=defaults
            )
            customers.append(customer)
        
        self.stdout.write(f'  ✓ Created {len(customers)} customers')
        return customers

    def create_cars(self, tenant, customers, car_makes_models):
        cars = []
        car_data = [
            ('Toyota', 'Camry', 'ABC-123', 2020, 'Silver', 'SEDAN'),
            ('Honda', 'CR-V', 'XYZ-789', 2021, 'Blue', 'SUV'),
            ('Ford', 'F-150', 'TRK-456', 2019, 'Black', 'TRUCK'),
            ('Toyota', 'RAV4', 'SUV-001', 2022, 'White', 'SUV'),
            ('BMW', '3 Series', 'LUX-001', 2023, 'Black', 'SEDAN'),
            ('Toyota', 'Hilux', 'FLEET-001', 2021, 'White', 'TRUCK'),
            ('Honda', 'Civic', 'FLEET-002', 2022, 'Gray', 'SEDAN'),
        ]
        
        for make_name, model_name, plate, year, color, car_type in car_data:
            # Find customer (assign to first individual customer, or corporate if fleet)
            customer = None
            if 'FLEET' in plate:
                # Assign to corporate customer
                customer = next((c for c in customers if c.customer_type == 'CORPORATE'), customers[0] if customers else None)
            else:
                # Assign to individual customer
                customer = next((c for c in customers if c.customer_type == 'INDIVIDUAL'), customers[0] if customers else None)
            
            if not customer:
                continue
            
            # Get make and model references
            make_ref = None
            model_ref = None
            if make_name in car_makes_models:
                make_ref = car_makes_models[make_name]['make']
                model_ref = next((m for m in car_makes_models[make_name]['models'] if m.name == model_name), None)
            
            car, _ = Car.objects.get_or_create(
                tenant=tenant,
                customer=customer,
                plate_number=plate,
                defaults={
                    'make': make_ref,
                    'model': model_ref,
                    'make_text': make_name,
                    'model_text': model_name,
                    'year': year,
                    'color': color,
                    'car_type': car_type,
                }
            )
            cars.append(car)
        
        self.stdout.write(f'  ✓ Created {len(cars)} cars')
        return cars

    def create_customer_loyalty(self, tenant, customers, loyalty_tiers):
        for customer in customers:
            if customer.customer_type == 'INDIVIDUAL':
                # Assign some points to individual customers
                points = 0
                tier = None
                
                # First customer gets Gold tier
                if customer == customers[0]:
                    points = 2000
                    tier = loyalty_tiers.get('GOLD')
                # Second customer gets Silver tier
                elif customer == customers[1]:
                    points = 800
                    tier = loyalty_tiers.get('SILVER')
                # Third customer gets Bronze tier
                elif customer == customers[2]:
                    points = 200
                    tier = loyalty_tiers.get('BRONZE')
                
                customer.loyalty_points = points
                customer.total_lifetime_points = points
                customer.current_tier = tier
                if tier:
                    customer.tier_achieved_date = date.today() - timedelta(days=30)
                customer.save()
        
        self.stdout.write(f'  ✓ Created customer loyalty records')

    def create_qc_checklist(self, tenant):
        qc_items = []
        checklist_data = [
            ('Exterior Clean', 1),
            ('Interior Vacuumed', 2),
            ('Windows Clear', 3),
            ('Tires Dressed', 4),
            ('Air Freshener', 5),
            ('Dashboard Cleaned', 6),
            ('Trunk Organized', 7),
        ]
        
        for name, order in checklist_data:
            item, _ = QCChecklistItem.objects.get_or_create(
                tenant=tenant,
                name=name,
                defaults={
                    'order': order,
                    'is_active': True,
                }
            )
            qc_items.append(item)
        
        self.stdout.write(f'  ✓ Created {len(qc_items)} QC checklist items')
        return qc_items

    def create_jobs(self, tenant, customers, cars, services, staff_members):
        jobs = []
        
        # Job 1: PENDING
        if customers and cars:
            customer1 = next((c for c in customers if c.customer_type == 'INDIVIDUAL'), customers[0])
            car1 = next((c for c in cars if c.customer == customer1), cars[0])
            job1 = Job.objects.create(
                tenant=tenant,
                customer=customer1,
                car=car1,
                status='PENDING'
            )
            JobItem.objects.create(
                tenant=tenant,
                job=job1,
                service=services.get('Express Wash'),
                price=services['Express Wash'].price
            )
            jobs.append(job1)
        
        # Job 2: IN_PROGRESS
        if len(customers) > 1 and len(cars) > 1:
            customer2 = customers[1] if len(customers) > 1 else customers[0]
            car2 = next((c for c in cars if c.customer == customer2), cars[1] if len(cars) > 1 else cars[0])
            job2 = Job.objects.create(
                tenant=tenant,
                customer=customer2,
                car=car2,
                status='IN_PROGRESS'
            )
            item2a = JobItem.objects.create(
                tenant=tenant,
                job=job2,
                service=services.get('Premium Wash'),
                price=services['Premium Wash'].price
            )
            item2b = JobItem.objects.create(
                tenant=tenant,
                job=job2,
                service=services.get('Leather Treatment'),
                price=services['Leather Treatment'].price
            )
            if staff_members:
                JobTask.objects.create(
                    tenant=tenant,
                    job_item=item2a,
                    staff=staff_members[0],
                    task_name='Premium Wash',
                    status='DONE'
                )
                JobTask.objects.create(
                    tenant=tenant,
                    job_item=item2b,
                    staff=staff_members[1] if len(staff_members) > 1 else staff_members[0],
                    task_name='Leather Treatment',
                    status='IN_PROGRESS'
                )
            jobs.append(job2)
        
        # Job 3: QC
        if len(customers) > 2 and len(cars) > 2:
            customer3 = customers[2] if len(customers) > 2 else customers[0]
            car3 = next((c for c in cars if c.customer == customer3), cars[2] if len(cars) > 2 else cars[0])
            job3 = Job.objects.create(
                tenant=tenant,
                customer=customer3,
                car=car3,
                status='QC'
            )
            item3 = JobItem.objects.create(
                tenant=tenant,
                job=job3,
                service=services.get('Full Detail'),
                price=services['Full Detail'].price
            )
            if staff_members:
                JobTask.objects.create(
                    tenant=tenant,
                    job_item=item3,
                    staff=staff_members[2] if len(staff_members) > 2 else staff_members[0],
                    task_name='Full Detail',
                    status='DONE'
                )
            jobs.append(job3)
        
        # Job 4: COMPLETED
        if len(customers) > 3 and len(cars) > 3:
            customer4 = customers[3] if len(customers) > 3 else customers[0]
            car4 = next((c for c in cars if c.customer == customer4), cars[3] if len(cars) > 3 else cars[0])
            job4 = Job.objects.create(
                tenant=tenant,
                customer=customer4,
                car=car4,
                status='COMPLETED',
                completed_at=timezone.now() - timedelta(hours=2)
            )
            JobItem.objects.create(
                tenant=tenant,
                job=job4,
                service=services.get('Interior Detail'),
                price=services['Interior Detail'].price
            )
            jobs.append(job4)
        
        # Job 5: PAID
        if len(customers) > 4 and len(cars) > 4:
            customer5 = customers[4] if len(customers) > 4 else customers[0]
            car5 = next((c for c in cars if c.customer == customer5), cars[4] if len(cars) > 4 else cars[0])
            job5 = Job.objects.create(
                tenant=tenant,
                customer=customer5,
                car=car5,
                status='PAID',
                payment_method='CASH',
                completed_at=timezone.now() - timedelta(days=1)
            )
            JobItem.objects.create(
                tenant=tenant,
                job=job5,
                service=services.get('Exterior Detail'),
                price=services['Exterior Detail'].price
            )
            jobs.append(job5)
        
        self.stdout.write(f'  ✓ Created {len(jobs)} jobs with various statuses')
        return jobs

    def create_receipts_and_payments(self, tenant, jobs, discounts, tax_configs):
        from django.utils import timezone
        import uuid
        
        # Create receipt for PAID job
        paid_job = next((j for j in jobs if j.status == 'PAID'), None)
        if paid_job:
            subtotal = sum(item.price for item in paid_job.items.all())
            tax_rate = tax_configs.get('VAT').rate if tax_configs.get('VAT') else Decimal('0')
            tax_amount = subtotal * tax_rate
            total = subtotal + tax_amount
            
            receipt, _ = Receipt.objects.get_or_create(
                tenant=tenant,
                job=paid_job,
                defaults={
                    'receipt_number': f'RCP-{uuid.uuid4().hex[:8].upper()}',
                    'subtotal': subtotal,
                    'tax_amount': tax_amount,
                    'discount_amount': Decimal('0'),
                    'total': total,
                }
            )
            
            Payment.objects.get_or_create(
                tenant=tenant,
                job=paid_job,
                defaults={
                    'amount': total,
                    'payment_method': 'CASH',
                    'payment_date': timezone.now() - timedelta(days=1),
                }
            )
        
        # Create invoice for corporate customer
        corporate_customers = Customer.objects.filter(tenant=tenant, customer_type='CORPORATE')
        if corporate_customers and jobs:
            corporate_customer = corporate_customers.first()
            corporate_jobs = [j for j in jobs if j.customer == corporate_customer]
            
            if corporate_jobs:
                invoice_subtotal = sum(sum(item.price for item in job.items.all()) for job in corporate_jobs)
                tax_rate = tax_configs.get('VAT').rate if tax_configs.get('VAT') else Decimal('0')
                invoice_tax = invoice_subtotal * tax_rate
                invoice_total = invoice_subtotal + invoice_tax
                
                invoice, _ = Invoice.objects.get_or_create(
                    tenant=tenant,
                    customer=corporate_customer,
                    invoice_number=f'INV-{uuid.uuid4().hex[:8].upper()}',
                    defaults={
                        'billing_period_start': date.today() - timedelta(days=30),
                        'billing_period_end': date.today(),
                        'subtotal': invoice_subtotal,
                        'tax_amount': invoice_tax,
                        'discount_amount': Decimal('0'),
                        'total': invoice_total,
                        'due_date': date.today() + timedelta(days=30),
                        'status': 'DRAFT',
                    }
                )
                
                for job in corporate_jobs:
                    InvoiceLineItem.objects.get_or_create(
                        tenant=tenant,
                        invoice=invoice,
                        job=job,
                        defaults={
                            'description': f'Job #{job.id}',
                            'amount': sum(item.price for item in job.items.all()),
                        }
                    )
        
        self.stdout.write(f'  ✓ Created receipts and payments')

    def create_notification_channels(self, tenant):
        channels = ['WHATSAPP', 'EMAIL', 'SMS']
        
        for channel_type in channels:
            NotificationChannel.objects.get_or_create(
                tenant=tenant,
                channel_type=channel_type,
                defaults={
                    'is_active': True,
                    'api_credentials': {},
                }
            )
        
        self.stdout.write(f'  ✓ Created notification channels')

    def create_role_notification_preferences(self, tenant):
        roles = ['OWNER', 'MANAGER', 'STAFF']
        
        for role in roles:
            RoleNotificationPreference.objects.get_or_create(
                tenant=tenant,
                role=role,
                defaults={
                    'job_created_enabled': True,
                    'job_completed_enabled': True,
                    'payment_received_enabled': True,
                    'low_stock_enabled': True,
                    'new_customer_enabled': True,
                }
            )
        
        self.stdout.write(f'  ✓ Created role notification preferences')

    def print_summary(self, tenant):
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'\nSummary for tenant: {tenant.name} ({tenant.subdomain})')
        self.stdout.write(f'  • Tenants: {Tenant.objects.filter(subdomain=tenant.subdomain).count()}')
        self.stdout.write(f'  • Users: {User.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Shops: {Shop.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Car Makes: {CarMake.objects.count()}')
        self.stdout.write(f'  • Car Models: {CarModel.objects.count()}')
        self.stdout.write(f'  • Car Types: {CarType.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Categories: {Category.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Services: {Service.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Service Prices: {ServicePrice.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Products: {Product.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Staff: {Staff.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Customers: {Customer.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Cars: {Car.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Jobs: {Job.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Job Items: {JobItem.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Job Tasks: {JobTask.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • QC Checklist Items: {QCChecklistItem.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Loyalty Tiers: {LoyaltyTier.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Redemption Options: {RedemptionOption.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Tax Configs: {TaxConfiguration.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Discounts: {Discount.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Receipts: {Receipt.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Invoices: {Invoice.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Payments: {Payment.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'  • Notification Channels: {NotificationChannel.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'\nLogin credentials:')
        self.stdout.write(f'  Username: testuser')
        self.stdout.write(f'  Password: testpass123')
        self.stdout.write(f'\nYou can now validate the app with comprehensive test data!')

