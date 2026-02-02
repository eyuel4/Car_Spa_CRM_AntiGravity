import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../../core/services/accounting.service';

@Component({
    selector: 'app-revenue-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
        <div class="flex gap-2">
            <input type="date" [(ngModel)]="filters.from" (change)="loadMetrics()" class="input-field">
            <span class="self-center">to</span>
            <input type="date" [(ngModel)]="filters.to" (change)="loadMetrics()" class="input-field">
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6 border-l-4 border-blue-500">
              <h3 class="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p class="text-3xl font-bold text-gray-900 mt-2">\${{ metrics?.total_revenue | number:'1.2-2' }}</p>
          </div>
          <!-- Add more summary cards if needed -->
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Revenue by Service Category -->
          <div class="card p-6">
              <h3 class="text-lg font-bold mb-4">Revenue by Service Category</h3>
              <div class="space-y-4">
                  <div *ngFor="let item of metrics?.revenue_by_category" class="relative pt-1">
                      <div class="flex mb-2 items-center justify-between">
                          <div>
                              <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                  {{ item.service__category__name || 'Uncategorized' }}
                              </span>
                          </div>
                          <div class="text-right">
                              <span class="text-xs font-semibold inline-block text-blue-600">
                                  \${{ item.total | number:'1.2-2' }}
                              </span>
                          </div>
                      </div>
                      <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                          <div [style.width.%]="getPercentage(item.total, metrics?.total_revenue)" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Revenue by Staff -->
          <div class="card p-6">
              <h3 class="text-lg font-bold mb-4">Revenue Attribution by Staff</h3>
              <div class="overflow-y-auto max-h-96">
                  <table class="min-w-full divide-y divide-gray-200">
                      <thead>
                          <tr>
                              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                              <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200">
                          <tr *ngFor="let staff of metrics?.revenue_by_staff">
                              <td class="px-3 py-2 text-sm text-gray-900">{{ staff.staff__first_name }} {{ staff.staff__last_name }}</td>
                              <td class="px-3 py-2 text-sm text-gray-900 text-right">\${{ staff.revenue | number:'1.2-2' }}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>

      </div>

      <!-- Revenue Trend -->
      <div class="card p-6">
          <h3 class="text-lg font-bold mb-4">Daily Revenue Trend</h3>
          <div class="h-64 flex items-end gap-2 border-b border-l p-4">
              <!-- Simple Bar Chart Visualization -->
              <div *ngFor="let day of metrics?.revenue_trend" 
                   class="bg-blue-500 hover:bg-blue-600 transition-all relative group w-12 rounded-t"
                   [style.height.%]="getPercentage(day.daily_total, maxDailyRevenue)">
                   
                   <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                       {{ day.date | date:'shortDate' }}: \${{ day.daily_total }}
                   </div>
              </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-500">
              <span *ngFor="let day of metrics?.revenue_trend">{{ day.date | date:'dd/MM' }}</span>
          </div>
      </div>
    </div>
  `
})
export class RevenueAnalyticsComponent implements OnInit {
    metrics: any = null;
    filters = {
        from: '',
        to: ''
    };

    constructor(private accountingService: AccountingService) { }

    ngOnInit(): void {
        this.loadMetrics();
    }

    loadMetrics(): void {
        this.accountingService.getRevenueMetrics(this.filters.from, this.filters.to).subscribe({
            next: (data) => this.metrics = data,
            error: (err) => console.error('Error loading metrics', err)
        });
    }

    getPercentage(value: number, total: number): number {
        if (!total) return 0;
        return (value / total) * 100;
    }

    get maxDailyRevenue(): number {
        if (!this.metrics?.revenue_trend) return 0;
        return Math.max(...this.metrics.revenue_trend.map((d: any) => d.daily_total));
    }
}
