export type NotificationCategory =
    | 'JOB_CREATED' | 'JOB_ASSIGNED' | 'JOB_STARTED' | 'JOB_COMPLETED' | 'JOB_CANCELLED'
    | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'INVOICE_GENERATED' | 'PAYMENT_DUE'
    | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'STOCK_REPLENISHED'
    | 'NEW_CUSTOMER' | 'LOYALTY_MILESTONE' | 'LOYALTY_REWARD_EARNED'
    | 'SYSTEM_ALERT' | 'SYSTEM_ERROR' | 'SYSTEM_UPDATE';

export interface SystemNotification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    notification_type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    category?: NotificationCategory;
    link?: string;
    created_at: string;
}
