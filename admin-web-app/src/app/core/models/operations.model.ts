import { Customer, Car, Service, Staff } from './business.model';

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'QC' | 'COMPLETED' | 'PAID' | 'CANCELLED';
export type JobTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type PaymentMethod = 'CASH' | 'MOBILE_TRANSFER' | 'MOBILE_BANKING' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export interface Job {
    id: number;
    customer: Customer; // Expanded or ID? Backend usually returns object for list, but let's assume object based on need
    customer_id?: number; // For creation
    car: Car;
    car_id?: number;
    status: JobStatus;
    payment_method?: PaymentMethod;
    transaction_reference?: string;
    qr_code?: string;
    created_at: string;
    completed_at?: string;
    items?: JobItem[]; // Optional in list view, present in detail
}

export interface JobItem {
    id: number;
    job: number;
    service: Service;
    service_id?: number;
    price: string;
    tasks?: JobTask[];
}

export interface JobTask {
    id: number;
    job_item: number;
    staff?: Staff;
    staff_id?: number;
    task_name: string;
    status: JobTaskStatus;
    start_time?: string;
    end_time?: string;
}

export interface CreateJobRequest {
    customer_id: number;
    car_id: number;
    service_ids: number[];
}
