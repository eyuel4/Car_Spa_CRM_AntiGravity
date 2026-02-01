import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Coupon {
    id: number;
    name: string;
    code?: string;
    description?: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    value: string; // Decimal as string
    max_redemptions?: number;
    times_redeemed?: number;
    min_purchase_amount?: string;
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MarketingService {
    private apiUrl = `${environment.apiUrl}/discounts`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Coupon[]> {
        return this.http.get<{ results: Coupon[] }>(this.apiUrl + '/').pipe(
            map(response => response.results || [])
        );
    }

    getById(id: number): Observable<Coupon> {
        return this.http.get<Coupon>(`${this.apiUrl}/${id}/`);
    }

    create(coupon: Partial<Coupon>): Observable<Coupon> {
        return this.http.post<Coupon>(this.apiUrl + '/', coupon);
    }

    update(id: number, coupon: Partial<Coupon>): Observable<Coupon> {
        return this.http.put<Coupon>(`${this.apiUrl}/${id}/`, coupon);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/`);
    }

    toggleActive(id: number, isActive: boolean): Observable<Coupon> {
        return this.http.patch<Coupon>(`${this.apiUrl}/${id}/`, { is_active: isActive });
    }
}
