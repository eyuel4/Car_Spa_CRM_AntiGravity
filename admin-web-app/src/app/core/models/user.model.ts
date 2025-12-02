export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: 'OWNER' | 'SHOP_ADMIN' | 'STAFF';
    tenant?: Tenant;
    phone_number?: string;
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    phone_number?: string;
    email?: string;
    website?: string;
    logo?: string;
    language: string;
}

export interface Shop {
    id: string; // UUID from backend
    tenant: string;
    name: string;
    address?: string;
    phone_number?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
