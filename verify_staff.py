import os
import django
from django.utils import timezone
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant
from staff.models import Staff, CompensationHistory, SalaryPayment

def verify_staff_models():
    # 1. Get Tenant
    tenant = Tenant.objects.get(subdomain="testspa")
    print(f"Using Tenant: {tenant.name}")

    # 2. Hire Staff
    staff = Staff.objects.create(
        tenant=tenant,
        first_name="Bob",
        last_name="Builder",
        phone_number="555-WORK",
        title="Senior Detailer",
        hire_date=date(2023, 1, 15)
    )
    print(f"Hired: {staff}")

    # 3. Set Initial Compensation
    comp1 = CompensationHistory.objects.create(
        tenant=tenant,
        staff=staff,
        amount=3000.00,
        effective_date=date(2023, 1, 15),
        reason="Hiring"
    )
    print(f"Initial Salary: {comp1.amount}")

    # 4. Give Raise
    comp2 = CompensationHistory.objects.create(
        tenant=tenant,
        staff=staff,
        amount=3500.00,
        effective_date=date(2024, 1, 1),
        reason="Annual Review"
    )
    print(f"New Salary: {comp2.amount}")
    print(f"Current Compensation (Property): {staff.current_compensation}")

    # 5. Pay Salary
    payment = SalaryPayment.objects.create(
        tenant=tenant,
        staff=staff,
        amount=3500.00,
        payment_date=timezone.now(),
        notes="January Salary"
    )
    print(f"Payment Recorded: {payment}")

    print("Verification Successful!")

if __name__ == "__main__":
    verify_staff_models()
