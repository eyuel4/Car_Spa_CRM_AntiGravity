import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { InventoryItem, Supplier, StockLog } from '../models/business.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    // --- Products ---

    getProducts(filters?: any): Observable<InventoryItem[]> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get<{ results: InventoryItem[] }>(`${this.apiUrl}/products/`, { params })
            .pipe(map(res => res.results || []));
    }

    getProduct(id: number): Observable<InventoryItem> {
        return this.http.get<InventoryItem>(`${this.apiUrl}/products/${id}/`);
    }

    createProduct(data: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.http.post<InventoryItem>(`${this.apiUrl}/products/`, data);
    }

    updateProduct(id: number, data: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.http.patch<InventoryItem>(`${this.apiUrl}/products/${id}/`, data);
    }

    deleteProduct(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/products/${id}/`);
    }

    restock(id: number, amount: number, reason: string): Observable<InventoryItem> {
        return this.http.post<InventoryItem>(`${this.apiUrl}/products/${id}/restock/`, { amount, reason });
    }

    getLowStockItems(): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${this.apiUrl}/products/low_stock/`);
    }

    // --- Suppliers ---

    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<{ results: Supplier[] }>(`${this.apiUrl}/suppliers/`)
            .pipe(map(res => res.results || []));
    }

    getSupplier(id: number): Observable<Supplier> {
        return this.http.get<Supplier>(`${this.apiUrl}/suppliers/${id}/`);
    }

    createSupplier(data: Partial<Supplier>): Observable<Supplier> {
        return this.http.post<Supplier>(`${this.apiUrl}/suppliers/`, data);
    }

    updateSupplier(id: number, data: Partial<Supplier>): Observable<Supplier> {
        return this.http.patch<Supplier>(`${this.apiUrl}/suppliers/${id}/`, data);
    }

    // --- Logs ---

    getStockLogs(productId?: number): Observable<StockLog[]> {
        let params = new HttpParams();
        if (productId) {
            params = params.set('product', productId.toString());
        }
        return this.http.get<{ results: StockLog[] }>(`${this.apiUrl}/stock-logs/`, { params })
            .pipe(map(res => res.results || []));
    }
}
