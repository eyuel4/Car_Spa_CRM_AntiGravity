import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Shop, Tenant } from '../models/user.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private currentShopSubject = new BehaviorSubject<Shop | null>(null);
    public currentShop$ = this.currentShopSubject.asObservable();

    private shopsSubject = new BehaviorSubject<Shop[]>([]);
    public shops$ = this.shopsSubject.asObservable();
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.loadShopFromStorage();
        }
    }

    getCurrentTenant(): Tenant | null {
        const user = this.authService.getCurrentUser();
        return user?.tenant || null;
    }

    getShops(): Observable<Shop[]> {
        return this.http.get<{ results: Shop[] }>(`${environment.apiUrl}/shops/`).pipe(
            map(response => response.results || [])
        );
    }

    loadShops(): void {
        this.getShops().subscribe({
            next: (shops) => {
                this.shopsSubject.next(shops);

                // Auto-select first shop if none selected
                if (!this.currentShopSubject.value && shops.length > 0) {
                    this.setCurrentShop(shops[0]);
                }
            },
            error: (error) => {
                console.error('Failed to load shops', error);
                this.shopsSubject.next([]);
            }
        });
    }

    setCurrentShop(shop: Shop): void {
        if (this.isBrowser) {
            localStorage.setItem('current_shop', JSON.stringify(shop));
        }
        this.currentShopSubject.next(shop);
    }

    getCurrentShop(): Shop | null {
        return this.currentShopSubject.value;
    }

    createShop(shopData: Partial<Shop>): Observable<Shop> {
        return this.http.post<Shop>(`${environment.apiUrl}/shops/`, shopData).pipe(
            map((newShop) => {
                // Reload shops list to include the new shop
                this.loadShops();
                return newShop;
            })
        );
    }

    updateShop(shopId: string, shopData: Partial<Shop>): Observable<Shop> {
        return this.http.put<Shop>(`${environment.apiUrl}/shops/${shopId}/`, shopData).pipe(
            map((updatedShop) => {
                // Reload shops list to reflect updates
                this.loadShops();
                return updatedShop;
            })
        );
    }

    deleteShop(shopId: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/shops/${shopId}/`).pipe(
            map(() => {
                // Reload shops list
                this.loadShops();
            })
        );
    }

    toggleShopActive(shopId: string, isActive: boolean): Observable<Shop> {
        return this.http.patch<Shop>(`${environment.apiUrl}/shops/${shopId}/`, { is_active: isActive }).pipe(
            map((updatedShop) => {
                // Reload shops list
                this.loadShops();
                return updatedShop;
            })
        );
    }

    updateTenantLanguage(tenantId: string, language: string): Observable<any> {
        return this.http.patch(
            `${environment.apiUrl}/tenants/${tenantId}/update-language/`,
            { language }
        );
    }

    private loadShopFromStorage(): void {
        if (!this.isBrowser) return;

        const shopJson = localStorage.getItem('current_shop');
        if (shopJson) {
            try {
                const shop = JSON.parse(shopJson);
                this.currentShopSubject.next(shop);
            } catch (e) {
                console.error('Failed to parse shop from storage', e);
            }
        }
    }
}
