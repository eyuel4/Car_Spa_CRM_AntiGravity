import os
import django
import requests
import json

# Setup Django for ORM access if needed, but we'll use requests for API testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

BASE_URL = "http://127.0.0.1:8000"

def test_registration():
    print("\n--- Testing Registration ---")
    url = f"{BASE_URL}/auth/users/"
    data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "StrongPassword123!",
        "re_password": "StrongPassword123!"
    }
    
    from rest_framework.test import APIClient
    client = APIClient()
    
    response = client.post('/auth/users/', data)
    if response.status_code == 201:
        print("Registration Successful:", response.data)
    else:
        print("Registration Failed:", response.status_code, response.data)

def test_login():
    print("\n--- Testing Login ---")
    from rest_framework.test import APIClient
    client = APIClient()
    
    data = {
        "username": "newuser",
        "password": "StrongPassword123!"
    }
    response = client.post('/auth/jwt/create/', data)
    if response.status_code == 200:
        print("Login Successful. Token received.")
    else:
        print("Login Failed:", response.status_code, response.data)

def test_password_reset():
    print("\n--- Testing Password Reset Request ---")
    from rest_framework.test import APIClient
    client = APIClient()
    
    data = {"email": "newuser@example.com"}
    response = client.post('/auth/users/reset_password/', data)
    if response.status_code == 204:
        print("Password Reset Email Sent (Check Console).")
    else:
        print("Password Reset Failed:", response.status_code, response.data)

if __name__ == "__main__":
    # Ensure DB is clean-ish or handle existing user
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if User.objects.filter(username="newuser").exists():
        User.objects.get(username="newuser").delete()
        
    test_registration()
    test_login()
    test_password_reset()
