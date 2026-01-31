import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { OperationsService } from '../../../core/services/operations.service';
import { ServiceService } from '../../../core/services/service.service';
import { Customer, Car, Service } from '../../../core/models/business.model';
import { CreateJobRequest } from '../../../core/models/operations.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-job-create',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
    template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Create New Job</h1>
        <button (click)="cancel()" class="btn btn-secondary">Cancel</button>
      </div>

      <!-- Steps Indicator -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center" [class.text-primary-600]="step >= 1" [class.text-gray-400]="step < 1">
          <span class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-2"
                [class.border-primary-600]="step >= 1" [class.bg-primary-600]="step >= 1" [class.text-white]="step >= 1">1</span>
          <span>Customer</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-200 mx-4"></div>
        <div class="flex items-center" [class.text-primary-600]="step >= 2" [class.text-gray-400]="step < 2">
          <span class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-2"
                [class.border-primary-600]="step >= 2" [class.bg-primary-600]="step >= 2" [class.text-white]="step >= 2">2</span>
          <span>Vehicle</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-200 mx-4"></div>
        <div class="flex items-center" [class.text-primary-600]="step >= 3" [class.text-gray-400]="step < 3">
          <span class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-2"
                [class.border-primary-600]="step >= 3" [class.bg-primary-600]="step >= 3" [class.text-white]="step >= 3">3</span>
          <span>Services</span>
        </div>
      </div>

      <!-- Step 1: Customer Selection -->
      <div *ngIf="step === 1" class="card">
        <h2 class="text-xl font-semibold mb-4">Select Customer</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
          <input type="text" [formControl]="searchControl" placeholder="Name, phone or email..." class="input-field">
        </div>

        <div class="space-y-2 mt-4 max-h-60 overflow-y-auto">
          <div *ngFor="let customer of searchResults" 
               (click)="selectCustomer(customer)"
               class="p-3 border rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center"
               [class.border-primary-500]="selectedCustomer?.id === customer.id"
               [class.bg-primary-50]="selectedCustomer?.id === customer.id">
            <div>
              <p class="font-medium">{{ customer.first_name }} {{ customer.last_name }}</p>
              <p class="text-sm text-gray-500">{{ customer.phone_number }} | {{ customer.email }}</p>
            </div>
            <div *ngIf="selectedCustomer?.id === customer.id" class="text-primary-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
          <p *ngIf="searchResults.length === 0 && searchControl.value" class="text-gray-500 text-center py-4">No customers found.</p>
        </div>

        <div class="mt-6 flex justify-end">
          <button (click)="nextStep()" [disabled]="!selectedCustomer" class="btn btn-primary">Next: Select Vehicle</button>
        </div>
      </div>

      <!-- Step 2: Car Selection -->
      <div *ngIf="step === 2" class="card">
        <h2 class="text-xl font-semibold mb-4">Select Vehicle for {{ selectedCustomer?.first_name }}</h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div *ngFor="let car of customerCars" 
               (click)="selectCar(car)"
               class="p-4 border rounded cursor-pointer hover:bg-gray-50 flex items-center justify-between"
               [class.border-primary-500]="selectedCar?.id === car.id"
               [class.bg-primary-50]="selectedCar?.id === car.id">
            <div>
              <p class="font-bold text-gray-900">{{ car.plate_number }}</p>
              <p class="text-sm text-gray-600">{{ car.make }} {{ car.model }}</p>
              <p class="text-xs text-gray-500" *ngIf="car.color">{{ car.color }}</p>
            </div>
             <div *ngIf="selectedCar?.id === car.id" class="text-primary-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
        </div>
        
        <div *ngIf="customerCars.length === 0" class="text-center py-8 text-gray-500">
          This customer has no vehicles registered.
        </div>

        <div class="mt-6 flex justify-between">
          <button (click)="prevStep()" class="btn btn-secondary">Back</button>
          <button (click)="nextStep()" [disabled]="!selectedCar" class="btn btn-primary">Next: Select Services</button>
        </div>
      </div>

      <!-- Step 3: Service Selection -->
      <div *ngIf="step === 3" class="card">
        <h2 class="text-xl font-semibold mb-4">Select Services</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          <div *ngFor="let service of availableServices" 
               (click)="toggleService(service)"
               class="p-4 border rounded cursor-pointer hover:bg-gray-50 flex flex-col justify-between"
               [class.border-primary-500]="isSelected(service)"
               [class.bg-primary-50]="isSelected(service)">
            <div>
              <div class="flex justify-between items-start mb-2">
                 <h3 class="font-medium text-gray-900">{{ service.name }}</h3>
                 <span *ngIf="isSelected(service)" class="text-primary-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                 </span>
              </div>
              <p class="text-xs text-gray-500 line-clamp-2">{{ service.description }}</p>
            </div>
            <div class="mt-3 font-bold text-gray-900">
              \${{ service.price }}
              <span class="text-xs font-normal text-gray-500 ml-1" *ngIf="service.duration_minutes">{{ service.duration_minutes }} min</span>
            </div>
          </div>
        </div>

        <div class="mt-6 border-t pt-4">
            <div class="flex justify-between items-center text-lg font-bold">
                <span>Total Estimated:</span>
                <span>\${{ calculateTotal() }}</span>
            </div>
        </div>

        <div class="mt-6 flex justify-between">
          <button (click)="prevStep()" class="btn btn-secondary">Back</button>
          <button (click)="submitJob()" [disabled]="selectedServices.length === 0" class="btn btn-primary">
             Create Job
          </button>
        </div>
      </div>
    </div>
  `
})
export class JobCreateComponent implements OnInit {
    step = 1;

    // Data
    searchResults: Customer[] = [];
    customerCars: Car[] = [];
    availableServices: Service[] = [];

    // Selection
    selectedCustomer: Customer | null = null;
    selectedCar: Car | null = null;
    selectedServices: Service[] = [];

    // Controls
    searchControl = this.fb.control('');

    constructor(
        private fb: FormBuilder,
        private customerService: CustomerService,
        private carService: CustomerService, // Using CustomerService for cars based on previous check
        private serviceService: ServiceService,
        private operationsService: OperationsService,
        private router: Router
    ) { }

    ngOnInit() {
        this.setupSearch();
        this.loadServices();
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                if (!query || query.length < 2) return [];
                return this.customerService.search(query);
            })
        ).subscribe(results => {
            this.searchResults = results;
        });
    }

    loadServices() {
        this.serviceService.getAll().subscribe(services => {
            this.availableServices = services.filter(s => s.is_active);
        });
    }

    selectCustomer(customer: Customer) {
        this.selectedCustomer = customer;
    }

    selectCar(car: Car) {
        this.selectedCar = car;
    }

    toggleService(service: Service) {
        const index = this.selectedServices.findIndex(s => s.id === service.id);
        if (index > -1) {
            this.selectedServices.splice(index, 1);
        } else {
            this.selectedServices.push(service);
        }
    }

    isSelected(service: Service): boolean {
        return this.selectedServices.some(s => s.id === service.id);
    }

    calculateTotal(): number {
        return this.selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);
    }

    nextStep() {
        if (this.step === 1 && this.selectedCustomer) {
            this.customerService.getCars(this.selectedCustomer.id).subscribe(cars => {
                this.customerCars = cars;
                this.step = 2;
            });
        } else if (this.step === 2 && this.selectedCar) {
            this.step = 3;
        }
    }

    prevStep() {
        this.step--;
    }

    submitJob() {
        if (!this.selectedCustomer || !this.selectedCar || this.selectedServices.length === 0) return;

        const request: CreateJobRequest = {
            customer_id: this.selectedCustomer.id,
            car_id: this.selectedCar.id,
            service_ids: this.selectedServices.map(s => s.id)
        };

        this.operationsService.createJob(request).subscribe({
            next: (job) => {
                this.router.navigate(['/operations', job.id]);
            },
            error: (err) => {
                console.error('Error creating job', err);
                // Add toast notification here
            }
        });
    }

    cancel() {
        this.router.navigate(['/operations']);
    }
}
