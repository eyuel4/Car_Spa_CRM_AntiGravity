import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-marketing-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    template: `
    <div class="h-full flex flex-col">
      <!-- Module Header & Tabs -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-gray-900">Marketing & Loyalty</h1>
        </div>
        
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <a routerLink="analytics" routerLinkActive="border-primary-500 text-primary-600" 
             class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
             Analytics
          </a>

          <a routerLink="coupons" routerLinkActive="border-primary-500 text-primary-600" 
             class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
             Coupons
          </a>

          <a routerLink="loyalty" routerLinkActive="border-primary-500 text-primary-600" 
             class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
             Loyalty Program
          </a>
        </nav>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-auto p-6">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class MarketingLayoutComponent { }
