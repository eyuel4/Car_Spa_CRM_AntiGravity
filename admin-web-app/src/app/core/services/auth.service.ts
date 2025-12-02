import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private tokenKey = 'auth_token';
    private refreshTokenKey = 'refresh_token';

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUserFromStorage();
        }
    }

    login(username: string, password: string): Observable<User> {
        return this.http.post<{ access: string; refresh: string }>(`${environment.apiUrl}/auth/jwt/create/`, {
            username,
            password
        }).pipe(
            tap(tokens => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem(this.tokenKey, tokens.access);
                    localStorage.setItem(this.refreshTokenKey, tokens.refresh);
                }
            }),
            switchMap(() => this.http.get<User>(`${environment.apiUrl}/auth/users/me/`)),
            tap(user => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('current_user', JSON.stringify(user));
                }
                this.currentUserSubject.next(user);
            })
        );
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            localStorage.removeItem('current_user');
        }
        this.currentUserSubject.next(null);
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    hasRole(role: string): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    getToken(): string | null {
        return isPlatformBrowser(this.platformId) ? localStorage.getItem(this.tokenKey) : null;
    }

    getRefreshToken(): string | null {
        return isPlatformBrowser(this.platformId) ? localStorage.getItem(this.refreshTokenKey) : null;
    }

    private setSession(authResult: any): void {
        // Deprecated: logic moved to login pipeline
    }

    private loadUserFromStorage(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const userJson = localStorage.getItem('current_user');
        if (userJson && userJson !== 'undefined' && userJson !== 'null') {
            try {
                const user = JSON.parse(userJson);
                this.currentUserSubject.next(user);
            } catch (e) {
                console.error('Failed to parse user from storage', e);
                // Clear invalid data
                localStorage.removeItem('current_user');
                this.currentUserSubject.next(null);
            }
        } else {
            // Clear invalid data if it's explicitly 'undefined' string
            if (userJson === 'undefined' || userJson === 'null') {
                localStorage.removeItem('current_user');
            }
        }
    }

    refreshAccessToken(): Observable<{ access: string }> {
        const refreshToken = this.getRefreshToken();
        return this.http.post<{ access: string }>(`${environment.apiUrl}/auth/jwt/refresh/`, {
            refresh: refreshToken
        }).pipe(
            tap(response => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem(this.tokenKey, response.access);
                }
            })
        );
    }
}
