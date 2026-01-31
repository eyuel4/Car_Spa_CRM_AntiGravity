import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationsService } from '../../../core/services/operations.service';
import { Job, JobStatus } from '../../../core/models/operations.model';

@Component({
    selector: 'app-jobs-queue',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Operations Center</h1>
          <p class="text-gray-600 mt-1">Manage active jobs and workflow</p>
        </div>
        <button (click)="createNewJob()" class="btn btn-primary">
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Job
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button *ngFor="let status of statuses" 
                (click)="filterStatus = status; loadJobs()"
                [class]="filterStatus === status ? 'btn btn-primary' : 'btn btn-secondary'">
           {{ status | titlecase }}
        </button>
        <button (click)="filterStatus = 'ALL'; loadJobs()"
                [class]="filterStatus === 'ALL' ? 'btn btn-primary' : 'btn btn-secondary'">
           All
        </button>
      </div>

      <!-- Kanban Board -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Pending Column -->
        <div class="space-y-4">
           <h3 class="font-bold text-gray-700 flex items-center">
              <span class="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
              Pending
              <span class="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{{ getJobsByStatus('PENDING').length }}</span>
           </h3>
           <div *ngFor="let job of getJobsByStatus('PENDING')" (click)="viewJob(job.id)" 
                class="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md border-l-4 border-yellow-400">
              <div class="flex justify-between items-start">
                  <span class="font-bold text-gray-900">#{{ job.id }}</span>
                  <span class="text-sm text-gray-500">{{ job.created_at | date:'shortTime' }}</span>
              </div>
              <p class="font-medium mt-1">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
              <p class="text-sm text-gray-600">{{ job.car.make }} {{ job.car.model }}</p>
              <div class="mt-3 flex flex-wrap gap-1">
                 <span *ngFor="let item of job.items" class="text-xs bg-gray-100 px-2 py-1 rounded">
                    {{ item.service.name }}
                 </span>
              </div>
           </div>
        </div>

        <!-- In Progress Column -->
        <div class="space-y-4">
           <h3 class="font-bold text-gray-700 flex items-center">
              <span class="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              In Progress
              <span class="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{{ getJobsByStatus('IN_PROGRESS').length }}</span>
           </h3>
           <div *ngFor="let job of getJobsByStatus('IN_PROGRESS')" (click)="viewJob(job.id)"
                class="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md border-l-4 border-blue-500">
               <div class="flex justify-between items-start">
                  <span class="font-bold text-gray-900">#{{ job.id }}</span>
                  <span class="text-sm text-gray-500">{{ job.created_at | date:'shortTime' }}</span>
              </div>
              <p class="font-medium mt-1">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
              <p class="text-sm text-gray-600">{{ job.car.make }} {{ job.car.model }}</p>
              <div class="mt-2 text-xs text-blue-600 font-medium">
                  Active
              </div>
           </div>
        </div>

        <!-- QC Column -->
        <div class="space-y-4">
           <h3 class="font-bold text-gray-700 flex items-center">
              <span class="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
              Quality Check
              <span class="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{{ getJobsByStatus('QC').length }}</span>
           </h3>
           <div *ngFor="let job of getJobsByStatus('QC')" (click)="viewJob(job.id)"
                class="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md border-l-4 border-purple-500">
               <div class="flex justify-between items-start">
                  <span class="font-bold text-gray-900">#{{ job.id }}</span>
              </div>
              <p class="font-medium mt-1">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
              <p class="text-sm text-gray-600">{{ job.car.make }} {{ job.car.model }}</p>
           </div>
        </div>

        <!-- Completed Column -->
        <div class="space-y-4">
           <h3 class="font-bold text-gray-700 flex items-center">
              <span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Completed
              <span class="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{{ getJobsByStatus('COMPLETED').length + getJobsByStatus('PAID').length }}</span>
           </h3>
           <div *ngFor="let job of completedJobs" (click)="viewJob(job.id)"
                class="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md border-l-4 border-green-500 opacity-75 hover:opacity-100">
               <div class="flex justify-between items-start">
                  <span class="font-bold text-gray-900">#{{ job.id }}</span>
                  <span class="px-2 py-0.5 rounded text-xs" 
                        [class]="job.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                     {{ job.status }}
                  </span>
              </div>
              <p class="font-medium mt-1">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
           </div>
        </div>

      </div>
    </div>
  `,
    styles: []
})
export class JobsQueueComponent implements OnInit {
    jobs: Job[] = [];
    filterStatus: JobStatus | 'ALL' = 'ALL';
    statuses: JobStatus[] = ['PENDING', 'IN_PROGRESS', 'QC', 'COMPLETED', 'PAID'];

    get completedJobs() {
        return this.jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    }

    constructor(
        private operationsService: OperationsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadJobs();
    }

    loadJobs(): void {
        const filters = this.filterStatus !== 'ALL' ? { status: this.filterStatus } : {};
        // Actually for Kanban board we usually want ALL active jobs to fill columns.
        // If filter is applied, we might filter local list or fetch specific.
        // For now, let's fetch all active checks (exclude CANCELLED maybe?) or just fetch relevant.
        // Simpler: Fetch all and sort into columns.

        this.operationsService.getJobs().subscribe({
            next: (data) => this.jobs = data,
            error: (err) => console.error('Error loading jobs', err)
        });
    }

    getJobsByStatus(status: JobStatus): Job[] {
        return this.jobs.filter(j => j.status === status);
    }

    createNewJob(): void {
        this.router.navigate(['/operations/new']);
    }

    viewJob(id: number): void {
        this.router.navigate(['/operations', id]);
    }
}
