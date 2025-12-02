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
