import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CustomerDataService, LoyaltyAdjustment } from '../../../core/services/customer-data.service';

export interface LoyaltyAdjustmentDialogData {
  customerId: number;
  customerName: string;
  currentPoints: number;
}

@Component({
  selector: 'app-loyalty-adjustment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './loyalty-adjustment-dialog.component.html',
  styleUrls: ['./loyalty-adjustment-dialog.component.css']
})
export class LoyaltyAdjustmentDialogComponent {
  adjustmentForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  transactionTypes = [
    { value: 'EARNED', label: 'Earned', icon: 'add_circle' },
    { value: 'ADJUSTMENT', label: 'Manual Adjustment', icon: 'edit' },
    { value: 'REDEEMED', label: 'Redeemed', icon: 'remove_circle' },
    { value: 'BONUS', label: 'Bonus', icon: 'card_giftcard' },
    { value: 'PENALTY', label: 'Penalty', icon: 'warning' }
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerDataService,
    public dialogRef: MatDialogRef<LoyaltyAdjustmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoyaltyAdjustmentDialogData
  ) {
    this.adjustmentForm = this.fb.group({
      points: ['', [Validators.required, Validators.pattern(/^-?\d+$/)]],
      reason: ['', Validators.required],
      transaction_type: ['ADJUSTMENT', Validators.required]
    });
  }

  get newBalance(): number {
    const points = parseInt(this.adjustmentForm.get('points')?.value || '0');
    return this.data.currentPoints + points;
  }

  get isNegativeBalance(): boolean {
    return this.newBalance < 0;
  }

  onSubmit(): void {
    if (!this.adjustmentForm.valid) {
      Object.keys(this.adjustmentForm.controls).forEach(key => {
        this.adjustmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.isNegativeBalance) {
      this.errorMessage = 'Adjustment would result in negative balance';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const adjustment: LoyaltyAdjustment = {
      points: parseInt(this.adjustmentForm.get('points')?.value),
      reason: this.adjustmentForm.get('reason')?.value,
      transaction_type: this.adjustmentForm.get('transaction_type')?.value
    };

    this.customerService.adjustLoyaltyPoints(this.data.customerId, adjustment).subscribe({
      next: (customer) => {
        this.dialogRef.close(customer);
      },
      error: (error) => {
        console.error('Adjustment error:', error);
        this.errorMessage = error.error?.detail || 'Failed to adjust points. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
