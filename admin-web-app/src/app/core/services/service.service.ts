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
}
