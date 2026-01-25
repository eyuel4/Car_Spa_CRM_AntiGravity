import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoyaltyTier {
  id: number;
  name: string;
  tier_name: string;
  min_points_required: number;
  points_multiplier: number;
  discount_percentage: number;
}

export interface Customer {
  id: number;
  customer_type: 'INDIVIDUAL' | 'CORPORATE';
  full_name: string;
  phone_number: string;
  email?: string;
  loyalty_points: number;
  current_tier_name?: string;
  car_count: number;
  visit_count: number;
  last_visit?: string;
  created_at: string;
}

export interface CustomerDetail {
  id: number;
  customer_type: 'INDIVIDUAL' | 'CORPORATE';
  phone_number: string;
  email?: string;
  address?: string;
  house_number?: string;
  state?: string;
  country: string;
  qr_code: string;
  // Individual fields
  first_name?: string;
  last_name?: string;
  full_name: string;
  date_of_birth?: string;
  sex?: string;
  // Corporate fields
  company_name?: string;
  tin_number?: string;
  // Loyalty fields
  loyalty_points: number;
  total_lifetime_points: number;
  current_tier?: number;
  current_tier_details?: LoyaltyTier;
  tier_achieved_date?: string;
  // Legacy
  is_corporate: boolean;
  visit_count: number;
  last_visit?: string;
  // Relationships
  cars: any[];
  corporate_profile?: any;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface IndividualOnboardingData {
  // Customer info
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  house_number?: string;
  state?: string;
  country?: string;
  date_of_birth?: string;
  sex?: string;
  // Car info
  car_type: string;
  car_make?: number;
  car_model?: number;
  car_make_text?: string;
  car_model_text?: string;
  plate_number: string;
  year?: number;
  color?: string;
  mileage?: number;
}

export interface CorporateOnboardingData {
  // Corporate info
  company_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  house_number?: string;
  state?: string;
  country?: string;
  tin_number?: string;
  // Cars
  cars: Array<{
    make?: number;
    model?: number;
    make_text?: string;
    model_text?: string;
    car_type?: string;
    plate_number: string;
    year?: number;
    color?: string;
    mileage?: number;
    corporate_car_id?: string;
  }>;
}

export interface LoyaltyAdjustment {
  points: number;
  reason: string;
  transaction_type?: 'EARNED' | 'ADJUSTMENT' | 'REDEEMED' | 'BONUS' | 'PENALTY';
}

export type SearchType = 'all' | 'phone' | 'plate' | 'name' | 'qr';

@Injectable({
  providedIn: 'root'
})
export class CustomerDataService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) { }

  /**
   * Get all customers (paginated)
   */
  getCustomers(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  /**
   * Search customers
   */
  searchCustomers(query: string, type: SearchType = 'all'): Observable<Customer[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', type);
    return this.http.get<Customer[]>(`${this.apiUrl}/search/`, { params });
  }

  /**
   * Get customer details
   */
  getCustomer(id: number): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Onboard individual customer
   */
  onboardIndividual(data: IndividualOnboardingData): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(`${this.apiUrl}/onboard_individual/`, data);
  }

  /**
   * Onboard corporate customer
   */
  onboardCorporate(data: CorporateOnboardingData): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(`${this.apiUrl}/onboard_corporate/`, data);
  }

  /**
   * Adjust loyalty points
   */
  adjustLoyaltyPoints(customerId: number, adjustment: LoyaltyAdjustment): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(`${this.apiUrl}/${customerId}/adjust_loyalty_points/`, adjustment);
  }

  /**
   * Get customer QR code
   */
  getQRCode(customerId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${customerId}/qr_code/`);
  }

  /**
   * Get customer's cars
   */
  getCustomerCars(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${customerId}/cars/`);
  }

  /**
   * Add car to customer
   */
  addCarToCustomer(customerId: number, carData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${customerId}/add_car/`, carData);
  }

  /**
   * Update customer
   */
  updateCustomer(id: number, data: Partial<CustomerDetail>): Observable<CustomerDetail> {
    return this.http.patch<CustomerDetail>(`${this.apiUrl}/${id}/`, data);
  }

  /**
   * Delete customer
   */
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
