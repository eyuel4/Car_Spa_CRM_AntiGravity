import { Shop } from './user.model';

export interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
    is_corporate: boolean;
    created_at: string;
    updated_at: string;
}

export interface Car {
    id: number;
    customer: number;
    make: string;
    model: string;
    plate_number: string;
    color?: string;
    year?: number;
    car_type?: number;
}

export interface Service {
    id: number;
    name: string;
    description?: string;
    price: string;
    duration_minutes?: number;
    category?: number;
    is_active: boolean;
}

export interface ServiceRecord {
    id: number;
    customer: number;
    car: number;
    service: number;
    staff?: number;
    shop: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    completed_at?: string;
    total_price: string;
}

export type SexType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface EmergencyContact {
    id?: number;
    first_name: string;
    last_name: string;
    sex?: SexType;
    phone: string;
    address?: string;
    state?: string;
    country?: string;
    relationship?: string;
    is_primary: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Staff {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    house_number?: string;
    country?: string;
    date_of_birth?: string;
    sex?: SexType;
    title: string;
    hire_date: string;
    salary?: string;
    shop?: Shop;
    shop_id?: string;
    is_manager: boolean;
    is_active: boolean;
    current_compensation?: string;
    photo?: string;
    photo_url?: string;
    emergency_contacts?: EmergencyContact[];
    full_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Coupon {
    id: number;
    code: string;
    description?: string;
    discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discount_value: string;
    expiry_date?: string;
    max_redemptions?: number;
    redemptions_count: number;
    is_active: boolean;
}

export interface LoyaltySettings {
    id: number;
    shop: number;
    points_per_service: number;
    points_per_currency: number;
    blue_tier_min: number;
    silver_tier_min: number;
    gold_tier_min: number;
    diamond_tier_min: number;
    points_expiry_months?: number;
}
