import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountingService } from '../../../core/services/accounting.service';
import { Payment } from '../../../core/models/accounting.model';
import { PaymentMethod } from '../../../core/models/operations.model';
import { DashboardService } from '../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accounting-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ 'ACCOUNTING.TITLE' | translate }}</h1>
            <p class="text-gray-600 mt-1">{{ 'ACCOUNTING.SUBTITLE' | translate }}</p>
        </div>
        <button (click)="goToAnalytics()" class="btn btn-primary flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Revenue Analytics
        </button>
      </div>

      <!-- Filters -->
      <div class="card p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input type="text" [(ngModel)]="searchTerm" placeholder="Customer or Service..." class="input-field">
            </div>
            <!-- Date Start -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" [(ngModel)]="startDate" class="input-field">
            </div>
            <!-- Date End -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" [(ngModel)]="endDate" class="input-field">
            </div>
            <!-- Payment Method -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select [(ngModel)]="selectedPaymentMethod" class="input-field">
                    <option value="">All</option>
                    <option *ngFor="let method of paymentMethods" [value]="method">{{ method }}</option>
                </select>
            </div>
        </div>
      </div>

      <!-- KPI Cards (Filtered) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.TODAYS_REVENUE' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.today | currency }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.THIS_WEEK' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.week | currency }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">{{ 'ACCOUNTING.KPIS.THIS_MONTH' | translate }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.month | currency }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600">Filtered Avg</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ getFilteredAverage() | currency }}</p>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">{{ 'ACCOUNTING.RECENT_TRANSACTIONS.TITLE' | translate }} ({{ filteredTransactions.length }})</h3>
          <button class="btn btn-secondary" (click)="exportCSV()">
            {{ 'ACCOUNTING.RECENT_TRANSACTIONS.EXPORT_CSV' | translate }}
          </button>
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
              <tr *ngFor="let transaction of filteredTransactions" class="hover:bg-gray-50 cursor-pointer" (click)="viewTransaction(transaction.id)">
                <td class="px-4 py-3 text-sm">{{ transaction.payment_date | date:'short' }}</td>
                <td class="px-4 py-3 text-sm font-medium">{{ transaction.job_details?.customer_name || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm">{{ transaction.job_details?.service_summary || 'Service' }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-green-600">{{ transaction.amount | currency }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {{ transaction.payment_method }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredTransactions.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                  {{ 'ACCOUNTING.RECENT_TRANSACTIONS.NO_DATA' | translate }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .input-field { @apply w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2; }
    .card { @apply bg-white p-6 rounded-lg shadow-md; }
    .btn { @apply px-4 py-2 rounded-md text-sm font-medium transition-colors; }
    .btn-secondary { @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50; }
  `]
})
export class AccountingOverviewComponent implements OnInit {
  transactions: Payment[] = [];
  stats = {
    today: 0,
    week: 0,
    month: 0,
    avg: 0
  };

  // Filters
  searchTerm = '';
  startDate = '';
  endDate = '';
  selectedPaymentMethod = '';

  readonly paymentMethods: PaymentMethod[] = ['CASH', 'MOBILE_TRANSFER', 'MOBILE_BANKING', 'CARD', 'OTHER'];

  constructor(
    private accountingService: AccountingService,
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Load Stats
    forkJoin({
      today: this.dashboardService.getDashboardStats('today'),
      week: this.dashboardService.getDashboardStats('week'),
      month: this.dashboardService.getDashboardStats('month')
    }).subscribe({
      next: (results) => {
        this.stats.today = parseFloat(results.today.kpis.revenue || '0');
        this.stats.week = parseFloat(results.week.kpis.revenue || '0');
        this.stats.month = parseFloat(results.month.kpis.revenue || '0');
      }
    });

    // Load Transactions
    this.accountingService.getPayments().subscribe({
      next: (data) => {
        this.transactions = data.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
      },
      error: (err) => console.error('Error loading payments', err)
    });
  }

  get filteredTransactions(): Payment[] {
    return this.transactions.filter(t => {
      // 1. Search
      const searchMatch = !this.searchTerm ||
        (t.job_details?.customer_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
        (t.job_details?.service_summary?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);

      // 2. Date Range
      let dateMatch = true;
      const tDate = new Date(t.payment_date);
      if (this.startDate) {
        dateMatch = dateMatch && tDate >= new Date(this.startDate);
      }
      if (this.endDate) {
        // Add 1 day to include the end date fully
        const end = new Date(this.endDate);
        end.setDate(end.getDate() + 1);
        dateMatch = dateMatch && tDate < end;
      }

      // 3. Payment Method
      const methodMatch = !this.selectedPaymentMethod || t.payment_method === this.selectedPaymentMethod;

      return searchMatch && dateMatch && methodMatch;
    });
  }

  getFilteredAverage(): number {
    const filtered = this.filteredTransactions;
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    return total / filtered.length;
  }

  exportCSV(): void {
    const dataToExport = this.filteredTransactions;
    if (dataToExport.length === 0) return;

    const headers = ['Date', 'Customer', 'Service', 'Amount', 'Payment Method', 'Reference'];
    const rows = dataToExport.map(t => [
      t.payment_date,
      t.job_details?.customer_name || 'N/A',
      t.job_details?.service_summary || 'N/A',
      t.amount,
      t.payment_method,
      t.transaction_reference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_\${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  viewTransaction(id: number): void {
    this.router.navigate(['/accounting/transaction', id]);
  }

  goToAnalytics(): void {
    this.router.navigate(['/accounting/analytics']);
  }
}

