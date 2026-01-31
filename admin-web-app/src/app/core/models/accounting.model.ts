import { Customer } from './business.model';

export interface TaxConfiguration {
    id: number;
    name: string;
    rate: string; // Decimal string
    is_active: boolean;
}

export interface Discount {
    id: number;
    name: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    value: string;
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
}

export interface Receipt {
    id: number;
    job: number; // Job ID
    receipt_number: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    total: string;
    issued_date: string;
}

export interface Invoice {
    id: number;
    customer: Customer;
    invoice_number: string;
    billing_period_start: string;
    billing_period_end: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    total: string;
    issued_date: string;
    due_date: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface Payment {
    id: number;
    job?: number;
    job_details?: any; // For expanded job info if needed
    invoice?: number;
    amount: string;
    payment_method: 'CASH' | 'MOBILE_TRANSFER' | 'MOBILE_BANKING' | 'CARD' | 'OTHER';
    payment_date: string;
    transaction_reference?: string;
    notes?: string;
}

export interface AccountingKPIs {
    todays_revenue: number;
    this_week_revenue: number;
    this_month_revenue: number;
    avg_transaction: number;
    total_services_today: number;
}
