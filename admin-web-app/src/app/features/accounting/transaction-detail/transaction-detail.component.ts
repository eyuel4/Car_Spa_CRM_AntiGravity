import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountingService } from '../../../core/services/accounting.service';
import { Payment } from '../../../core/models/accounting.model';

@Component({
    selector: 'app-transaction-detail',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
    <div class="space-y-6" *ngIf="payment; else loading">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ 'ACCOUNTING.TRANSACTION_DETAIL' | translate }}
          </h1>
          <p class="text-gray-600 mt-1">
            ID: #{{ payment.id }}
          </p>
        </div>
        <button (click)="goBack()" class="text-gray-600 hover:text-gray-800">
          {{ 'COMMON.BACK' | translate }}
        </button>
      </div>

      <!-- Content -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Payment Info -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Payment Information</h3>
            <dl class="space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-600">Amount:</dt>
                <dd class="font-bold text-green-600">{{ payment.amount | currency }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Date:</dt>
                <dd>{{ payment.payment_date | date:'medium' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Method:</dt>
                <dd>{{ payment.payment_method }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Reference:</dt>
                <dd>{{ payment.transaction_reference || 'N/A' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Job/Customer Info (if linked) -->
          <div *ngIf="payment.job_details">
            <h3 class="text-lg font-semibold mb-3">Related Job</h3>
            <dl class="space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-600">Customer:</dt>
                <dd>{{ payment.job_details.customer_name }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Service:</dt>
                <dd>{{ payment.job_details.service_summary }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Job ID:</dt>
                <dd>#{{ payment.job }}</dd>
              </div>
            </dl>
          </div>
        
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
          <p class="text-gray-600">{{ payment.notes || 'No notes available.' }}</p>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="flex justify-center items-center h-64">
        <p class="text-gray-500">{{ 'COMMON.LOADING' | translate }}</p>
      </div>
    </ng-template>
  `
})
export class TransactionDetailComponent implements OnInit {
    payment?: Payment;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private accountingService: AccountingService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.accountingService.getPaymentById(+id).subscribe({
                next: (data) => this.payment = data,
                error: (err) => console.error('Error loading payment', err)
            });
        }
    }

    goBack(): void {
        this.router.navigate(['/accounting']);
    }
}
