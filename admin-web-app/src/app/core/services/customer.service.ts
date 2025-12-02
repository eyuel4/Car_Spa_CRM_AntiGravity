import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Customer, Car } from '../models/business.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) { }

  search(query: string): Observable<Customer[]> {
    return this.http.get<{ results: Customer[] }>(`${this.apiUrl}/?search=${query}`).pipe(
      map(response => response.results || [])
    );
  }

  getAll(): Observable<Customer[]> {
    return this.http.get<{ results: Customer[] }>(this.apiUrl + '/').pipe(
      map(response => response.results || [])
    );
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}/`);
  }

  create(customer: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl + '/', customer);
  }

  update(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}/`, customer);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  getCars(customerId: number): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/${customerId}/cars/`);
  }

  addCar(customerId: number, car: Partial<Car>): Observable<Car> {
    return this.http.post<Car>(`${this.apiUrl}/${customerId}/add_car/`, car);
  }
}
