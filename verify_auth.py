import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from tenants.models import Tenant

def verify_auth():
    # 1. Create Tenant
    tenant, created = Tenant.objects.get_or_create(
        name="Test Spa",
        subdomain="testspa",
        defaults={'address': "123 Test St"}
    )
    print(f"Tenant created: {tenant.name} ({tenant.id})")

    # 2. Create User
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username="owner",
        defaults={
            'email': "owner@testspa.com",
            'role': 'OWNER',
            'tenant': tenant
        }
    )
    if created:
        user.set_password("password123")
        user.save()
    print(f"User created: {user.username} ({user.role})")

    # 3. Generate Token
    refresh = RefreshToken.for_user(user)
    print(f"Access Token: {str(refresh.access_token)[:20]}...")
    print("Verification Successful!")

if __name__ == "__main__":
    verify_auth()
