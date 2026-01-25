import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerDataService, CorporateOnboardingData } from '../../../core/services/customer-data.service';
import { CarReferenceDataService, CarMake, CarModelSimple } from '../../../core/services/car-reference-data.service';

@Component({
  selector: 'app-corporate-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './corporate-onboarding.component.html',
  styleUrls: ['./corporate-onboarding.component.css']
})
export class CorporateOnboardingComponent implements OnInit {
  corporateForm!: FormGroup;
  carMakes: CarMake[] = [];
  carModelsMap: Map<number, CarModelSimple[]> = new Map();

  isSubmitting = false;
  errorMessage = '';
  createdCustomer?: any;

  displayedColumns: string[] = ['plate_number', 'make', 'model', 'year', 'color', 'corporate_car_id', 'actions'];

  carTypes = [
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'VAN', label: 'Van' },
    { value: 'TRUCK', label: 'Truck' },
    { value: 'COUPE', label: 'Coupe' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'WAGON', label: 'Wagon' },
    { value: 'CONVERTIBLE', label: 'Convertible' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerDataService,
    private carRefService: CarReferenceDataService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCarMakes();
  }

  initializeForm(): void {
    this.corporateForm = this.fb.group({
      // Corporate info
      company_name: ['', Validators.required],
      phone_number: ['', Validators.required],
      email: ['', [Validators.email]],
      address: [''],
      house_number: [''],
      state: [''],
      country: ['Ethiopia'],
      tin_number: [''],
      // Cars array
      cars: this.fb.array([this.createCarFormGroup()])
    });
  }

  createCarFormGroup(): FormGroup {
    return this.fb.group({
      make: [''],
      model: [''],
      make_text: [''],
      model_text: [''],
      car_type: [''],
      plate_number: ['', Validators.required],
      year: ['', [Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      color: [''],
      mileage: ['', [Validators.min(0)]],
      corporate_car_id: ['']
    });
  }

  get carsFormArray(): FormArray {
    return this.corporateForm.get('cars') as FormArray;
  }

  get carFormGroups(): FormGroup[] {
    return this.carsFormArray.controls as FormGroup[];
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

  onMakeChange(index: number, makeId: number): void {
    if (makeId) {
      this.loadModelsForMake(makeId, index);
    }
  }

  loadModelsForMake(makeId: number, index: number): void {
    this.carRefService.getModelsForMake(makeId).subscribe({
      next: (models) => {
        this.carModelsMap.set(index, models);
      },
      error: (error) => {
        console.error('Error loading models:', error);
      }
    });
  }

  getModelsForRow(index: number): CarModelSimple[] {
    return this.carModelsMap.get(index) || [];
  }

  addCar(): void {
    this.carsFormArray.push(this.createCarFormGroup());
  }

  removeCar(index: number): void {
    if (this.carsFormArray.length > 1) {
      this.carsFormArray.removeAt(index);
      this.carModelsMap.delete(index);
    }
  }

  submitOnboarding(): void {
    if (!this.corporateForm.valid) {
      this.errorMessage = 'Please complete all required fields';
      Object.keys(this.corporateForm.controls).forEach(key => {
        this.corporateForm.get(key)?.markAsTouched();
      });
      this.carsFormArray.controls.forEach(control => {
        Object.keys(control.value).forEach(key => {
          control.get(key)?.markAsTouched();
        });
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.corporateForm.value;
    const onboardingData: CorporateOnboardingData = {
      company_name: formValue.company_name,
      phone_number: formValue.phone_number,
      email: formValue.email,
      address: formValue.address,
      house_number: formValue.house_number,
      state: formValue.state,
      country: formValue.country,
      tin_number: formValue.tin_number,
      cars: formValue.cars
    };

    this.customerService.onboardCorporate(onboardingData).subscribe({
      next: (customer) => {
        this.createdCustomer = customer;
        this.isSubmitting = false;
        // Navigate to customer detail
        this.router.navigate(['/customers', customer.id]);
      },
      error: (error) => {
        console.error('Onboarding error:', error);
        this.errorMessage = error.error?.detail || 'Failed to onboard corporate customer. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  cancelOnboarding(): void {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/customers']);
    }
  }
}
