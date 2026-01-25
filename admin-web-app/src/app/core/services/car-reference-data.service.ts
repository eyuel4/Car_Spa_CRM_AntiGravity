import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CarMake {
  id: number;
  name: string;
  logo_url: string;
  is_active: boolean;
  models_count: number;
  created_at: string;
}

export interface CarModel {
  id: number;
  make: number;
  make_name: string;
  make_logo: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CarModelSimple {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarReferenceDataService {
  private apiUrl = `${environment.apiUrl}/car-makes`;
  private modelsUrl = `${environment.apiUrl}/car-models`;

  constructor(private http: HttpClient) { }

  /**
   * Get all car makes
   */
  getCarMakes(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Get a specific car make
   */
  getCarMake(id: number): Observable<CarMake> {
    return this.http.get<CarMake>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Get models for a specific make
   */
  getModelsForMake(makeId: number): Observable<CarModelSimple[]> {
    return this.http.get<CarModelSimple[]>(`${this.apiUrl}/${makeId}/models/`);
  }

  /**
   * Get all car models
   */
  getCarModels(makeId?: number, search?: string): Observable<any> {
    let params = new HttpParams();
    if (makeId) {
      params = params.set('make', makeId.toString());
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(this.modelsUrl, { params });
  }

  /**
   * Get a specific car model
   */
  getCarModel(id: number): Observable<CarModel> {
    return this.http.get<CarModel>(`${this.modelsUrl}/${id}/`);
  }
}
