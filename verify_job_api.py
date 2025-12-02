import os
import django
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

# Now import views after setup
from operations.views import JobViewSet

User = get_user_model()
user = User.objects.get(username='admin')

factory = APIRequestFactory()
request = factory.get('/api/v1/jobs/')
request.user = user

view = JobViewSet.as_view({'get': 'list'})
response = view(request)

print(f"Response Type: {type(response.data)}")
if isinstance(response.data, dict):
    print(f"Response Keys: {list(response.data.keys())}")
    if 'results' in response.data:
        print(f"Results Type: {type(response.data['results'])}")
else:
    print("Response is not a dict (likely a list)")
