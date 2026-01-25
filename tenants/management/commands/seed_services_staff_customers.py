from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from tenants.models import Tenant, Shop
from services.models import Category, CarType, Service, ServicePrice
from staff.models import Staff, EmergencyContact
from customers.models import Customer, Car
from car_references.models import CarMake, CarModel


class Command(BaseCommand):
    help = 'Creates test data for services, staff, and customers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--subdomain',
            type=str,
            default='test',
            help='Subdomain for the tenant (default: test)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        subdomain = options['subdomain']
        clear = options['clear']

        # Get or create tenant
        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
            self.stdout.write(self.style.SUCCESS(f'Found tenant: {tenant.name} ({subdomain})'))
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Tenant with subdomain "{subdomain}" not found.'))
            self.stdout.write(self.style.ERROR('Please create the tenant first or use seed_all_data command.'))
            return

        # Get or create shop
        shop, _ = Shop.objects.get_or_create(
            tenant=tenant,
            name='Main Location',
            defaults={
                'address': '123 Test Street, Addis Ababa',
                'phone_number': '251911123456',
                'email': 'main@carspa.com',
                'is_active': True,
            }
        )

        if clear:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Car.objects.filter(tenant=tenant).delete()
            Customer.objects.filter(tenant=tenant).delete()
            EmergencyContact.objects.filter(tenant=tenant).delete()
            Staff.objects.filter(tenant=tenant).delete()
            ServicePrice.objects.filter(tenant=tenant).delete()
            Service.objects.filter(tenant=tenant).delete()
            Category.objects.filter(tenant=tenant).delete()
            CarType.objects.filter(tenant=tenant).delete()
            self.stdout.write(self.style.SUCCESS('Data cleared!'))

        # Create Services
        self.create_services(tenant)
        
        # Create Staff
        self.create_staff(tenant, shop)
        
        # Create Customers
        self.create_customers(tenant)

        # Print summary
        self.print_summary(tenant)

    def create_services(self, tenant):
        self.stdout.write(self.style.SUCCESS('\nCreating Services...'))
        
        # Create Car Types
        car_types = {}
        car_type_names = ['Sedan', 'SUV', 'Truck', 'Van', 'Luxury', 'Coupe', 'Hatchback']
        for type_name in car_type_names:
            car_type, _ = CarType.objects.get_or_create(
                tenant=tenant,
                name=type_name
            )
            car_types[type_name] = car_type
        self.stdout.write(f'  ✓ Created {len(car_types)} car types')

        # Create Categories
        categories = {}
        categories_data = [
            ('Basic Wash', 'Standard exterior and interior washing services'),
            ('Premium Detailing', 'High-end detailing and protection services'),
            ('Interior Services', 'Interior cleaning, vacuuming, and treatment'),
            ('Exterior Services', 'Exterior cleaning, polishing, and protection'),
            ('Specialty Services', 'Specialized services like engine cleaning, headlight restoration'),
        ]
        
        for cat_name, cat_desc in categories_data:
            category, _ = Category.objects.get_or_create(
                tenant=tenant,
                name=cat_name,
                defaults={'description': cat_desc}
            )
            categories[cat_name] = category
        self.stdout.write(f'  ✓ Created {len(categories)} categories')

        # Create Services
        services_data = [
            # Basic Wash services
            ('Express Wash', 'Basic Wash', 'Quick exterior wash and dry', 15.00, 20),
            ('Standard Wash', 'Basic Wash', 'Exterior wash with tire cleaning', 25.00, 30),
            ('Deluxe Wash', 'Basic Wash', 'Exterior wash + interior vacuum', 35.00, 40),
            ('Premium Wash', 'Basic Wash', 'Full wash with wax and tire shine', 45.00, 50),
            
            # Premium Detailing services
            ('Interior Detail', 'Premium Detailing', 'Deep interior cleaning and conditioning', 80.00, 90),
            ('Exterior Detail', 'Premium Detailing', 'Paint correction, polish, and wax', 120.00, 120),
            ('Full Detail', 'Premium Detailing', 'Complete interior and exterior detailing', 180.00, 180),
            ('Ceramic Coating', 'Premium Detailing', 'Premium ceramic coating application', 500.00, 240),
            
            # Interior Services
            ('Interior Vacuum', 'Interior Services', 'Complete interior vacuuming', 20.00, 25),
            ('Leather Treatment', 'Interior Services', 'Leather conditioning and protection', 40.00, 45),
            ('Carpet Shampoo', 'Interior Services', 'Deep carpet cleaning', 35.00, 40),
            ('Interior Sanitization', 'Interior Services', 'UV sanitization and odor removal', 50.00, 30),
            
            # Exterior Services
            ('Hand Wax', 'Exterior Services', 'Hand-applied carnauba wax', 60.00, 60),
            ('Paint Protection Film', 'Exterior Services', 'Clear bra installation', 800.00, 300),
            ('Tire Shine', 'Exterior Services', 'Tire cleaning and shine treatment', 15.00, 15),
            
            # Specialty Services
            ('Engine Bay Cleaning', 'Specialty Services', 'Deep clean engine compartment', 50.00, 45),
            ('Headlight Restoration', 'Specialty Services', 'Restore foggy headlights', 60.00, 60),
            ('Windshield Treatment', 'Specialty Services', 'Water repellent treatment', 30.00, 20),
            ('Undercarriage Wash', 'Specialty Services', 'Undercarriage cleaning', 40.00, 30),
        ]

        services = {}
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
                    elif car_type_name == 'Van':
                        multiplier = 1.4
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

    def create_staff(self, tenant, shop):
        self.stdout.write(self.style.SUCCESS('\nCreating Staff...'))
        
        staff_data = [
            # Managers
            ('John', 'Smith', 'General Manager', '251911100001', 'john.smith@carspa.com', True, Decimal('6000'), 'MALE', date(1990, 5, 15)),
            ('Sarah', 'Johnson', 'Operations Manager', '251911100002', 'sarah.j@carspa.com', True, Decimal('5500'), 'FEMALE', date(1992, 8, 20)),
            
            # Senior Staff
            ('Mike', 'Davis', 'Senior Detailer', '251911100003', 'mike.d@carspa.com', False, Decimal('4000'), 'MALE', date(1995, 3, 10)),
            ('Emily', 'Brown', 'Senior Wash Specialist', '251911100004', 'emily.b@carspa.com', False, Decimal('3800'), 'FEMALE', date(1994, 11, 5)),
            ('David', 'Wilson', 'Interior Specialist', '251911100005', 'david.w@carspa.com', False, Decimal('3900'), 'MALE', date(1996, 7, 22)),
            
            # Regular Staff
            ('James', 'Taylor', 'Detailer', '251911100006', 'james.t@carspa.com', False, Decimal('3200'), 'MALE', date(1998, 2, 14)),
            ('Lisa', 'Anderson', 'Wash Technician', '251911100007', 'lisa.a@carspa.com', False, Decimal('3000'), 'FEMALE', date(1999, 9, 30)),
            ('Robert', 'Martinez', 'Detailer', '251911100008', 'robert.m@carspa.com', False, Decimal('3100'), 'MALE', date(1997, 4, 18)),
            ('Maria', 'Garcia', 'Interior Technician', '251911100009', 'maria.g@carspa.com', False, Decimal('3050'), 'FEMALE', date(1998, 12, 8)),
            ('Kevin', 'Lee', 'Wash Specialist', '251911100010', 'kevin.l@carspa.com', False, Decimal('2950'), 'MALE', date(2000, 6, 25)),
            
            # Part-time/Entry Level
            ('Alex', 'Chen', 'Junior Detailer', '251911100011', 'alex.c@carspa.com', False, Decimal('2500'), 'MALE', date(2001, 1, 12)),
            ('Sophia', 'Rodriguez', 'Junior Wash Technician', '251911100012', 'sophia.r@carspa.com', False, Decimal('2400'), 'FEMALE', date(2002, 10, 3)),
        ]

        staff_members = []
        hire_dates = [
            date(2022, 1, 15),  # Managers
            date(2022, 3, 1),
            date(2022, 5, 10),   # Senior Staff
            date(2022, 6, 20),
            date(2022, 8, 5),
            date(2023, 2, 15),   # Regular Staff
            date(2023, 4, 1),
            date(2023, 5, 20),
            date(2023, 7, 10),
            date(2023, 9, 5),
            date(2024, 1, 10),   # Entry Level
            date(2024, 3, 1),
        ]

        for i, (first, last, title, phone, email, is_manager, salary, sex, dob) in enumerate(staff_data):
            staff, created = Staff.objects.get_or_create(
                tenant=tenant,
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'title': title,
                    'phone_number': phone,
                    'hire_date': hire_dates[i] if i < len(hire_dates) else date(2023, 1, 1),
                    'is_active': True,
                    'is_manager': is_manager,
                    'shop': shop,
                    'salary': salary,
                    'sex': sex,
                    'date_of_birth': dob,
                    'address': f'{i+1} Staff Street, Addis Ababa',
                    'city': 'Addis Ababa',
                    'state': 'Addis Ababa',
                    'country': 'Ethiopia',
                }
            )
            staff_members.append(staff)
            
            # Create emergency contact for managers and senior staff
            if is_manager or i < 5:
                EmergencyContact.objects.get_or_create(
                    tenant=tenant,
                    staff=staff,
                    phone=f'25191120000{i+1}',
                    defaults={
                        'first_name': f'Emergency {first}',
                        'last_name': last,
                        'sex': 'MALE' if sex == 'FEMALE' else 'FEMALE',
                        'relationship': 'Spouse' if i % 2 == 0 else 'Parent',
                        'is_primary': True,
                    }
                )

        self.stdout.write(f'  ✓ Created {len(staff_members)} staff members')
        return staff_members

    def create_customers(self, tenant):
        self.stdout.write(self.style.SUCCESS('\nCreating Customers...'))
        
        # Get or create car makes/models
        toyota_make, _ = CarMake.objects.get_or_create(name='Toyota')
        honda_make, _ = CarMake.objects.get_or_create(name='Honda')
        ford_make, _ = CarMake.objects.get_or_create(name='Ford')
        bmw_make, _ = CarMake.objects.get_or_create(name='BMW')
        mercedes_make, _ = CarMake.objects.get_or_create(name='Mercedes-Benz')
        
        car_models_data = {
            'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Hilux', 'Prius'],
            'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
            'Ford': ['F-150', 'Explorer', 'Mustang', 'Ranger', 'Escape'],
            'BMW': ['3 Series', '5 Series', 'X5', 'X3', '7 Series'],
            'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC'],
        }
        
        car_models = {}
        for make_name, model_names in car_models_data.items():
            make = {'Toyota': toyota_make, 'Honda': honda_make, 'Ford': ford_make, 
                   'BMW': bmw_make, 'Mercedes-Benz': mercedes_make}[make_name]
            car_models[make_name] = {}
            for model_name in model_names:
                model, _ = CarModel.objects.get_or_create(make=make, name=model_name)
                car_models[make_name][model_name] = model

        # Individual Customers
        individual_customers_data = [
            ('John', 'Doe', 'INDIVIDUAL', '251911200001', 'john.doe@email.com', 'MALE', date(1985, 3, 15), 'Toyota', 'Camry', 'ABC-1234', 2020, 'Silver', 'SEDAN'),
            ('Jane', 'Smith', 'INDIVIDUAL', '251911200002', 'jane.smith@email.com', 'FEMALE', date(1990, 7, 22), 'Honda', 'CR-V', 'XYZ-5678', 2021, 'Blue', 'SUV'),
            ('Bob', 'Johnson', 'INDIVIDUAL', '251911200003', 'bob.j@email.com', 'MALE', date(1988, 11, 5), 'Ford', 'F-150', 'TRK-9012', 2019, 'Black', 'TRUCK'),
            ('Alice', 'Brown', 'INDIVIDUAL', '251911200004', 'alice.brown@email.com', 'FEMALE', date(1992, 5, 18), 'BMW', '3 Series', 'LUX-3456', 2023, 'White', 'SEDAN'),
            ('Charlie', 'Wilson', 'INDIVIDUAL', '251911200005', 'charlie.w@email.com', 'MALE', date(1987, 9, 30), 'Toyota', 'RAV4', 'SUV-7890', 2022, 'Red', 'SUV'),
            ('Diana', 'Martinez', 'INDIVIDUAL', '251911200006', 'diana.m@email.com', 'FEMALE', date(1995, 2, 14), 'Honda', 'Civic', 'CIV-2468', 2021, 'Gray', 'SEDAN'),
            ('Edward', 'Taylor', 'INDIVIDUAL', '251911200007', 'edward.t@email.com', 'MALE', date(1983, 12, 8), 'Mercedes-Benz', 'E-Class', 'MBZ-1357', 2022, 'Black', 'SEDAN'),
            ('Fiona', 'Anderson', 'INDIVIDUAL', '251911200008', 'fiona.a@email.com', 'FEMALE', date(1991, 6, 25), 'BMW', 'X5', 'BMW-8024', 2023, 'Blue', 'SUV'),
            ('George', 'Lee', 'INDIVIDUAL', '251911200009', 'george.l@email.com', 'MALE', date(1989, 4, 12), 'Ford', 'Mustang', 'MUS-4680', 2020, 'Yellow', 'COUPE'),
            ('Helen', 'Garcia', 'INDIVIDUAL', '251911200010', 'helen.g@email.com', 'FEMALE', date(1994, 8, 3), 'Toyota', 'Prius', 'PRS-3579', 2021, 'Green', 'SEDAN'),
            ('Ivan', 'Rodriguez', 'INDIVIDUAL', '251911200011', 'ivan.r@email.com', 'MALE', date(1986, 1, 20), 'Honda', 'Accord', 'ACC-6802', 2022, 'Silver', 'SEDAN'),
            ('Julia', 'Chen', 'INDIVIDUAL', '251911200012', 'julia.c@email.com', 'FEMALE', date(1993, 10, 7), 'BMW', 'X3', 'BMX-2468', 2023, 'White', 'SUV'),
            ('Kevin', 'Kim', 'INDIVIDUAL', '251911200013', 'kevin.k@email.com', 'MALE', date(1996, 3, 29), 'Ford', 'Explorer', 'EXP-1357', 2021, 'Black', 'SUV'),
            ('Laura', 'White', 'INDIVIDUAL', '251911200014', 'laura.w@email.com', 'FEMALE', date(1990, 7, 15), 'Mercedes-Benz', 'C-Class', 'MBC-8024', 2022, 'Silver', 'SEDAN'),
            ('Michael', 'Harris', 'INDIVIDUAL', '251911200015', 'michael.h@email.com', 'MALE', date(1984, 11, 22), 'Toyota', 'Land Cruiser', 'LC-4680', 2020, 'White', 'SUV'),
        ]

        # Corporate Customers
        corporate_customers_data = [
            ('Corporate Fleet Services', 'CORPORATE', '251911300001', 'fleet@company.com', 'TIN-123456', 'Toyota', 'Hilux', 'FLEET-001', 2021, 'White', 'TRUCK'),
            ('Enterprise Solutions Ltd', 'CORPORATE', '251911300002', 'business@enterprise.com', 'TIN-789012', 'Honda', 'Civic', 'FLEET-002', 2022, 'Gray', 'SEDAN'),
            ('Delivery Express Co', 'CORPORATE', '251911300003', 'fleet@delivery.com', 'TIN-345678', 'Ford', 'Ranger', 'FLEET-003', 2021, 'White', 'TRUCK'),
            ('Taxi Services Inc', 'CORPORATE', '251911300004', 'fleet@taxi.com', 'TIN-901234', 'Toyota', 'Camry', 'TAXI-001', 2020, 'Yellow', 'SEDAN'),
            ('Luxury Transport Ltd', 'CORPORATE', '251911300005', 'fleet@luxury.com', 'TIN-567890', 'Mercedes-Benz', 'S-Class', 'LUX-001', 2023, 'Black', 'SEDAN'),
        ]

        customers = []
        
        # Create individual customers
        for first, last, c_type, phone, email, sex, dob, make_name, model_name, plate, year, color, car_type in individual_customers_data:
            customer, created = Customer.objects.get_or_create(
                tenant=tenant,
                phone_number=phone,
                defaults={
                    'customer_type': c_type,
                    'first_name': first,
                    'last_name': last,
                    'email': email,
                    'sex': sex,
                    'date_of_birth': dob,
                    'is_corporate': False,
                    'address': f'{len(customers)+1} Customer Street, Addis Ababa',
                    'state': 'Addis Ababa',
                    'country': 'Ethiopia',
                }
            )
            customers.append(customer)
            
            # Create car for customer
            if created and make_name in car_models and model_name in car_models[make_name]:
                Car.objects.get_or_create(
                    tenant=tenant,
                    customer=customer,
                    plate_number=plate,
                    defaults={
                        'make': car_models[make_name][model_name].make,
                        'model': car_models[make_name][model_name],
                        'make_text': make_name,
                        'model_text': model_name,
                        'year': year,
                        'color': color,
                        'car_type': car_type,
                    }
                )

        # Create corporate customers
        for company_name, c_type, phone, email, tin, make_name, model_name, plate, year, color, car_type in corporate_customers_data:
            customer, created = Customer.objects.get_or_create(
                tenant=tenant,
                phone_number=phone,
                defaults={
                    'customer_type': c_type,
                    'company_name': company_name,
                    'email': email,
                    'tin_number': tin,
                    'is_corporate': True,
                    'address': f'{company_name} Headquarters, Addis Ababa',
                    'state': 'Addis Ababa',
                    'country': 'Ethiopia',
                }
            )
            customers.append(customer)
            
            # Create car for corporate customer
            if created and make_name in car_models and model_name in car_models[make_name]:
                Car.objects.get_or_create(
                    tenant=tenant,
                    customer=customer,
                    plate_number=plate,
                    defaults={
                        'make': car_models[make_name][model_name].make,
                        'model': car_models[make_name][model_name],
                        'make_text': make_name,
                        'model_text': model_name,
                        'year': year,
                        'color': color,
                        'car_type': car_type,
                        'corporate_car_id': plate,
                    }
                )

        self.stdout.write(f'  ✓ Created {len(customers)} customers')
        self.stdout.write(f'    - {len([c for c in customers if c.customer_type == "INDIVIDUAL"])} Individual customers')
        self.stdout.write(f'    - {len([c for c in customers if c.customer_type == "CORPORATE"])} Corporate customers')
        self.stdout.write(f'  ✓ Created {Car.objects.filter(tenant=tenant).count()} cars')
        return customers

    def print_summary(self, tenant):
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ Test data created successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'\nSummary for tenant: {tenant.name} ({tenant.subdomain})')
        self.stdout.write(f'\n  Services:')
        self.stdout.write(f'    • Car Types: {CarType.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'    • Categories: {Category.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'    • Services: {Service.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'    • Service Prices: {ServicePrice.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'\n  Staff:')
        self.stdout.write(f'    • Total Staff: {Staff.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'    • Managers: {Staff.objects.filter(tenant=tenant, is_manager=True).count()}')
        self.stdout.write(f'    • Active Staff: {Staff.objects.filter(tenant=tenant, is_active=True).count()}')
        self.stdout.write(f'    • Emergency Contacts: {EmergencyContact.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'\n  Customers:')
        self.stdout.write(f'    • Total Customers: {Customer.objects.filter(tenant=tenant).count()}')
        self.stdout.write(f'    • Individual: {Customer.objects.filter(tenant=tenant, customer_type="INDIVIDUAL").count()}')
        self.stdout.write(f'    • Corporate: {Customer.objects.filter(tenant=tenant, customer_type="CORPORATE").count()}')
        self.stdout.write(f'    • Cars: {Car.objects.filter(tenant=tenant).count()}')
        self.stdout.write('')

