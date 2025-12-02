import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from tenants.models import Tenant

def verify_tenant_branding():
    # Create a dummy image
    image_content = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    logo = SimpleUploadedFile(name='test_logo.gif', content=image_content, content_type='image/gif')

    tenant, created = Tenant.objects.get_or_create(
        name="Branded Spa",
        subdomain="branded",
        defaults={
            'phone_number': '123-456-7890',
            'email': 'contact@branded.com',
            'website': 'https://branded.com',
            'logo': logo
        }
    )
    
    print(f"Tenant: {tenant.name}")
    print(f"Phone: {tenant.phone_number}")
    print(f"Email: {tenant.email}")
    print(f"Logo URL: {tenant.logo.url if tenant.logo else 'No Logo'}")

    if tenant.logo:
        print("Logo upload successful.")
    else:
        print("Logo upload failed.")

if __name__ == "__main__":
    verify_tenant_branding()
