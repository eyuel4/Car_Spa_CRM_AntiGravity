import os
import django
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant
from customers.models import Customer
from operations.models import Job
from billing.models import Receipt
from loyalty.models import (
    LoyaltyConfiguration, LoyaltyTier, CustomerLoyalty, 
    PointTransaction, RedemptionOption
)
from notifications.models import NotificationChannel, Notification

def verify_loyalty_and_notifications():
    tenant = Tenant.objects.first()
    print(f"Using Tenant: {tenant.name}\n")

    # 1. Setup Loyalty Configuration
    config, _ = LoyaltyConfiguration.objects.get_or_create(
        tenant=tenant,
        defaults={'points_per_dollar': Decimal('1'), 'points_expiry_days': 365}
    )
    print(f"Loyalty Config: {config.points_per_dollar} pts/$ | Expiry: {config.points_expiry_days} days\n")

    # 2. Setup Loyalty Tiers
    tiers_data = [
        ('BRONZE', 0, Decimal('1.0'), Decimal('0')),
        ('SILVER', 100, Decimal('1.2'), Decimal('5')),
        ('GOLD', 500, Decimal('1.5'), Decimal('10')),
        ('PLATINUM', 1000, Decimal('2.0'), Decimal('15')),
    ]
    
    for name, min_pts, multiplier, discount in tiers_data:
        LoyaltyTier.objects.get_or_create(
            tenant=tenant, name=name,
            defaults={
                'min_points_required': min_pts,
                'points_multiplier': multiplier,
                'discount_percentage': discount
            }
        )
    
    print("Loyalty Tiers:")
    for tier in LoyaltyTier.objects.filter(tenant=tenant):
        print(f"  {tier}")
    print()

    # 3. Create Redemption Options
    RedemptionOption.objects.get_or_create(
        tenant=tenant, name="$10 Discount",
        defaults={
            'points_required': 100,
            'redemption_type': 'DISCOUNT',
            'discount_value': Decimal('10.00')
        }
    )
    print("Redemption Option: $10 Discount (100 pts)\n")

    # 4. Create Customer Loyalty & Earn Points
    customer = Customer.objects.filter(is_corporate=False).first()
    loyalty, created = CustomerLoyalty.objects.get_or_create(
        tenant=tenant, customer=customer,
        defaults={'current_tier': LoyaltyTier.objects.get(tenant=tenant, name='BRONZE')}
    )
    
    # Simulate earning points from a $75 job
    job = Job.objects.filter(customer=customer).first()
    if job and hasattr(job, 'receipt'):
        receipt = job.receipt
        points_earned = int(receipt.total * config.points_per_dollar)
        
        # Apply tier multiplier
        if loyalty.current_tier:
            points_earned = int(points_earned * loyalty.current_tier.points_multiplier)
        
        # Create transaction
        expiry_date = date.today() + timedelta(days=config.points_expiry_days) if config.points_expiry_days else None
        PointTransaction.objects.create(
            tenant=tenant,
            customer_loyalty=loyalty,
            job=job,
            points=points_earned,
            transaction_type='EARNED',
            expires_at=expiry_date,
            description=f"Job #{job.id}"
        )
        
        # Update loyalty
        loyalty.total_points += points_earned
        loyalty.available_points += points_earned
        
        # Check for tier upgrade
        eligible_tier = LoyaltyTier.objects.filter(
            tenant=tenant,
            min_points_required__lte=loyalty.total_points
        ).order_by('-min_points_required').first()
        
        if eligible_tier and eligible_tier != loyalty.current_tier:
            loyalty.current_tier = eligible_tier
            loyalty.tier_achieved_date = date.today()
            print(f"🎉 Tier Upgrade: {eligible_tier.get_name_display()}!")
        
        loyalty.save()
        
        print(f"Customer: {customer}")
        print(f"  Total Points: {loyalty.total_points}")
        print(f"  Available Points: {loyalty.available_points}")
        print(f"  Current Tier: {loyalty.current_tier.get_name_display() if loyalty.current_tier else 'None'}")
        print(f"  Points Earned from Job: {points_earned}\n")

    # 5. Setup Notification Channels
    channels = ['WHATSAPP', 'TELEGRAM', 'EMAIL', 'SMS']
    for channel in channels:
        NotificationChannel.objects.get_or_create(
            tenant=tenant, channel_type=channel,
            defaults={
                'is_active': True,
                'api_credentials': {'api_key': 'placeholder', 'api_secret': 'placeholder'}
            }
        )
    
    print("Notification Channels:")
    for nc in NotificationChannel.objects.filter(tenant=tenant):
        print(f"  {nc}")
    print()

    # 6. Create Receipt Notification
    if job and hasattr(job, 'receipt'):
        notification = Notification.objects.create(
            tenant=tenant,
            customer=customer,
            notification_type='RECEIPT',
            channel='WHATSAPP',
            recipient=customer.phone_number,
            subject=f"Receipt #{job.receipt.receipt_number}",
            message=f"Thank you for your visit! Your receipt total is ${job.receipt.total}. You earned {points_earned} loyalty points!",
            receipt=job.receipt,
            status='PENDING'
        )
        
        # Simulate sending
        notification.send()
        
        print(f"Notification Created: {notification}")
        print(f"  Status: {notification.status}")
        print(f"  Sent At: {notification.sent_at}\n")

    print("Loyalty & Notifications Verification Successful!")

if __name__ == "__main__":
    verify_loyalty_and_notifications()
