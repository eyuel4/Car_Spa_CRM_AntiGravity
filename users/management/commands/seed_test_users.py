from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tenants.models import Tenant

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates 3 test users (OWNER, MANAGER, STAFF) for the test tenant'

    def add_arguments(self, parser):
        parser.add_argument(
            '--subdomain',
            type=str,
            default='test',
            help='Subdomain for the test tenant (default: test)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='testpass123',
            help='Password for all test users (default: testpass123)',
        )

    def handle(self, *args, **options):
        subdomain = options['subdomain']
        password = options['password']

        # Find or create the test tenant
        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
            self.stdout.write(self.style.SUCCESS(f'Found tenant: {tenant.name} ({subdomain})'))
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'Tenant with subdomain "{subdomain}" not found.'))
            self.stdout.write(self.style.WARNING('Creating tenant...'))
            tenant = Tenant.objects.create(
                subdomain=subdomain,
                name='Test Car Spa',
                phone_number='+251-911-123-456',
                email='test@carspa.com',
                address='123 Test Street, Addis Ababa, Ethiopia',
                language='en',
            )
            self.stdout.write(self.style.SUCCESS(f'Created tenant: {tenant.name}'))

        # Define users to create
        users_data = [
            {
                'username': 'testowner',
                'email': 'owner@testcarspa.com',
                'first_name': 'Test',
                'last_name': 'Owner',
                'role': 'OWNER',
                'phone_number': '251911001001',
            },
            {
                'username': 'testmanager',
                'email': 'manager@testcarspa.com',
                'first_name': 'Test',
                'last_name': 'Manager',
                'role': 'MANAGER',
                'phone_number': '251911001002',
            },
            {
                'username': 'teststaff',
                'email': 'staff@testcarspa.com',
                'first_name': 'Test',
                'last_name': 'Staff',
                'role': 'STAFF',
                'phone_number': '251911001003',
            },
        ]

        created_users = []
        updated_users = []

        for user_data in users_data:
            username = user_data['username']
            role = user_data['role']
            
            # Check if user already exists
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    **user_data,
                    'tenant': tenant,
                }
            )

            if created:
                user.set_password(password)
                user.save()
                created_users.append((username, role))
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ Created user: {username} (Role: {role}, Password: {password})'
                    )
                )
            else:
                # Update existing user to ensure correct tenant and role
                if user.tenant != tenant:
                    user.tenant = tenant
                if user.role != role:
                    user.role = role
                if not user.check_password(password):
                    user.set_password(password)
                user.save()
                updated_users.append((username, role))
                self.stdout.write(
                    self.style.WARNING(
                        f'  → Updated user: {username} (Role: {role}, Password: {password})'
                    )
                )

        # Print summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ Test users created/updated successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'\nTenant: {tenant.name} ({tenant.subdomain})')
        self.stdout.write(f'\nUsers Summary:')
        
        if created_users:
            self.stdout.write(f'\n  Created ({len(created_users)}):')
            for username, role in created_users:
                self.stdout.write(f'    • {username} - {role}')
        
        if updated_users:
            self.stdout.write(f'\n  Updated ({len(updated_users)}):')
            for username, role in updated_users:
                self.stdout.write(f'    • {username} - {role}')
        
        self.stdout.write(f'\n  Login Credentials:')
        self.stdout.write(f'    Password for all users: {password}')
        self.stdout.write(f'\n  User Accounts:')
        for username, role in created_users + updated_users:
            self.stdout.write(f'    • {username} ({role})')
        
        self.stdout.write(f'\n  Total users for tenant: {User.objects.filter(tenant=tenant).count()}')
        self.stdout.write('')

