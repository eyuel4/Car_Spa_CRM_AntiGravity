# Car Spa CRM

Multi-tenant SaaS CRM for Car Spas.

## Setup

1.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Run migrations:
    ```bash
    python manage.py migrate
    ```

4.  Run the server:
    ```bash
    python manage.py runserver
    python manage.py runserver 0.0.0.0:8000  
    ```
:

📋 Car Spa CRM - Login Users
Based on the project files, here are the available login users for the Car Spa CRM application:

Test Users (from 
seed_test_users.py
)
Username	Email	Role	Password	Phone
testowner	
owner@testcarspa.com
OWNER	testpass123	251911001001
testmanager	
manager@testcarspa.com
MANAGER	testpass123	251911001002
teststaff	
staff@testcarspa.com
STAFF	testpass123	251911001003
Default Tenant: test (subdomain)

