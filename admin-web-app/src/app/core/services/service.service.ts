import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Service, Category } from '../models/business.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Service[]> {
    return this.http.get<{ results: Service[] }>(this.apiUrl + '/').pipe(
      map(response => response.results || [])
    );
  }

  getById(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}/`);
  }

  create(service: Partial<Service>): Observable<Service> {
    return this.http.post<Service>(this.apiUrl + '/', service);
  }

  update(id: number, service: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}/`, service);
  }

  toggleActive(id: number, isActive: boolean): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}/`, { is_active: isActive });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<{ results: Category[] }>(`${environment.apiUrl}/categories/`).pipe(
      map(response => response.results || [])
    );
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories/`, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}/`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/categories/${id}/`);
  }

  // Car Types
  getCarTypes(): Observable<any[]> {
    return this.http.get<{ results: any[] }>(`${environment.apiUrl}/car-types/`).pipe(
      map(response => response.results || [])
    );
  }

  createCarType(carType: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/car-types/`, carType);
  }

  updateCarType(id: number, carType: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/car-types/${id}/`, carType);
  }

  deleteCarType(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/car-types/${id}/`);
  }

  // Service Pricing
  getServicePricing(serviceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${serviceId}/pricing/`);
  }

  updateServicePrice(priceId: number, priceData: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/service-prices/${priceId}/`, priceData);
  }

  createServicePrice(serviceId: number, priceData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/service-prices/`, { ...priceData, service: serviceId });
  }

  // QC Checklist Items
  getQCItems(serviceId?: number): Observable<any[]> {
    let url = `${environment.apiUrl}/qc-items/`;
    if (serviceId) {
      url += `?service=${serviceId}`;
    }
    return this.http.get<{ results: any[] }>(url).pipe(
      map(res => res.results || [])
    );
  }

  createQCItem(item: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/qc-items/`, item);
  }

  deleteQCItem(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/qc-items/${id}/`);
  }
}
