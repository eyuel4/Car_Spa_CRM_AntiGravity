"""
Seed script for car reference data and loyalty tiers.
Run with: python seed_car_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from car_references.models import CarMake, CarModel
from loyalty.models import LoyaltyTier
from tenants.models import Tenant


def seed_car_makes_and_models():
    """Seed global car makes and models"""
    print("Seeding car makes and models...")
    
    car_data = {
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Land Cruiser', 'Prius', 'Tacoma', 'Tundra', 'Sienna', '4Runner'],
        'BMW': ['X3', 'X5', 'X7', '3 Series', '5 Series', '7 Series', 'M3', 'M5', 'i4', 'iX'],
        'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLS', 'GLC', 'A-Class', 'CLA'],
        'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline'],
        'Nissan': ['Altima', 'Maxima', 'Rogue', 'Pathfinder', 'Murano', 'Sentra', 'Frontier'],
        'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Ranger'],
        'Chevrolet': ['Silverado', 'Tahoe', 'Suburban', 'Equinox', 'Traverse', 'Malibu', 'Camaro'],
        'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
        'Lexus': ['ES', 'IS', 'RX', 'NX', 'GX', 'LX', 'UX'],
        'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona'],
        'Kia': ['Forte', 'Optima', 'Sorento', 'Sportage', 'Telluride', 'Soul'],
        'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'MX-5 Miata'],
        'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4'],
        'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Ascent', 'Impreza', 'Legacy'],
        'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
        'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator'],
        'Ram': ['1500', '2500', '3500', 'ProMaster'],
        'GMC': ['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon'],
        'Volvo': ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60'],
        'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
    }
    
    created_makes = 0
    created_models = 0
    
    for make_name, models in car_data.items():
        make, created = CarMake.objects.get_or_create(
            name=make_name,
            defaults={'is_active': True}
        )
        if created:
            created_makes += 1
            print(f"  Created make: {make_name}")
        
        for model_name in models:
            model, created = CarModel.objects.get_or_create(
                make=make,
                name=model_name,
                defaults={'is_active': True}
            )
            if created:
                created_models += 1
    
    print(f"✓ Created {created_makes} car makes and {created_models} models")


def seed_loyalty_tiers():
    """Seed default loyalty tiers for all tenants"""
    print("\nSeeding loyalty tiers...")
    
    tier_data = [
        {'name': 'BRONZE', 'min_points': 0, 'multiplier': 1.0, 'discount': 0},
        {'name': 'SILVER', 'min_points': 1000, 'multiplier': 1.2, 'discount': 5},
        {'name': 'GOLD', 'min_points': 5000, 'multiplier': 1.5, 'discount': 10},
        {'name': 'PLATINUM', 'min_points': 10000, 'multiplier': 2.0, 'discount': 15},
    ]
    
    tenants = Tenant.objects.all()
    created_count = 0
    
    for tenant in tenants:
        for tier_info in tier_data:
            tier, created = LoyaltyTier.objects.get_or_create(
                tenant=tenant,
                name=tier_info['name'],
                defaults={
                    'min_points_required': tier_info['min_points'],
                    'points_multiplier': tier_info['multiplier'],
                    'discount_percentage': tier_info['discount'],
                }
            )
            if created:
                created_count += 1
                print(f"  Created {tier_info['name']} tier for {tenant.name}")
    
    print(f"✓ Created {created_count} loyalty tiers")


if __name__ == '__main__':
    print("=" * 60)
    print("SEEDING CAR REFERENCE DATA AND LOYALTY TIERS")
    print("=" * 60)
    
    seed_car_makes_and_models()
    seed_loyalty_tiers()
    
    print("\n" + "=" * 60)
    print("SEEDING COMPLETE!")
    print("=" * 60)
