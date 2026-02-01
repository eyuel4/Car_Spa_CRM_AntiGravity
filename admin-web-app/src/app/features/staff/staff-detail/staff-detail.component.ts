import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationsService } from '../../../core/services/operations.service';
import { Staff, EmergencyContact, SexType } from '../../../core/models/business.model';
import { Shop } from '../../../core/models/user.model';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmationModalComponent,
    MatSnackBarModule
  ],
  templateUrl: './staff-detail.component.html',
  styleUrl: './staff-detail.component.css'
})
export class StaffDetailComponent implements OnInit {
  staffForm!: FormGroup;
  emergencyContactsFormArray!: FormArray;
  staff: Staff | null = null;
  shops: Shop[] = [];
  isNew = false;
  isLoading = false;
  saving = false;
  showSaveConfirmation = false;
  showCancelConfirmation = false;
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;
  activeTab: 'profile' | 'performance' = 'profile';
  performanceData: any = null;
  performanceYear = new Date().getFullYear();

  sexOptions: { value: SexType; label: string }[] = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
  ];

  get isOwner(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'OWNER';
  }

  get canEditHireDate(): boolean {
    return this.isOwner || this.isNew;
  }

  get canEditIsManager(): boolean {
    return this.isOwner;
  }

  get emergencyContactControls(): FormGroup[] {
    return this.emergencyContactsFormArray.controls as FormGroup[];
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private staffService: StaffService,
    private tenantService: TenantService,
    private authService: AuthService,
    private operationsService: OperationsService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  // ... (existing code)

  loadPerformanceData(staffId: number): void {
    // Fetch all completed tasks for this staff member
    this.operationsService.getAllTasks({
      staff: staffId,
      status: 'DONE',
      // Optional: Filter by year/month if backend supports date filtering on tasks. 
      // For MVP, we'll fetch all and filter in frontend or just show all-time stats + specific year filter if needed.
    }).subscribe({
      next: (tasks) => {
        this.calculatePerformanceMetrics(tasks);
      },
      error: (err) => {
        console.error('Error loading performance data:', err);
      }
    });
  }

  calculatePerformanceMetrics(tasks: any[]): void {
    // Filter by selected year if needed
    const filteredTasks = tasks.filter(t => {
      const date = new Date(t.end_time || t.created_at);
      return date.getFullYear() === this.performanceYear;
    });

    const tasksCompleted = filteredTasks.length;

    // Sum duration (assuming duration_hours is returned by serializer)
    const totalHours = filteredTasks.reduce((sum, t) => sum + (parseFloat(t.duration_hours) || 0), 0);

    const avgDuration = tasksCompleted ? totalHours / tasksCompleted : 0;

    // Group by Month for chart (Mocking chart data for now or simple table)
    const tasksByMonth = new Array(12).fill(0);
    filteredTasks.forEach(t => {
      const month = new Date(t.end_time || t.created_at).getMonth();
      tasksByMonth[month]++;
    });

    this.performanceData = {
      tasksCompleted,
      totalHours: totalHours.toFixed(1),
      avgDuration: avgDuration.toFixed(1),
      tasksByMonth,
      recentTasks: filteredTasks.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()).slice(0, 5)
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = id === 'new';

    if (this.isNew) {
      this.loadShops();
      // Add one empty emergency contact for new staff
      this.addEmergencyContact();
    } else if (id) {
      this.loadStaff(parseInt(id));
    }
  }

  initializeForm(): void {
    this.emergencyContactsFormArray = this.fb.array([]);

    this.staffForm = this.fb.group({
      // Personal Information
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      date_of_birth: [''],
      sex: [''],
      phone_number: ['', Validators.required],
      email: [''],
      address: [''],
      house_number: [''],
      state: [''],
      country: [''],

      // Management Section
      title: ['', Validators.required],
      hire_date: ['', Validators.required],
      salary: [''],
      shop_id: [''],
      is_manager: [false],

      // Emergency Contacts
      emergency_contacts: this.emergencyContactsFormArray
    });
  }

  loadShops(): void {
    this.tenantService.getShops().subscribe({
      next: (shops) => {
        this.shops = shops.filter(s => s.is_active);
      },
      error: (err) => {
        console.error('Error loading shops:', err);
      }
    });
  }

  loadStaff(id: number): void {
    this.isLoading = true;
    this.staffService.getById(id).subscribe({
      next: (staff) => {
        this.staff = staff;
        this.loadShops();
        this.populateForm(staff);
        this.loadPerformanceData(id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading staff:', err);
        this.isLoading = false;
        this.showError('Error loading staff details');
        this.router.navigate(['/staff']);
      }
    });
  }

  populateForm(staff: Staff): void {
    this.staffForm.patchValue({
      first_name: staff.first_name,
      last_name: staff.last_name,
      date_of_birth: staff.date_of_birth ? staff.date_of_birth.split('T')[0] : '',
      sex: staff.sex || '',
      phone_number: staff.phone_number,
      email: staff.email || '',
      address: staff.address || '',
      house_number: staff.house_number || '',
      state: staff.state || '',
      country: staff.country || '',
      title: staff.title,
      hire_date: staff.hire_date ? staff.hire_date.split('T')[0] : '',
      salary: staff.salary || '',
      shop_id: staff.shop?.id || '',
      is_manager: staff.is_manager || false
    });

    // Disable hire_date if not owner and not new
    if (!this.canEditHireDate) {
      this.staffForm.get('hire_date')?.disable();
    }

    // Handle photo
    if (staff.photo_url) {
      this.photoPreview = staff.photo_url;
    }

    // Load emergency contacts
    if (staff.emergency_contacts && staff.emergency_contacts.length > 0) {
      staff.emergency_contacts.forEach(contact => {
        this.addEmergencyContact(contact);
      });
    } else {
      // Add at least one empty emergency contact for new staff
      if (this.isNew) {
        this.addEmergencyContact();
      }
    }
  }

  addEmergencyContact(contact?: EmergencyContact): void {
    if (this.emergencyContactsFormArray.length >= 2) {
      this.showError('Maximum 2 emergency contacts allowed');
      return;
    }

    const contactForm = this.fb.group({
      id: [contact?.id || null],
      first_name: [contact?.first_name || '', Validators.required],
      last_name: [contact?.last_name || '', Validators.required],
      sex: [contact?.sex || ''],
      phone: [contact?.phone || '', Validators.required],
      address: [contact?.address || ''],
      state: [contact?.state || ''],
      country: [contact?.country || ''],
      relationship: [contact?.relationship || ''],
      is_primary: [contact?.is_primary || false]
    });

    this.emergencyContactsFormArray.push(contactForm);
  }

  removeEmergencyContact(index: number): void {
    this.emergencyContactsFormArray.removeAt(index);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('Image size should be less than 5MB');
        return;
      }

      this.selectedPhoto = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getInitials(): string {
    const firstName = this.staffForm.get('first_name')?.value || '';
    const lastName = this.staffForm.get('last_name')?.value || '';
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  }

  onSave(): void {
    if (this.staffForm.invalid) {
      this.markFormGroupTouched(this.staffForm);
      this.showError('Please fill in all required fields');
      return;
    }

    // Validate emergency contacts
    if (this.emergencyContactsFormArray.length === 0) {
      this.showError('At least one emergency contact is required');
      return;
    }

    for (let i = 0; i < this.emergencyContactsFormArray.length; i++) {
      const contactForm = this.emergencyContactsFormArray.at(i);
      if (contactForm.invalid) {
        this.markFormGroupTouched(contactForm as FormGroup);
        this.showError(`Please fill in all required fields for emergency contact ${i + 1}`);
        return;
      }
    }

    this.showSaveConfirmation = true;
  }

  confirmSave(): void {
    this.showSaveConfirmation = false;
    this.saving = true;

    const formValue = this.staffForm.getRawValue();
    const emergencyContacts = this.emergencyContactsFormArray.value;

    // Remove emergency_contacts from formValue since it's the FormArray reference
    const { emergency_contacts, ...staffFormData } = formValue;

    const staffData: Partial<Staff> = {
      ...staffFormData,
      emergency_contacts: emergencyContacts
    };

    if (this.isNew) {
      this.staffService.create(staffData).subscribe({
        next: (staff) => {
          // Upload photo if selected
          if (this.selectedPhoto && staff.id) {
            this.staffService.uploadPhoto(staff.id, this.selectedPhoto).subscribe({
              next: () => {
                this.saving = false;
                this.showSuccess('Staff created successfully');
                this.router.navigate(['/staff', staff.id]);
              },
              error: (err) => {
                console.error('Error uploading photo:', err);
                this.saving = false;
                this.showSuccess('Staff created but photo upload failed');
                this.router.navigate(['/staff', staff.id]);
              }
            });
          } else {
            this.saving = false;
            this.showSuccess('Staff created successfully');
            this.router.navigate(['/staff', staff.id]);
          }
        },
        error: (err) => {
          console.error('Error creating staff:', err);
          this.saving = false;
          this.showError('Error creating staff: ' + (err.error?.detail || err.message || 'Unknown error'));
        }
      });
    } else if (this.staff?.id) {
      this.staffService.update(this.staff.id, staffData).subscribe({
        next: (staff) => {
          // Upload photo if selected
          if (this.selectedPhoto) {
            this.staffService.uploadPhoto(staff.id, this.selectedPhoto).subscribe({
              next: () => {
                this.saving = false;
                this.showSuccess('Staff updated successfully');
                this.loadStaff(staff.id);
              },
              error: (err) => {
                console.error('Error uploading photo:', err);
                this.saving = false;
                this.showSuccess('Staff updated but photo upload failed');
                this.loadStaff(staff.id);
              }
            });
          } else {
            this.saving = false;
            this.showSuccess('Staff updated successfully');
            this.loadStaff(staff.id);
          }
        },
        error: (err) => {
          console.error('Error updating staff:', err);
          this.saving = false;
          this.showError('Error updating staff: ' + (err.error?.detail || err.message || 'Unknown error'));
        }
      });
    }
  }

  discardSave(): void {
    this.showSaveConfirmation = false;
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      this.showCancelConfirmation = true;
    } else {
      this.goBack();
    }
  }

  confirmCancel(): void {
    this.showCancelConfirmation = false;
    this.goBack();
  }

  keepEditing(): void {
    this.showCancelConfirmation = false;
  }

  goBack(): void {
    this.router.navigate(['/staff']);
  }

  hasUnsavedChanges(): boolean {
    // Simple check - in production, implement proper change detection
    return this.staffForm.dirty || this.selectedPhoto !== null;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl: any) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }



  onPerformanceYearChange(): void {
    if (this.staff?.id) {
      this.loadPerformanceData(this.staff.id);
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
