import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, EMPTY, Subject } from 'rxjs';
import { switchMap, tap, catchError, map, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SystemNotification } from '../models/system-notification.model';
import { RoleNotificationPreference } from '../models/role-notification-preference.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationDataService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/system-notifications/`;
    private preferencesUrl = `${environment.apiUrl}/role-notification-preferences/`;

    private _unreadCount = new BehaviorSubject<number>(0);
    unreadCount$ = this._unreadCount.asObservable();

    private destroy$ = new Subject<void>();
    private stopPolling$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        // Subscribe to auth state changes
        this.authService.currentUser$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(user => {
            if (user !== null) {
                // User logged in - start polling
                this.startPolling();
            } else {
                // User logged out - stop polling immediately
                this.stopPolling();
                this._unreadCount.next(0);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopPolling();
    }

    private startPolling(): void {
        // Stop existing polling if any
        this.stopPolling();

        // Create new stop signal for this polling session
        this.stopPolling$ = new Subject<void>();

        // Poll every 2 minutes, but stop immediately when stopPolling$ emits
        timer(0, 120000).pipe(
            takeUntil(this.stopPolling$),
            switchMap(() => this.getUnreadCount()),
            catchError(error => {
                // Silently handle 401 errors (user not authenticated)
                if (error.status === 401) {
                    this._unreadCount.next(0);
                    this.stopPolling();
                    return EMPTY;
                }
                console.error('Error fetching unread count:', error);
                return EMPTY;
            })
        ).subscribe();
    }

    private stopPolling(): void {
        // Immediately cancel any ongoing polling
        this.stopPolling$.next();
        this.stopPolling$.complete();
    }

    getNotifications(): Observable<SystemNotification[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                // Handle paginated response from Django REST Framework
                if (response && response.results) {
                    return response.results as SystemNotification[];
                }
                // Handle non-paginated response (array)
                return response as SystemNotification[];
            })
        );
    }

    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}unread_count/`).pipe(
            tap(response => this._unreadCount.next(response.count)),
            catchError(error => {
                // Reset count on error
                this._unreadCount.next(0);
                throw error;
            })
        );
    }

    markAsRead(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}${id}/mark_read/`, {}).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.post(`${this.apiUrl}mark_all_read/`, {}).pipe(
            tap(() => {
                this._unreadCount.next(0);
            })
        );
    }

    refreshUnreadCount(): void {
        this.getUnreadCount().subscribe({
            error: (err) => {
                // Silently handle errors
                if (err.status !== 401) {
                    console.error('Error refreshing unread count:', err);
                }
            }
        });
    }

    // Role Notification Preferences
    getRolePreferences(): Observable<RoleNotificationPreference[]> {
        return this.http.get<any>(this.preferencesUrl).pipe(
            map(response => {
                if (response && response.results) {
                    return response.results as RoleNotificationPreference[];
                }
                return response as RoleNotificationPreference[];
            })
        );
    }

    updateRolePreference(id: number, preferences: Partial<RoleNotificationPreference>): Observable<RoleNotificationPreference> {
        return this.http.patch<RoleNotificationPreference>(`${this.preferencesUrl}${id}/`, preferences);
    }

    initializeDefaultPreferences(): Observable<any> {
        return this.http.post(`${this.preferencesUrl}initialize_defaults/`, {});
    }

    getNotificationConfiguration(): Observable<any[]> {
        return this.http.get<any[]>(`${this.preferencesUrl}configuration/`);
    }
}
