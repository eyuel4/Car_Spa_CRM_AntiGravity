import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant
from customers.models import Customer, Car, CorporateProfile, Driver
from services.models import Category, Service

def verify_core_models():
    # 1. Get or Create Tenant
    tenant, _ = Tenant.objects.get_or_create(name="Test Spa", subdomain="testspa")
    print(f"Using Tenant: {tenant.name}")

    # 2. Create Individual Customer
    ind_customer = Customer.objects.create(
        tenant=tenant,
        first_name="John",
        last_name="Doe",
        phone_number="555-0123",
        email="john@example.com"
    )
    print(f"Individual Customer Created: {ind_customer}")

    # 3. Create Corporate Customer & Driver
    corp_customer = Customer.objects.create(
        tenant=tenant,
        first_name="Corporate",
        last_name="Account",
        phone_number="555-9999",
        is_corporate=True
    )
    corp_profile = CorporateProfile.objects.create(
        tenant=tenant,
        customer=corp_customer,
        company_name="Acme Corp",
        tax_id="TAX-12345"
    )
    driver = Driver.objects.create(
        tenant=tenant,
        corporate_profile=corp_profile,
        first_name="Alice",
        last_name="Driver",
        phone_number="555-8888"
    )
    print(f"Corporate Customer Created: {corp_profile.company_name}")
    print(f"Driver Created: {driver}")

    # 4. Create Car (Linked to Individual)
    car = Car.objects.create(
        tenant=tenant,
        customer=ind_customer,
        make="Toyota",
        model="Camry",
        plate_number="ABC-123",
        year=2022
    )
    print(f"Car Created: {car}")

    # 5. Create Service Category & Service
    category = Category.objects.create(
        tenant=tenant,
        name="Washing"
    )
    service = Service.objects.create(
        tenant=tenant,
        category=category,
        name="Full Body Wash",
        price=25.00,
        duration_minutes=45
    )
    print(f"Service Created: {service}")

    print("Verification Successful!")

if __name__ == "__main__":
    verify_core_models()
