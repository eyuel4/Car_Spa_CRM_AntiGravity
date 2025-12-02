import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Coupon } from '../../../core/models/business.model';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="btn btn-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Coupons & Promotions</h1>
            <p class="text-gray-600">Manage promotional codes and discounts</p>
          </div>
        </div>
        <button class="btn btn-primary">
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create Coupon
        </button>
      </div>

      <!-- Filter -->
      <div class="card">
        <select [(ngModel)]="filterStatus" (change)="applyFilter()" class="input-field sm:w-48">
          <option value="all">All Coupons</option>
          <option value="active">Active Only</option>
          <option value="expired">Expired Only</option>
        </select>
      </div>

      <!-- Coupons List -->
      <div class="space-y-3">
        <div *ngFor="let coupon of filteredCoupons" class="card">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-gray-900">{{ coupon.code }}</h3>
                <span [class]="coupon.is_active ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'">
                  {{ coupon.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ coupon.description }}</p>
              <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>
                  <strong>Discount:</strong> 
                  {{ coupon.discount_type === 'PERCENTAGE' ? coupon.discount_value + '%' : '$' + coupon.discount_value }}
                </span>
                <span *ngIf="coupon.expiry_date">
                  <strong>Expires:</strong> {{ coupon.expiry_date | date }}
                </span>
                <span>
                  <strong>Redemptions:</strong> {{ coupon.redemptions_count }}{{ coupon.max_redemptions ? '/' + coupon.max_redemptions : '' }}
                </span>
              </div>
            </div>
            <div class="flex sm:flex-col gap-2">
              <button class="btn btn-secondary">Edit</button>
              <button (click)="toggleActive(coupon)" [class.btn-primary]="!coupon.is_active" class="btn btn-secondary">
                {{ coupon.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredCoupons.length === 0" class="card">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
          <p class="text-gray-600">Create your first promotional coupon</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CouponsListComponent implements OnInit {
  coupons: Coupon[] = [
    {
      id: 1,
      code: 'WELCOME20',
      description: 'Welcome discount for new customers',
      discount_type: 'PERCENTAGE',
      discount_value: '20',
      expiry_date: '2025-12-31',
      max_redemptions: 100,
      redemptions_count: 45,
      is_active: true
    },
    {
      id: 2,
      code: 'SUMMER50',
      description: 'Summer special - $50 off premium services',
      discount_type: 'FIXED_AMOUNT',
      discount_value: '50',
      expiry_date: '2025-08-31',
      max_redemptions: 50,
      redemptions_count: 28,
      is_active: true
    },
    {
      id: 3,
      code: 'LOYALTY15',
      description: 'Loyalty member exclusive discount',
      discount_type: 'PERCENTAGE',
      discount_value: '15',
      expiry_date: undefined,
      max_redemptions: undefined,
      redemptions_count: 156,
      is_active: true
    }
  ];

  filteredCoupons: Coupon[] = [];
  filterStatus = 'all';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredCoupons = [...this.coupons];
    } else if (this.filterStatus === 'active') {
      this.filteredCoupons = this.coupons.filter(c => c.is_active);
    } else {
      this.filteredCoupons = this.coupons.filter(c => !c.is_active);
    }
  }

  toggleActive(coupon: Coupon): void {
    coupon.is_active = !coupon.is_active;
    this.applyFilter();
  }

  goBack(): void {
    this.router.navigate(['/marketing']);
  }
}
