import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard/stats`;

  constructor(private http: HttpClient) { }

  getDashboardStats(
    period: string = 'today',
    dateFrom?: string,
    dateTo?: string
  ): Observable<DashboardStats> {
    let params = new HttpParams().set('period', period);
    
    if (period === 'custom' && dateFrom && dateTo) {
      params = params.set('date_from', dateFrom).set('date_to', dateTo);
    }
    
    return this.http.get<DashboardStats>(this.apiUrl, { params });
  }
}

