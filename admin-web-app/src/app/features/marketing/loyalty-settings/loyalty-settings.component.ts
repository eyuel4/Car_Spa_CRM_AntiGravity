import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loyalty-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button (click)="goBack()" class="btn btn-secondary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Loyalty Program Settings</h1>
          <p class="text-gray-600">Configure points and tier thresholds</p>
        </div>
      </div>

      <!-- Points Configuration -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Points Earning Rules</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Points per Service</label>
            <input type="number" [(ngModel)]="settings.pointsPerService" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Points per Dollar Spent</label>
            <input type="number" [(ngModel)]="settings.pointsPerCurrency" class="input-field" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Points Expiry (Months)</label>
            <input type="number" [(ngModel)]="settings.pointsExpiryMonths" class="input-field" placeholder="Leave empty for no expiry" />
          </div>
        </div>
      </div>

      <!-- Tier Configuration -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Loyalty Tiers</h3>
        <div class="space-y-4">
          <div *ngFor="let tier of tiers" class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div [class]="'w-10 h-10 rounded-full flex items-center justify-center ' + tier.bgClass">
                  <svg class="w-6 h-6" [class]="tier.iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900">{{ tier.name }}</h4>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Points</label>
              <input type="number" [(ngModel)]="tier.minPoints" class="input-field" />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <button (click)="saveSettings()" class="btn btn-primary">Save Settings</button>
        <button (click)="goBack()" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  `,
  styles: []
})
export class LoyaltySettingsComponent {
  settings = {
    pointsPerService: 10,
    pointsPerCurrency: 1,
    pointsExpiryMonths: 12
  };

  tiers = [
    { name: 'Blue', minPoints: 0, bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
    { name: 'Silver', minPoints: 100, bgClass: 'bg-gray-200', iconClass: 'text-gray-600' },
    { name: 'Gold', minPoints: 500, bgClass: 'bg-yellow-100', iconClass: 'text-yellow-600' },
    { name: 'Diamond', minPoints: 1000, bgClass: 'bg-purple-100', iconClass: 'text-purple-600' }
  ];

  constructor(private router: Router) { }

  saveSettings(): void {
    console.log('Saving settings:', this.settings, this.tiers);
    alert('Settings saved successfully!');
  }

  goBack(): void {
    this.router.navigate(['/marketing']);
  }
}
