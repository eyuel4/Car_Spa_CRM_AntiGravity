import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-marketing-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Marketing & Loyalty</h1>
        <p class="text-gray-600 mt-1">Manage loyalty programs and promotional campaigns</p>
      </div>

      <!-- Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button (click)="navigateTo('loyalty')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Loyalty Settings</h3>
              <p class="text-sm text-gray-600">Configure points and tiers</p>
            </div>
          </div>
        </button>

        <button (click)="navigateTo('coupons')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Coupons</h3>
              <p class="text-sm text-gray-600">Manage promotional codes</p>
            </div>
          </div>
        </button>

        <button (click)="navigateTo('analytics')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Analytics</h3>
              <p class="text-sm text-gray-600">Campaign performance</p>
            </div>
          </div>
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card">
          <p class="text-sm text-gray-600">Active Coupons</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.activeCoupons }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Total Redemptions</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.redemptions }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Loyalty Members</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.members }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Points Issued</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.pointsIssued }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MarketingOverviewComponent implements OnInit {
  stats = {
    activeCoupons: 5,
    redemptions: 127,
    members: 342,
    pointsIssued: 15680
  };

  constructor(private router: Router) { }

  ngOnInit(): void { }

  navigateTo(section: string): void {
    this.router.navigate(['/marketing', section]);
  }
}
