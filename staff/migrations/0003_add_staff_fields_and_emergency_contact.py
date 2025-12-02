# Generated migration for Staff enhancements

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0002_staff_photo'),
        ('tenants', '0002_shop'),
    ]

    operations = [
        # Add new fields to Staff model
        migrations.AddField(
            model_name='staff',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='staff',
            name='sex',
            field=models.CharField(blank=True, choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other'), ('PREFER_NOT_TO_SAY', 'Prefer not to say')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='staff',
            name='house_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='staff',
            name='country',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='staff',
            name='salary',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Current monthly salary', max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='staff',
            name='shop',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='staff_members', to='tenants.shop'),
        ),
        migrations.AddField(
            model_name='staff',
            name='is_manager',
            field=models.BooleanField(default=False),
        ),
        
        # Create EmergencyContact model
        migrations.CreateModel(
            name='EmergencyContact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('sex', models.CharField(blank=True, choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other'), ('PREFER_NOT_TO_SAY', 'Prefer not to say')], max_length=20, null=True)),
                ('phone', models.CharField(max_length=20)),
                ('address', models.TextField(blank=True, null=True)),
                ('state', models.CharField(blank=True, max_length=100, null=True)),
                ('country', models.CharField(blank=True, max_length=100, null=True)),
                ('relationship', models.CharField(blank=True, help_text='e.g., Spouse, Parent, Sibling', max_length=100, null=True)),
                ('is_primary', models.BooleanField(default=False, help_text='Mark as primary emergency contact')),
                ('staff', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='emergency_contacts', to='staff.staff')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tenants.tenant')),
            ],
            options={
                'ordering': ['-is_primary', 'first_name'],
            },
        ),
        
        # Add unique constraint for primary contact
        migrations.AddConstraint(
            model_name='emergencycontact',
            constraint=models.UniqueConstraint(condition=models.Q(('is_primary', True)), fields=('staff', 'is_primary'), name='unique_primary_contact_per_staff'),
        ),
        
        # Add ordering to Staff model
        migrations.AlterModelOptions(
            name='staff',
            options={'ordering': ['-created_at']},
        ),
    ]

