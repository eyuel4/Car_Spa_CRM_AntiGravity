import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ 'SETTINGS.TITLE' | translate }}</h1>
        <p class="text-gray-600 mt-1">{{ 'SETTINGS.SUBTITLE' | translate }}</p>
      </div>

      <!-- Settings Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button (click)="navigateTo('shops')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ 'SETTINGS.SHOPS.TITLE' | translate }}</h3>
              <p class="text-sm text-gray-600">{{ 'SETTINGS.SHOPS.SUBTITLE' | translate }}</p>
            </div>
          </div>
        </button>

        <button (click)="navigateTo('localization')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ 'SETTINGS.LOCALIZATION.TITLE' | translate }}</h3>
              <p class="text-sm text-gray-600">{{ 'SETTINGS.LOCALIZATION.SUBTITLE' | translate }}</p>
            </div>
          </div>
        </button>

        <button (click)="navigateTo('notifications')" class="card hover:shadow-lg transition-shadow text-left">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ 'SETTINGS.NOTIFICATIONS.TITLE' | translate }}</h3>
              <p class="text-sm text-gray-600">{{ 'SETTINGS.NOTIFICATIONS.SUBTITLE' | translate }}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class SettingsOverviewComponent {
  constructor(private router: Router) { }

  navigateTo(section: string): void {
    this.router.navigate(['/settings', section]);
  }
}
