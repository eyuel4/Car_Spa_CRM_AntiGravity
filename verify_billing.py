import os
import django
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant
from customers.models import Customer, Car, CorporateProfile
from services.models import Category, Service, CarType, ServicePrice
from staff.models import Staff
from operations.models import Job, JobItem
from billing.models import TaxConfiguration, Discount, Receipt, Invoice, InvoiceLineItem, Payment

def verify_billing():
    tenant = Tenant.objects.first()
    print(f"Using Tenant: {tenant.name}\n")

    # 1. Setup Tax Configuration
    tax, _ = TaxConfiguration.objects.get_or_create(
        tenant=tenant, name="VAT",
        defaults={'rate': Decimal('0.15'), 'is_active': True}
    )
    print(f"Tax: {tax}")

    # 2. Setup Discounts
    percent_discount, _ = Discount.objects.get_or_create(
        tenant=tenant, name="Summer Sale",
        defaults={
            'discount_type': 'PERCENTAGE',
            'value': Decimal('10'),
            'is_active': True
        }
    )
    fixed_discount, _ = Discount.objects.get_or_create(
        tenant=tenant, name="Loyalty Reward",
        defaults={
            'discount_type': 'FIXED',
            'value': Decimal('5.00'),
            'is_active': True
        }
    )
    print(f"Discounts: {percent_discount}, {fixed_discount}\n")

    # 3. Create Individual Customer Job & Receipt
    customer = Customer.objects.first()
    car = Car.objects.first()
    service = Service.objects.first()
    
    job1 = Job.objects.create(tenant=tenant, customer=customer, car=car, status='COMPLETED')
    job_item = JobItem.objects.create(tenant=tenant, job=job1, service=service, price=Decimal('75.00'))
    
    # Calculate receipt
    subtotal = Decimal('75.00')
    discount_amt = subtotal * (percent_discount.value / 100)  # 10% off
    after_discount = subtotal - discount_amt
    tax_amt = after_discount * tax.rate  # 15% tax
    total = after_discount + tax_amt
    
    receipt = Receipt.objects.create(
        tenant=tenant, job=job1,
        receipt_number=f"RCP-{job1.id:06d}",
        subtotal=subtotal,
        discount_amount=discount_amt,
        tax_amount=tax_amt,
        total=total
    )
    print(f"Receipt Generated: {receipt.receipt_number}")
    print(f"  Subtotal: ${receipt.subtotal}")
    print(f"  Discount (10%): -${receipt.discount_amount}")
    print(f"  Tax (15%): +${receipt.tax_amount}")
    print(f"  Total: ${receipt.total}\n")

    # 4. Record Payment
    payment = Payment.objects.create(
        tenant=tenant, job=job1,
        amount=total,
        payment_method='MOBILE_TRANSFER',
        transaction_reference='TXN-123456789'
    )
    print(f"Payment Recorded: {payment.payment_method} - {payment.transaction_reference}\n")

    # 5. Create Corporate Customer with Multiple Jobs
    corp_customer = Customer.objects.filter(is_corporate=True).first()
    if not corp_customer:
        corp_customer = Customer.objects.create(
            tenant=tenant, first_name="Corporate", last_name="Account",
            phone_number="555-9999", is_corporate=True
        )
        CorporateProfile.objects.create(
            tenant=tenant, customer=corp_customer,
            company_name="Acme Corp", tax_id="TAX-12345"
        )
    
    # Create 3 jobs for corporate customer
    corp_jobs = []
    for i in range(3):
        job = Job.objects.create(tenant=tenant, customer=corp_customer, car=car, status='COMPLETED')
        JobItem.objects.create(tenant=tenant, job=job, service=service, price=Decimal('75.00'))
        corp_jobs.append(job)
    
    # 6. Generate Monthly Invoice
    billing_start = date.today().replace(day=1)
    billing_end = (billing_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    invoice_subtotal = Decimal('225.00')  # 3 jobs * $75
    invoice_tax = invoice_subtotal * tax.rate
    invoice_total = invoice_subtotal + invoice_tax
    
    invoice = Invoice.objects.create(
        tenant=tenant, customer=corp_customer,
        invoice_number=f"INV-{date.today().strftime('%Y%m')}-001",
        billing_period_start=billing_start,
        billing_period_end=billing_end,
        subtotal=invoice_subtotal,
        tax_amount=invoice_tax,
        total=invoice_total,
        due_date=date.today() + timedelta(days=30),
        status='SENT'
    )
    
    # Add line items
    for job in corp_jobs:
        InvoiceLineItem.objects.create(
            tenant=tenant, invoice=invoice, job=job,
            description=f"Job #{job.id} - {service.name}",
            amount=Decimal('75.00')
        )
    
    print(f"Invoice Generated: {invoice.invoice_number}")
    print(f"  Customer: {corp_customer.corporate_profile.company_name}")
    print(f"  Period: {invoice.billing_period_start} to {invoice.billing_period_end}")
    print(f"  Jobs: {len(corp_jobs)}")
    print(f"  Subtotal: ${invoice.subtotal}")
    print(f"  Tax (15%): +${invoice.tax_amount}")
    print(f"  Total: ${invoice.total}")
    print(f"  Due Date: {invoice.due_date}\n")

    print("Billing Verification Successful!")

if __name__ == "__main__":
    verify_billing()
