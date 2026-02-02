import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payment, AccountingKPIs } from '../models/accounting.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AccountingService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    getPayments(params?: any): Observable<Payment[]> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }

        return this.http.get<{ results: Payment[] }>(`${this.apiUrl}/payments/`, { params: httpParams }).pipe(
            map(response => response.results || [])
        );
    }

    getPaymentById(id: number): Observable<Payment> {
        return this.http.get<Payment>(`${this.apiUrl}/payments/${id}/`);
    }

    // Placeholder for separate accounting stats if existing dashboard stats aren't enough
    getAccountingStats(): Observable<AccountingKPIs> {
        // In a real app, this might be a specific endpoint. 
        // For now we might calculate client side or use dashboard stats.
        // Returning empty/mock for now or could reuse dashboard service logic.
        return this.http.get<any>(`${this.apiUrl}/dashboard/stats`).pipe(
            map(stats => ({
                todays_revenue: parseFloat(stats.kpis.revenue),
                this_week_revenue: 0, // Backend might not send this yet
                this_month_revenue: 0,
                avg_transaction: 0,
                total_services_today: stats.kpis.services
            }))
        );
    }
}

getRevenueMetrics(dateFrom ?: string, dateTo ?: string): Observable < any > {
    let params = new HttpParams();
    if(dateFrom) params = params.set('start_date', dateFrom);
    if(dateTo) params = params.set('end_date', dateTo);

    return this.http.get<any>(`${this.apiUrl}/invoices/metrics/`, { params });
}
}
