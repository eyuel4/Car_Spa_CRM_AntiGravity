import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Staff, EmergencyContact } from '../models/business.model';
import { environment } from '../../../environments/environment';

export interface MonthlyPerformance {
  year: number;
  monthly_breakdown: Array<{
    month: string;
    month_name: string;
    services_completed: number;
  }>;
  total_services: number;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Staff[]> {
    return this.http.get<{ results: Staff[] }>(this.apiUrl + '/').pipe(
      map(response => response.results || [])
    );
  }

  getById(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/${id}/`);
  }

  create(staff: Partial<Staff>): Observable<Staff> {
    // Handle FormData if photo is included
    if (staff.photo && typeof staff.photo === 'string') {
      // If photo is a base64 string, convert to FormData
      const formData = this.createFormData(staff);
      return this.http.post<Staff>(this.apiUrl + '/', formData);
    }
    return this.http.post<Staff>(this.apiUrl + '/', staff);
  }

  update(id: number, staff: Partial<Staff>): Observable<Staff> {
    // Handle FormData if photo is included
    if (staff.photo && typeof staff.photo === 'string') {
      const formData = this.createFormData(staff);
      return this.http.put<Staff>(`${this.apiUrl}/${id}/`, formData);
    }
    return this.http.put<Staff>(`${this.apiUrl}/${id}/`, staff);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  toggleActive(id: number, isActive: boolean): Observable<Staff> {
    return this.http.patch<Staff>(`${this.apiUrl}/${id}/`, { is_active: isActive });
  }

  uploadPhoto(id: number, file: File): Observable<Staff> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<Staff>(`${this.apiUrl}/${id}/upload_photo/`, formData);
  }

  getMonthlyPerformance(id: number, year?: number): Observable<MonthlyPerformance> {
    const url = year ? `${this.apiUrl}/${id}/monthly_performance/?year=${year}` : `${this.apiUrl}/${id}/monthly_performance/`;
    return this.http.get<MonthlyPerformance>(url);
  }

  // Emergency Contacts
  getEmergencyContacts(staffId: number): Observable<EmergencyContact[]> {
    return this.http.get<EmergencyContact[]>(`${this.apiUrl}/${staffId}/emergency_contacts/`);
  }

  addEmergencyContact(staffId: number, contact: Partial<EmergencyContact>): Observable<EmergencyContact> {
    return this.http.post<EmergencyContact>(`${this.apiUrl}/${staffId}/emergency_contacts/`, contact);
  }

  updateEmergencyContact(staffId: number, contact: Partial<EmergencyContact>): Observable<EmergencyContact> {
    return this.http.put<EmergencyContact>(`${this.apiUrl}/${staffId}/emergency_contacts/`, contact);
  }

  deleteEmergencyContact(staffId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${staffId}/emergency_contacts/?id=${contactId}`);
  }

  private createFormData(staff: Partial<Staff>): FormData {
    const formData = new FormData();
    
    Object.keys(staff).forEach(key => {
      const value = (staff as any)[key];
      if (value !== null && value !== undefined) {
        if (key === 'photo' && typeof value === 'string') {
          // Skip base64 photo in FormData - use uploadPhoto instead
          return;
        } else if (key === 'emergency_contacts' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'shop_id' || key === 'shop') {
          // Handle shop separately
          if (key === 'shop_id' && value) {
            formData.append('shop_id', value);
          }
        } else {
          formData.append(key, value);
        }
      }
    });
    
    return formData;
  }
}
