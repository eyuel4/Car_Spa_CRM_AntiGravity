import os
import django
from django.contrib.auth import authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

user = authenticate(username='admin', password='admin123')
if user:
    print(f"SUCCESS: User {user.username} authenticated.")
else:
    print("FAILURE: Authentication failed.")
