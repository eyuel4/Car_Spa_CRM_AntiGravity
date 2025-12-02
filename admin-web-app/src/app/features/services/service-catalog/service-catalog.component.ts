import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceService } from '../../../core/services/service.service';
import { Service } from '../../../core/models/business.model';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ 'SERVICES.TITLE' | translate }}</h1>
          <p class="text-gray-600 mt-1">{{ 'SERVICES.SUBTITLE' | translate }}</p>
        </div>
        <button class="btn btn-primary">
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          {{ 'SERVICES.ADD_SERVICE' | translate }}
        </button>
      </div>

      <!-- Filter -->
      <div class="card">
        <div class="flex gap-4">
          <select [(ngModel)]="filterStatus" (change)="applyFilter()" class="input-field sm:w-48">
            <option value="all">{{ 'SERVICES.FILTERS.ALL_SERVICES' | translate }}</option>
            <option value="active">{{ 'SERVICES.FILTERS.ACTIVE_ONLY' | translate }}</option>
            <option value="inactive">{{ 'SERVICES.FILTERS.INACTIVE_ONLY' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let service of filteredServices" class="card hover:shadow-lg transition-shadow">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ service.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ service.description || ('SERVICES.NO_DESCRIPTION' | translate) }}</p>
            </div>
            <span [class]="service.is_active ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'">
              {{ service.is_active ? ('SERVICES.STATUS.ACTIVE' | translate) : ('SERVICES.STATUS.INACTIVE' | translate) }}
            </span>
          </div>
          
          <div class="border-t border-gray-200 pt-3 mt-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-2xl font-bold text-primary-600">\${{ service.price }}</p>
                <p class="text-xs text-gray-500" *ngIf="service.duration_minutes">{{ 'SERVICES.DURATION' | translate: {minutes: service.duration_minutes} }}</p>
              </div>
              <div class="flex gap-2">
                <button class="text-primary-600 hover:text-primary-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button (click)="toggleActive(service)" [class.text-green-600]="!service.is_active" [class.text-red-600]="service.is_active">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredServices.length === 0" class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ 'SERVICES.EMPTY.TITLE' | translate }}</h3>
          <p class="text-gray-600">{{ 'SERVICES.EMPTY.SUBTITLE' | translate }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ServiceCatalogComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  filterStatus = 'all';

  constructor(private serviceService: ServiceService) { }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.serviceService.getAll().subscribe({
      next: (data) => {
        this.services = data;
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading services:', error);
      }
    });
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredServices = [...this.services];
    } else {
      const isActive = this.filterStatus === 'active';
      this.filteredServices = this.services.filter(s => s.is_active === isActive);
    }
  }

  toggleActive(service: Service): void {
    const newStatus = !service.is_active;
    this.serviceService.toggleActive(service.id, newStatus).subscribe({
      next: (updated) => {
        service.is_active = updated.is_active;
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error toggling service status:', error);
      }
    });
  }
}
