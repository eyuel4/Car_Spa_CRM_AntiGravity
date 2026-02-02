import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationsService } from '../../../core/services/operations.service';
import { Job } from '../../../core/models/operations.model';

@Component({
    selector: 'app-job-history',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Job History</h1>
          <p class="text-gray-600 mt-1">View past jobs, completed services, and payment records.</p>
        </div>
        <div class="flex gap-2">
            <button (click)="exportCSV()" class="btn btn-secondary flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Export CSV
            </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" [(ngModel)]="filters.search" (keyup.enter)="loadJobs()" placeholder="Search by customer or plate..." class="input-field">
              <input type="date" [(ngModel)]="filters.date_from" (change)="loadJobs()" class="input-field">
              <input type="date" [(ngModel)]="filters.date_to" (change)="loadJobs()" class="input-field">
              <select [(ngModel)]="filters.status" (change)="loadJobs()" class="input-field">
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
              </select>
          </div>
      </div>

      <!-- Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let job of jobs" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{{ job.id }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ job.created_at | date:'mediumDate' }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div class="font-medium text-gray-900">{{ job.customer.first_name }} {{ job.customer.last_name }}</div>
                            <div class="text-xs">{{ job.customer.phone_number }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{{ job.car.plate_number }}</div>
                            <div class="text-xs">{{ job.car.make }} {{ job.car.model }}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                            <ul class="list-disc list-inside">
                                <li *ngFor="let item of job.items">{{ item.service.name }}</li>
                            </ul>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            \${{ calculateTotal(job) }}
                        </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                  [ngClass]="getStatusClass(job.status)">
                                {{ job.status }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button (click)="viewDetails(job.id)" class="text-indigo-600 hover:text-indigo-900">View</button>
                        </td>
                    </tr>
                    <tr *ngIf="jobs.length === 0">
                        <td colspan="8" class="px-6 py-8 text-center text-gray-500">No jobs found matching filters.</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  `
})
export class JobHistoryComponent implements OnInit {
    jobs: Job[] = [];
    filters = {
        search: '',
        date_from: '',
        date_to: '',
        status: ''
    };

    constructor(
        private operationsService: OperationsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadJobs();
    }

    loadJobs(): void {
        const params: any = {};
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.date_from) params.created_after = this.filters.date_from; // Backend needs DRF filters setup for this
        if (this.filters.date_to) params.created_before = this.filters.date_to;
        if (this.filters.status) params.status = this.filters.status;
        else params.status = 'COMPLETED,PAID,CANCELLED'; // Default to history stats

        this.operationsService.getJobs(params).subscribe({
            next: (data) => this.jobs = data,
            error: (err) => console.error('Error loading history', err)
        });
    }

    viewDetails(id: number): void {
        this.router.navigate(['/operations', id]);
    }

    calculateTotal(job: Job): number {
        return job.items?.reduce((sum, item) => sum + parseFloat(item.price), 0) || 0;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'PAID': return 'bg-green-200 text-green-900';
            case 'CANCELLED': return 'bg-gray-200 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    exportCSV(): void {
        alert('CSV Export logic to be implemented on backend');
    }
}
