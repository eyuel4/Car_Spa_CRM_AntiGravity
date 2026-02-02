import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoyaltyTier {
    id: number;
    name: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    tier_name?: string;
    min_points_required: number;
    points_multiplier: number; // e.g. 1.0, 1.5
    discount_percentage: number;
}

export interface LoyaltyConfig {
    id: number;
    points_per_dollar: number;
    points_expiry_days?: number;
}

@Injectable({
    providedIn: 'root'
})
export class LoyaltyService {
    private apiUrl = `${environment.apiUrl}/loyalty`;

    constructor(private http: HttpClient) { }

    // Tiers
    getTiers(): Observable<LoyaltyTier[]> {
        return this.http.get<{ results: LoyaltyTier[] }>(`${this.apiUrl}/tiers/`).pipe(
            map(res => res.results || [])
        );
    }

    createTier(tier: Partial<LoyaltyTier>): Observable<LoyaltyTier> {
        return this.http.post<LoyaltyTier>(`${this.apiUrl}/tiers/`, tier);
    }

    updateTier(id: number, tier: Partial<LoyaltyTier>): Observable<LoyaltyTier> {
        return this.http.put<LoyaltyTier>(`${this.apiUrl}/tiers/${id}/`, tier);
    }

    // Config (Assuming we might expose a config endpoint or manage via single object)
    // For MVP, if config endpoint isn't fully exposed, we might skip this or assume ID=1
    // Based on backend, LoyaltyConfiguration is a model but ViewSet wasn't explicitly seen in loyalty/views.py scan?
    // Let's assume standard CRUD or similar structure.
    // If not present, we will focus on Tiers for now.
}
