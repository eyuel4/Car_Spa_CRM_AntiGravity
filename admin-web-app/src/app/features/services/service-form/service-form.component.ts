import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceService } from '../../../core/services/service.service';
import { Category, Service } from '../../../core/models/business.model';

@Component({
    selector: 'app-service-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule],
    template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ (isEditMode ? 'SERVICES.EDIT_SERVICE' : 'SERVICES.ADD_SERVICE') | translate }}
          </h1>
          <p class="text-gray-600 mt-1">
            {{ (isEditMode ? 'SERVICES.EDIT_SUBTITLE' : 'SERVICES.CREATE_SUBTITLE') | translate }}
          </p>
        </div>
        <button (click)="onCancel()" class="text-gray-600 hover:text-gray-800">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()" class="card space-y-6">
        
        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ 'SERVICES.FORM.NAME' | translate }} *
            </label>
            <input 
              type="text" 
              formControlName="name"
              class="input-field"
              [class.border-red-500]="isFieldInvalid('name')"
              placeholder="{{ 'SERVICES.FORM.PLACEHOLDERS.NAME' | translate }}"
            >
            <p *ngIf="isFieldInvalid('name')" class="text-red-500 text-xs mt-1">
              {{ 'COMMON.REQUIRED_FIELD' | translate }}
            </p>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ 'SERVICES.FORM.CATEGORY' | translate }} *
            </label>
            <select formControlName="category" class="input-field">
              <option [ngValue]="null" disabled>{{ 'SERVICES.FORM.PLACEHOLDERS.CATEGORY' | translate }}</option>
              <option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <p *ngIf="isFieldInvalid('category')" class="text-red-500 text-xs mt-1">
              {{ 'COMMON.REQUIRED_FIELD' | translate }}
            </p>
          </div>

          <!-- Price -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ 'SERVICES.FORM.PRICE' | translate }} *
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input 
                type="number" 
                formControlName="price"
                class="input-field pl-7"
                [class.border-red-500]="isFieldInvalid('price')"
                placeholder="0.00"
                min="0"
                step="0.01"
              >
            </div>
            <p *ngIf="isFieldInvalid('price')" class="text-red-500 text-xs mt-1">
              {{ 'COMMON.REQUIRED_FIELD' | translate }}
            </p>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ 'SERVICES.FORM.DURATION' | translate }} (min) *
            </label>
            <input 
              type="number" 
              formControlName="duration_minutes"
              class="input-field"
              [class.border-red-500]="isFieldInvalid('duration_minutes')"
              placeholder="30"
              min="1"
            >
            <p *ngIf="isFieldInvalid('duration_minutes')" class="text-red-500 text-xs mt-1">
              {{ 'COMMON.REQUIRED_FIELD' | translate }}
            </p>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ 'SERVICES.FORM.DESCRIPTION' | translate }}
          </label>
          <textarea 
            formControlName="description"
            rows="3"
            class="input-field"
            placeholder="{{ 'SERVICES.FORM.PLACEHOLDERS.DESCRIPTION' | translate }}"
          ></textarea>
        </div>

        <!-- Active Status -->
        <div class="flex items-center">
          <input 
            type="checkbox" 
            formControlName="is_active"
            id="is_active"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          >
          <label for="is_active" class="ml-2 block text-sm text-gray-900">
            {{ 'SERVICES.STATUS.ACTIVE' | translate }}
          </label>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            (click)="onCancel()"
            class="btn btn-secondary"
          >
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="serviceForm.invalid || isSubmitting"
          >
            <span *ngIf="isSubmitting">{{ 'COMMON.LOADING' | translate }}</span>
            <span *ngIf="!isSubmitting">
              {{ (isEditMode ? 'COMMON.UPDATE' : 'COMMON.SAVE') | translate }}
            </span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class ServiceFormComponent implements OnInit {
    serviceForm!: FormGroup;
    isEditMode = false;
    isSubmitting = false;
    serviceId?: number;
    categories: Category[] = [];

    constructor(
        private fb: FormBuilder,
        private serviceService: ServiceService,
        private router: Router,
        private route: ActivatedRoute,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadCategories();

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.serviceId = +params['id'];
                this.loadService(this.serviceId);
            }
        });
    }

    private initForm(): void {
        this.serviceForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            price: ['', [Validators.required, Validators.min(0)]],
            duration_minutes: ['', [Validators.required, Validators.min(1)]],
            category: [null, Validators.required],
            is_active: [true]
        });
    }

    private loadCategories(): void {
        this.serviceService.getCategories().subscribe({
            next: (cats) => this.categories = cats,
            error: (err) => console.error('Error loading categories', err)
        });
    }

    private loadService(id: number): void {
        this.serviceService.getById(id).subscribe({
            next: (service) => {
                this.serviceForm.patchValue({
                    name: service.name,
                    description: service.description,
                    price: service.price,
                    duration_minutes: service.duration_minutes,
                    category: service.category,
                    is_active: service.is_active
                });
            },
            error: (err) => {
                console.error('Error loading service', err);
                // Maybe redirect back or show notification
            }
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.serviceForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    onCancel(): void {
        this.router.navigate(['/services']);
    }

    onSubmit(): void {
        if (this.serviceForm.invalid) {
            this.serviceForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValue = this.serviceForm.value;

        const request = this.isEditMode && this.serviceId
            ? this.serviceService.update(this.serviceId, formValue)
            : this.serviceService.create(formValue);

        request.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.router.navigate(['/services']);
            },
            error: (err) => {
                console.error('Error saving service', err);
                this.isSubmitting = false;
                // Show error notification
            }
        });
    }
}
