export interface RoleNotificationPreference {
    id?: number;
    role: 'OWNER' | 'MANAGER' | 'STAFF';

    // Jobs
    job_created_enabled: boolean;
    job_assigned_enabled: boolean;
    job_started_enabled: boolean;
    job_completed_enabled: boolean;
    job_cancelled_enabled: boolean;

    // Payments
    payment_received_enabled: boolean;
    payment_failed_enabled: boolean;
    invoice_generated_enabled: boolean;
    payment_due_enabled: boolean;

    // Inventory
    low_stock_enabled: boolean;
    out_of_stock_enabled: boolean;
    stock_replenished_enabled: boolean;

    // Customer
    new_customer_enabled: boolean;
    loyalty_milestone_enabled: boolean;
    loyalty_reward_earned_enabled: boolean;

    // System
    system_alert_enabled: boolean;
    system_error_enabled: boolean;
    system_update_enabled: boolean;
}
