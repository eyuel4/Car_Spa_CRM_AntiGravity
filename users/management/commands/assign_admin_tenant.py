from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tenants.models import Tenant

User = get_user_model()

class Command(BaseCommand):
    help = 'Assigns the first tenant to the admin user'

    def handle(self, *args, **kwargs):
        try:
            admin_user = User.objects.get(username='admin')
            if admin_user.tenant:
                self.stdout.write(self.style.SUCCESS(f'Admin user already has tenant: {admin_user.tenant.name}'))
                return

            tenant = Tenant.objects.first()
            if not tenant:
                self.stdout.write(self.style.ERROR('No tenants found. Please run seed_data first.'))
                return

            admin_user.tenant = tenant
            admin_user.role = 'OWNER'  # Ensure admin is an OWNER
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully assigned tenant "{tenant.name}" to admin user'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Admin user not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
