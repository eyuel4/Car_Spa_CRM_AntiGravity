import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { OperationsService } from '../../../core/services/operations.service';
import { StaffService } from '../../../core/services/staff.service';
import { Job, JobStatus, JobTask, JobItem } from '../../../core/models/operations.model';
import { Staff } from '../../../core/models/business.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6" *ngIf="job; else loading">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-3">
             <h1 class="text-2xl font-bold text-gray-900">Job #{{ job.id }}</h1>
             <span class="px-3 py-1 text-sm font-medium rounded-full"
                   [ngClass]="getStatusClass(job.status)">
               {{ job.status }}
             </span>
          </div>
          <p class="text-gray-600 mt-1">Created on {{ job.created_at | date:'medium' }}</p>
        </div>
        <div class="flex gap-2">
            <button (click)="goBack()" class="btn btn-secondary">Back</button>
            <!-- Quick Actions -->
            <button *ngIf="job.status === 'PENDING'" (click)="updateStatus('IN_PROGRESS')" class="btn btn-primary">Start Job</button>
            <button *ngIf="job.status === 'IN_PROGRESS'" (click)="updateStatus('QC')" class="btn btn-primary">Send to QC</button>
            <button *ngIf="job.status === 'QC'" (click)="openCompleteModal()" class="btn btn-success">Complete Job</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Customer Info -->
        <div class="card md:col-span-1 border-t-4 border-blue-500">
          <h3 class="font-semibold text-gray-900 mb-2">Customer</h3>
          <p class="font-bold">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
          <p class="text-sm text-gray-600">{{ job.customer.phone_number }}</p>
          <p class="text-sm text-gray-600">{{ job.customer.email }}</p>
        </div>

        <!-- Car Info -->
        <div class="card md:col-span-1 border-t-4 border-purple-500">
          <h3 class="font-semibold text-gray-900 mb-2">Vehicle</h3>
          <p class="font-bold text-lg">{{ job.car.plate_number }}</p>
          <p class="text-gray-700">{{ job.car.make }} {{ job.car.model }}</p>
          <p class="text-sm text-gray-500">{{ job.car.color }}</p>
        </div>

        <!-- Payment Info -->
        <div class="card md:col-span-1 border-t-4 border-green-500">
           <h3 class="font-semibold text-gray-900 mb-2">Payment</h3>
           <p class="text-sm text-gray-600">Method: {{ job.payment_method || 'Pending' }}</p>
           <p class="text-sm text-gray-600" *ngIf="job.transaction_reference">Ref: {{ job.transaction_reference }}</p>
           <p class="text-sm text-gray-600" *ngIf="job.completed_at">Completed: {{ job.completed_at | date:'short' }}</p>
        </div>
      </div>

      <!-- Job Items / Services -->
      <div class="card">
         <h3 class="text-xl font-bold mb-4">Services & Tasks</h3>
         <div class="space-y-6">
            <div *ngFor="let item of job.items" class="p-4 border rounded-lg bg-white shadow-sm">
               <!-- Service Header -->
               <div class="flex justify-between items-center mb-3">
                  <div class="flex items-center gap-4">
                      <div class="bg-blue-100 p-2 rounded text-blue-600">
                         <!-- Icon -->
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                      </div>
                      <div>
                         <p class="font-bold text-gray-900 text-lg">{{ item.service.name }}</p>
                         <p class="text-sm text-gray-600">{{ item.service.description }}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="font-bold text-gray-900 text-lg">\${{ item.price }}</p>
                  </div>
               </div>

               <!-- Tasks List -->
               <div class="ml-12 space-y-2">
                   <div *ngFor="let task of item.tasks" class="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                       <div class="flex items-center gap-2">
                           <span class="font-semibold text-gray-700">{{ task.task_name }}</span>
                           <span class="text-gray-500">- {{ getStaffName(task.staff_id) }}</span>
                           <span class="px-2 py-0.5 rounded text-xs font-medium" 
                                 [ngClass]="getTaskStatusClass(task.status)">
                               {{ task.status }}
                           </span>
                       </div>
                       <div class="flex gap-2">
                           <button *ngIf="task.status === 'PENDING'" (click)="startTask(task)" class="text-blue-600 hover:text-blue-800 text-xs font-semibold">Start</button>
                           <button *ngIf="task.status === 'IN_PROGRESS'" (click)="completeTask(task)" class="text-green-600 hover:text-green-800 text-xs font-semibold">Complete</button>
                           <span *ngIf="task.status === 'DONE'" class="text-green-600 text-xs flex items-center gap-1">
                               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                               Done
                           </span>
                       </div>
                   </div>
               </div>

               <!-- Actions: Assign Staff -->
               <div class="ml-12 mt-3 flex items-center gap-2">
                   <ng-container *ngIf="!isAssigning[item.id]">
                       <button (click)="toggleAssign(item.id)" class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                           Assign Staff
                       </button>
                   </ng-container>
                   
                   <ng-container *ngIf="isAssigning[item.id]">
                       <select [(ngModel)]="selectedStaff[item.id]" class="text-sm border rounded p-1">
                           <option [ngValue]="null">Select Staff</option>
                           <option *ngFor="let member of staffList" [ngValue]="member.id">
                               {{ member.first_name }} {{ member.last_name }}
                           </option>
                       </select>
                       <button (click)="assignStaff(item)" [disabled]="!selectedStaff[item.id]" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
                       <button (click)="toggleAssign(item.id)" class="text-xs text-gray-500 hover:text-gray-700 px-2">Cancel</button>
                   </ng-container>
               </div>

            </div>
         </div>
         
         <div class="mt-8 border-t pt-4 flex justify-end">
            <div class="text-2xl font-bold text-gray-900">
               Total: \${{ calculateTotal() }}
            </div>
         </div>
      </div>

       <!-- Complete Job Modal -->
       <div *ngIf="showCompleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
           <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
               <h3 class="text-xl font-bold mb-4">Complete Job & Payment</h3>
               
               <div class="space-y-4">
                   <!-- Payment Method -->
                   <div>
                       <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                       <select [(ngModel)]="paymentData.payment_method" class="input-field w-full border rounded p-2">
                           <option value="CASH">Cash</option>
                           <option value="CARD">Card / POS</option>
                           <option value="MOBILE_TRANSFER">Mobile Money</option>
                           <option value="BANK_TRANSFER">Bank Transfer</option>
                       </select>
                   </div>
                   
                   <!-- Confirmation Number - Only if NOT Cash -->
                   <div *ngIf="paymentData.payment_method !== 'CASH'">
                       <label class="block text-sm font-medium text-gray-700 mb-1">Confirmation Number *</label>
                       <input type="text" [(ngModel)]="paymentData.transaction_reference" class="input-field w-full border rounded p-2" placeholder="Enter Ref Number">
                       <p *ngIf="!paymentData.transaction_reference && isSubmitting" class="text-red-500 text-xs">Required</p>
                   </div>

                   <div class="bg-gray-50 p-4 rounded text-right">
                       <span class="text-gray-600">Total to Pay:</span>
                       <span class="text-xl font-bold ml-2">\${{ calculateTotal() }}</span>
                   </div>
               </div>

               <div class="flex justify-end gap-3 mt-6">
                   <button (click)="closeCompleteModal()" class="btn btn-secondary">Cancel</button>
                   <button (click)="confirmComplete()" class="btn btn-success">Confirm Payment</button>
               </div>
           </div>
       </div>

    </div>
    
    <ng-template #loading>
      <div class="flex justify-center items-center h-64">Loading job details...</div>
    </ng-template>
  `,
  styles: [`
    .btn-success { @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors; }
    .card { @apply bg-white p-6 rounded-lg shadow-md; }
  `]
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  staffList: Staff[] = [];

  // UI State
  isAssigning: { [itemId: number]: boolean } = {};
  selectedStaff: { [itemId: number]: number } = {};

  showCompleteModal = false;
  isSubmitting = false;
  paymentData = {
    payment_method: 'CASH',
    transaction_reference: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operationsService: OperationsService,
    private staffService: StaffService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadJob(+id);
      this.loadStaff();
    }
  }

  loadJob(id: number) {
    this.operationsService.getJob(id).subscribe({
      next: (data) => this.job = data,
      error: (err) => console.error('Error loading job', err)
    });
  }

  loadStaff() {
    this.staffService.getAll().subscribe({
      next: (data) => this.staffList = data.filter(s => s.is_active),
      error: (err) => console.error('Error loading staff', err)
    });
  }

  // --- Actions ---

  toggleAssign(itemId: number) {
    this.isAssigning[itemId] = !this.isAssigning[itemId];
    if (!this.isAssigning[itemId]) {
      this.selectedStaff[itemId] = 0; // Reset
    }
  }

  assignStaff(item: JobItem) {
    const staffId = this.selectedStaff[item.id];
    if (!staffId) return;

    const newTask: Partial<JobTask> = {
      job_item: item.id,
      staff_id: staffId,
      task_name: item.service.name, // Default task name = Service name
      status: 'PENDING'
    };

    this.operationsService.createTask(newTask).subscribe({
      next: (task) => {
        // Add to local list
        if (!item.tasks) item.tasks = [];
        item.tasks.push(task);

        // Reset UI
        this.toggleAssign(item.id);
      },
      error: (err) => console.error('Error creating task', err)
    });
  }

  startTask(task: JobTask) {
    this.operationsService.startTask(task.id).subscribe({
      next: (updated) => {
        task.status = updated.status;
        task.start_time = updated.start_time;
      },
      error: (err) => console.error('Error starting task', err)
    });
  }

  completeTask(task: JobTask) {
    this.operationsService.completeTask(task.id).subscribe({
      next: (updated) => {
        task.status = updated.status;
        task.end_time = updated.end_time;
      },
      error: (err) => console.error('Error completing task', err)
    });
  }

  openCompleteModal() {
    this.showCompleteModal = true;
    this.paymentData = { payment_method: 'CASH', transaction_reference: '' };
    this.isSubmitting = false;
  }

  closeCompleteModal() {
    this.showCompleteModal = false;
  }

  confirmComplete() {
    if (!this.job) return;
    this.isSubmitting = true;

    // Validate
    if (this.paymentData.payment_method !== 'CASH' && !this.paymentData.transaction_reference) {
      // Error shown in template
      return;
    }

    this.operationsService.completeJob(this.job.id, {
      status: 'COMPLETED', // Or PAID?
      payment_method: this.paymentData.payment_method,
      transaction_reference: this.paymentData.transaction_reference
    }).subscribe({
      next: (updated) => {
        this.job = updated;
        this.closeCompleteModal();
      },
      error: (err) => console.error('Error completing job', err)
    });
  }

  // --- Helpers ---

  updateStatus(status: JobStatus) {
    if (!this.job) return;
    this.operationsService.updateJobStatus(this.job.id, status).subscribe({
      next: (updated) => {
        if (this.job) this.job.status = updated.status;
      },
      error: (err) => console.error('Error updating status', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'QC': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PAID': return 'bg-green-200 text-green-900';
      case 'CANCELLED': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-600';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'DONE': return 'bg-green-100 text-green-700';
      default: return '';
    }
  }

  getStaffName(staffId?: number): string {
    if (!staffId) return 'Unassigned';
    const staff = this.staffList.find(s => s.id === staffId);
    return staff ? staff.first_name : 'Unknown';
  }

  calculateTotal(): number {
    if (!this.job || !this.job.items) return 0;
    return this.job.items.reduce((sum, item) => sum + parseFloat(item.price), 0);
  }

  goBack() {
    this.router.navigate(['/operations']);
  }
}
