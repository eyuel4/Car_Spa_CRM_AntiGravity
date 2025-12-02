import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

    private idCounter = 0;

    constructor() { }

    success(message: string, duration: number = 5000): void {
        this.addNotification(message, 'success', duration);
    }

    error(message: string, duration: number = 7000): void {
        this.addNotification(message, 'error', duration);
    }

    warning(message: string, duration: number = 6000): void {
        this.addNotification(message, 'warning', duration);
    }

    info(message: string, duration: number = 5000): void {
        this.addNotification(message, 'info', duration);
    }

    private addNotification(message: string, type: Notification['type'], duration: number): void {
        const notification: Notification = {
            id: `notification-${++this.idCounter}-${Date.now()}`,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([...currentNotifications, notification]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }
    }

    dismiss(id: string): void {
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next(currentNotifications.filter(n => n.id !== id));
    }

    dismissAll(): void {
        this.notificationsSubject.next([]);
    }
}
