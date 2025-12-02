import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-accounting-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ 'ACCOUNTING.TITLE' | translate }}</h1>
        <p class="text-gray-600 mt-1">{{ 'ACCOUNTING.SUBTITLE' | translate }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.TODAYS_REVENUE' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">\$2,450</p>
          <p class="text-xs text-green-600 mt-1">+12% {{ 'ACCOUNTING.KPIS.FROM_YESTERDAY' | translate }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.THIS_WEEK' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">\$14,280</p>
          <p class="text-xs text-green-600 mt-1">+8% {{ 'ACCOUNTING.KPIS.FROM_LAST_WEEK' | translate }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.THIS_MONTH' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">\$58,920</p>
          <p class="text-xs text-green-600 mt-1">+15% {{ 'ACCOUNTING.KPIS.FROM_LAST_MONTH' | translate }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.AVG_TRANSACTION' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">\$102</p>
          <p class="text-xs text-gray-600 mt-1">{{ 'ACCOUNTING.KPIS.BASED_ON' | translate: {count: 24} }}</p>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">{{ 'ACCOUNTING.REVENUE_TREND' | translate }}</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">{{ 'ACCOUNTING.CHART_PLACEHOLDER' | translate }}</p>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TITLE' | translate }}</h3>
          <button class="btn btn-secondary">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.EXPORT_CSV' | translate }}</button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TABLE.DATE' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TABLE.CUSTOMER' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TABLE.SERVICE' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TABLE.AMOUNT' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TABLE.STATUS' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let transaction of mockTransactions" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">{{ transaction.date }}</td>
                <td class="px-4 py-3 text-sm font-medium">{{ transaction.customer }}</td>
                <td class="px-4 py-3 text-sm">{{ transaction.service }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-green-600">\${{ transaction.amount }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {{ 'ACCOUNTING.RECENT_TRANSACTIONS.PAID' | translate }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AccountingOverviewComponent {
  mockTransactions = [
    { date: '2025-11-27 10:30', customer: 'John Doe', service: 'Full Wash & Wax', amount: 85, status: 'Paid' },
    { date: '2025-11-27 11:15', customer: 'Jane Smith', service: 'Interior Detailing', amount: 120, status: 'Paid' },
    { date: '2025-11-27 12:00', customer: 'Bob Wilson', service: 'Express Wash', amount: 45, status: 'Paid' },
    { date: '2025-11-27 13:30', customer: 'Alice Brown', service: 'Premium Package', amount: 180, status: 'Paid' },
  ];
}
