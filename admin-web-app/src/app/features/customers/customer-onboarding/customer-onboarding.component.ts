import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerDataService, IndividualOnboardingData } from '../../../core/services/customer-data.service';
import { CarReferenceDataService, CarMake, CarModelSimple } from '../../../core/services/car-reference-data.service';

@Component({
  selector: 'app-customer-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './customer-onboarding.component.html',
  styleUrls: ['./customer-onboarding.component.css']
})
export class CustomerOnboardingComponent implements OnInit {
  // Stepper forms
  accountTypeForm!: FormGroup;
  customerInfoForm!: FormGroup;
  carTypeForm!: FormGroup;
  carMakeForm!: FormGroup;
  carDetailsForm!: FormGroup;
  licensePlateForm!: FormGroup;

  // Mode management
  mode: 'new' | 'edit' | 'add-vehicle' = 'new';
  customerId?: number;
  existingCustomer?: any;

  // Step management
  currentStep = 0;
  totalSteps = 7;
  steps = [
    { label: 'Account Type', key: 'account' },
    { label: 'Customer Info', key: 'customer' },
    { label: 'Car Type', key: 'carType' },
    { label: 'Car Make', key: 'carMake' },
    { label: 'Car Details', key: 'carDetails' },
    { label: 'License Plate', key: 'license' },
    { label: 'Complete', key: 'complete' }
  ];

  // Data
  accountType: 'INDIVIDUAL' | 'CORPORATE' = 'INDIVIDUAL';
  carMakes: CarMake[] = [];
  carModels: CarModelSimple[] = [];
  selectedMake?: CarMake;
  generatedQRCode?: string;
  createdCustomer?: any;

  // UI State
  isSubmitting = false;
  errorMessage = '';

  // Car types with icons
  carTypes = [
    { value: 'SEDAN', label: 'Sedan', icon: 'directions_car' },
    { value: 'SUV', label: 'SUV', icon: 'airport_shuttle' },
    { value: 'VAN', label: 'Van', icon: 'local_shipping' },
    { value: 'TRUCK', label: 'Truck', icon: 'local_shipping' },
    { value: 'COUPE', label: 'Coupe', icon: 'sports_car' },
    { value: 'HATCHBACK', label: 'Hatchback', icon: 'directions_car' },
    { value: 'WAGON', label: 'Wagon', icon: 'directions_car' },
    { value: 'CONVERTIBLE', label: 'Convertible', icon: 'sports_car' },
    { value: 'OTHER', label: 'Other', icon: 'help_outline' }
  ];

  // Sex options
  sexOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerDataService,
    private carRefService: CarReferenceDataService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.detectMode();
    this.initializeForms();
    this.loadCarMakes();

    if (this.mode !== 'new') {
      this.loadCustomerData();
    }
  }

  initializeForms(): void {
    // Step 1: Account Type
    this.accountTypeForm = this.fb.group({
      accountType: ['INDIVIDUAL', Validators.required]
    });

    // Step 2: Customer Info
    this.customerInfoForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone_number: ['', Validators.required],
      email: ['', [Validators.email]],
      address: [''],
      house_number: [''],
      state: [''],
      country: ['Ethiopia'],
      date_of_birth: [''],
      sex: ['']
    });

    // Step 3: Car Type
    this.carTypeForm = this.fb.group({
      car_type: ['', Validators.required]
    });

    // Step 4: Car Make
    this.carMakeForm = this.fb.group({
      car_make: ['', Validators.required]
    });

    // Step 5: Car Details
    this.carDetailsForm = this.fb.group({
      car_model: ['', Validators.required],
      year: ['', [Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      color: [''],
      mileage: ['', [Validators.min(0)]]
    });

    // Step 6: License Plate
    this.licensePlateForm = this.fb.group({
      plate_number: ['', Validators.required]
    });
  }

  detectMode(): void {
    const urlSegments = this.route.snapshot.url;
    this.customerId = this.route.snapshot.paramMap.get('id') ? parseInt(this.route.snapshot.paramMap.get('id')!) : undefined;

    if (urlSegments.some(segment => segment.path === 'edit')) {
      this.mode = 'edit';
      this.currentStep = 1; // Start at customer info
      this.adjustStepsForMode();
    } else if (urlSegments.some(segment => segment.path === 'add-vehicle')) {
      this.mode = 'add-vehicle';
      this.currentStep = 0; // Will be adjusted to show car steps only
      this.adjustStepsForMode();
    } else {
      this.mode = 'new';
    }
  }

  adjustStepsForMode(): void {
    if (this.mode === 'edit') {
      // Keep all steps but start at step 2 (index 1)
      this.totalSteps = 7;
    } else if (this.mode === 'add-vehicle') {
      // Show only car-related steps (3-6)
      this.steps = [
        { label: 'Car Type', key: 'carType' },
        { label: 'Car Make', key: 'carMake' },
        { label: 'Car Details', key: 'carDetails' },
        { label: 'License Plate', key: 'license' },
        { label: 'Complete', key: 'complete' }
      ];
      this.totalSteps = 5;
      this.currentStep = 0;
    }
  }

  loadCustomerData(): void {
    if (!this.customerId) return;

    this.customerService.getCustomer(this.customerId).subscribe({
      next: (customer) => {
        this.existingCustomer = customer;
        this.populateForms(customer);
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.errorMessage = 'Failed to load customer data';
      }
    });
  }

  populateForms(customer: any): void {
    // Populate account type (but will be disabled in edit mode)
    this.accountTypeForm.patchValue({
      accountType: customer.customer_type || 'INDIVIDUAL'
    });

    // Populate customer info
    this.customerInfoForm.patchValue({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone_number: customer.phone_number,
      email: customer.email,
      address: customer.address,
      house_number: customer.house_number,
      state: customer.state,
      country: customer.country,
      date_of_birth: customer.date_of_birth,
      sex: customer.sex
    });

    // Disable account type in edit mode
    if (this.mode === 'edit') {
      this.accountTypeForm.get('accountType')?.disable();
    }
  }

  loadCarMakes(): void {
    this.carRefService.getCarMakes().subscribe({
      next: (response) => {
        this.carMakes = response.results || response;
      },
      error: (error) => {
        console.error('Error loading car makes:', error);
      }
    });
  }

  onAccountTypeChange(): void {
    this.accountType = this.accountTypeForm.get('accountType')?.value;
  }

  selectCarType(type: string): void {
    this.carTypeForm.patchValue({ car_type: type });
  }

  selectCarMake(make: CarMake): void {
    this.selectedMake = make;
    this.carMakeForm.patchValue({ car_make: make.id });
    this.loadModelsForMake(make.id);
  }

  loadModelsForMake(makeId: number): void {
    this.carRefService.getModelsForMake(makeId).subscribe({
      next: (models) => {
        this.carModels = models;
      },
      error: (error) => {
        console.error('Error loading models:', error);
      }
    });
  }

  async captureFromCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      // Implement camera capture logic here
      // For now, just show a placeholder
      console.log('Camera stream obtained:', stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.errorMessage = 'Could not access camera. Please enter plate number manually.';
    }
  }

  submitOnboarding(): void {
    if (this.mode === 'add-vehicle') {
      this.submitAddVehicle();
    } else if (this.mode === 'edit') {
      this.submitEditCustomer();
    } else {
      this.submitNewCustomer();
    }
  }

  submitNewCustomer(): void {
    if (!this.isAllFormsValid()) {
      this.errorMessage = 'Please complete all required fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const onboardingData: IndividualOnboardingData = {
      // Customer info
      first_name: this.customerInfoForm.get('first_name')?.value,
      last_name: this.customerInfoForm.get('last_name')?.value,
      phone_number: this.customerInfoForm.get('phone_number')?.value,
      email: this.customerInfoForm.get('email')?.value,
      address: this.customerInfoForm.get('address')?.value,
      house_number: this.customerInfoForm.get('house_number')?.value,
      state: this.customerInfoForm.get('state')?.value,
      country: this.customerInfoForm.get('country')?.value,
      date_of_birth: this.customerInfoForm.get('date_of_birth')?.value,
      sex: this.customerInfoForm.get('sex')?.value,
      // Car info
      car_type: this.carTypeForm.get('car_type')?.value,
      car_make: this.carMakeForm.get('car_make')?.value,
      car_model: this.carDetailsForm.get('car_model')?.value,
      plate_number: this.licensePlateForm.get('plate_number')?.value,
      year: this.carDetailsForm.get('year')?.value,
      color: this.carDetailsForm.get('color')?.value,
      mileage: this.carDetailsForm.get('mileage')?.value
    };

    this.customerService.onboardIndividual(onboardingData).subscribe({
      next: (customer) => {
        this.createdCustomer = customer;
        this.generatedQRCode = customer.qr_code;
        this.isSubmitting = false;
        this.currentStep = this.mode === 'add-vehicle' ? 4 : 6; // Go to completion step
      },
      error: (error) => {
        console.error('Onboarding error:', error);
        this.errorMessage = error.error?.detail || 'Failed to onboard customer. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  submitEditCustomer(): void {
    if (!this.customerInfoForm.valid) {
      this.errorMessage = 'Please complete all required customer information fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const updateData = {
      first_name: this.customerInfoForm.get('first_name')?.value,
      last_name: this.customerInfoForm.get('last_name')?.value,
      phone_number: this.customerInfoForm.get('phone_number')?.value,
      email: this.customerInfoForm.get('email')?.value,
      address: this.customerInfoForm.get('address')?.value,
      house_number: this.customerInfoForm.get('house_number')?.value,
      state: this.customerInfoForm.get('state')?.value,
      country: this.customerInfoForm.get('country')?.value,
      date_of_birth: this.customerInfoForm.get('date_of_birth')?.value,
      sex: this.customerInfoForm.get('sex')?.value
    };

    // Use HTTP PATCH to update customer
    this.customerService.updateCustomer(this.customerId!, updateData).subscribe({
      next: (customer) => {
        this.createdCustomer = customer;
        this.isSubmitting = false;
        // Redirect to customer detail
        this.router.navigate(['/customers', this.customerId]);
      },
      error: (error) => {
        console.error('Update error:', error);
        this.errorMessage = error.error?.detail || 'Failed to update customer. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  submitAddVehicle(): void {
    if (!this.carTypeForm.valid || !this.carMakeForm.valid || !this.carDetailsForm.valid || !this.licensePlateForm.valid) {
      this.errorMessage = 'Please complete all required vehicle fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const carData = {
      car_type: this.carTypeForm.get('car_type')?.value,
      make: this.carMakeForm.get('car_make')?.value,
      model: this.carDetailsForm.get('car_model')?.value,
      plate_number: this.licensePlateForm.get('plate_number')?.value,
      year: this.carDetailsForm.get('year')?.value,
      color: this.carDetailsForm.get('color')?.value,
      mileage: this.carDetailsForm.get('mileage')?.value
    };

    this.customerService.addCarToCustomer(this.customerId!, carData).subscribe({
      next: (car) => {
        this.isSubmitting = false;
        // Redirect to customer detail
        this.router.navigate(['/customers', this.customerId]);
      },
      error: (error) => {
        console.error('Add vehicle error:', error);
        this.errorMessage = error.error?.detail || 'Failed to add vehicle. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  isAllFormsValid(): boolean {
    if (this.mode === 'add-vehicle') {
      return this.carTypeForm.valid &&
        this.carMakeForm.valid &&
        this.carDetailsForm.valid &&
        this.licensePlateForm.valid;
    } else if (this.mode === 'edit') {
      return this.customerInfoForm.valid;
    } else {
      return this.accountTypeForm.valid &&
        this.customerInfoForm.valid &&
        this.carTypeForm.valid &&
        this.carMakeForm.valid &&
        this.carDetailsForm.valid &&
        this.licensePlateForm.valid;
    }
  }

  finishOnboarding(): void {
    const targetId = this.createdCustomer?.id || this.customerId;
    if (targetId) {
      this.router.navigate(['/customers', targetId]);
    } else {
      this.router.navigate(['/customers']);
    }
  }

  cancelOnboarding(): void {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/customers']);
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.canGoNext()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.totalSteps && this.isStepAccessible(step)) {
      this.currentStep = step;
    }
  }

  canGoNext(): boolean {
    if (this.mode === 'add-vehicle') {
      switch (this.currentStep) {
        case 0: return this.carTypeForm.valid;
        case 1: return this.carMakeForm.valid;
        case 2: return this.carDetailsForm.valid;
        case 3: return this.licensePlateForm.valid;
        default: return false;
      }
    } else {
      switch (this.currentStep) {
        case 0: return this.accountTypeForm.valid;
        case 1: return this.customerInfoForm.valid;
        case 2: return this.carTypeForm.valid;
        case 3: return this.carMakeForm.valid;
        case 4: return this.carDetailsForm.valid;
        case 5: return this.licensePlateForm.valid;
        default: return false;
      }
    }
  }

  isStepAccessible(step: number): boolean {
    // Can only access steps that have been completed or are the next step
    for (let i = 0; i < step; i++) {
      if (!this.isStepComplete(i)) {
        return false;
      }
    }
    return true;
  }

  isStepComplete(step: number): boolean {
    if (this.mode === 'add-vehicle') {
      switch (step) {
        case 0: return this.carTypeForm.valid;
        case 1: return this.carMakeForm.valid;
        case 2: return this.carDetailsForm.valid;
        case 3: return this.licensePlateForm.valid;
        default: return true;
      }
    } else {
      switch (step) {
        case 0: return this.accountTypeForm.valid;
        case 1: return this.customerInfoForm.valid;
        case 2: return this.carTypeForm.valid;
        case 3: return this.carMakeForm.valid;
        case 4: return this.carDetailsForm.valid;
        case 5: return this.licensePlateForm.valid;
        default: return true;
      }
    }
  }

  getStepStatus(step: number): 'complete' | 'current' | 'pending' {
    if (step < this.currentStep) return 'complete';
    if (step === this.currentStep) return 'current';
    return 'pending';
  }
}
