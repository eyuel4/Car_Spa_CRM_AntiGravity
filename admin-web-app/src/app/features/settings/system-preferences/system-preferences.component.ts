import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-system-preferences',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './system-preferences.component.html'
})
export class SystemPreferencesComponent implements OnInit {
    prefForm: FormGroup;
    isLoading = false;
    isSaving = false;

    // Tax Config
    taxConfigId: number | null = null;

    currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' }
    ];

    timezones = [
        'UTC', 'Africa/Addis_Ababa', 'America/New_York', 'Europe/London'
    ];

    constructor(
        private fb: FormBuilder,
        private http: HttpClient
    ) {
        this.prefForm = this.fb.group({
            taxName: ['VAT', Validators.required],
            taxRate: [0.15, [Validators.required, Validators.min(0), Validators.max(1)]],
            currency: ['USD'],
            timezone: ['UTC'],
            dateFormat: ['mediumDate']
        });
    }

    ngOnInit(): void {
        this.loadPreferences();
    }

    loadPreferences(): void {
        this.isLoading = true;

        // 1. Load Tax Config
        this.http.get<{ results: any[] }>(`${environment.apiUrl}/billing/tax-configurations/`).subscribe({
            next: (response) => {
                if (response.results && response.results.length > 0) {
                    const tax = response.results[0];
                    this.taxConfigId = tax.id;
                    this.prefForm.patchValue({
                        taxName: tax.name,
                        taxRate: tax.rate
                    });
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading tax config', err);
                this.isLoading = false;
            }
        });

        // Note: Currency/Timezone are currently client-side or mocked. 
        // In a full implementation, these would come from Tenant settings.
        // For MVP, we stick to defaults or local storage if implemented.
    }

    onSubmit(): void {
        if (this.prefForm.invalid) return;

        this.isSaving = true;
        const formVal = this.prefForm.value;

        const taxPayload = {
            name: formVal.taxName,
            rate: formVal.taxRate,
            is_active: true
        };

        const request = this.taxConfigId
            ? this.http.put(`${environment.apiUrl}/billing/tax-configurations/${this.taxConfigId}/`, taxPayload)
            : this.http.post(`${environment.apiUrl}/billing/tax-configurations/`, taxPayload);

        request.subscribe({
            next: () => {
                // Save other settings to LocalStorage for MVP
                localStorage.setItem('sys_currency', formVal.currency);
                localStorage.setItem('sys_timezone', formVal.timezone);
                localStorage.setItem('sys_dateFormat', formVal.dateFormat);

                this.isSaving = false;
                alert('Preferences saved successfully');
            },
            error: (err) => {
                console.error('Error saving preferences', err);
                this.isSaving = false;
                alert('Failed to save preferences');
            }
        });
    }
}
