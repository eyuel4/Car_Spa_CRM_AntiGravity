import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoyaltyService, LoyaltyTier } from '../../../core/services/loyalty.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loyalty-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './loyalty-settings.component.html'
})
export class LoyaltySettingsComponent implements OnInit {
  tiers: LoyaltyTier[] = [];
  tierForm: FormGroup;
  isEditing = false;
  selectedTierId: number | null = null;
  isLoading = false;

  constructor(
    private loyaltyService: LoyaltyService,
    private fb: FormBuilder
  ) {
    this.tierForm = this.fb.group({
      name: ['', Validators.required],
      min_points_required: [0, [Validators.required, Validators.min(0)]],
      points_multiplier: [1.0, [Validators.required, Validators.min(1.0)]],
      discount_percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadTiers();
  }

  loadTiers(): void {
    this.isLoading = true;
    this.loyaltyService.getTiers().subscribe({
      next: (data) => {
        this.tiers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tiers', err);
        this.isLoading = false;
      }
    });
  }

  selectTier(tier: LoyaltyTier): void {
    this.selectedTierId = tier.id;
    this.isEditing = true;
    this.tierForm.patchValue({
      name: tier.name,
      min_points_required: tier.min_points_required,
      points_multiplier: tier.points_multiplier,
      discount_percentage: tier.discount_percentage
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedTierId = null;
    this.tierForm.reset({
      name: '',
      min_points_required: 0,
      points_multiplier: 1.0,
      discount_percentage: 0
    });
  }

  onSubmit(): void {
    if (this.tierForm.invalid) return;

    this.isLoading = true;
    const tierData = this.tierForm.value;

    if (this.isEditing && this.selectedTierId) {
      this.loyaltyService.updateTier(this.selectedTierId, tierData).subscribe({
        next: () => {
          this.loadTiers();
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Error updating tier', err);
          this.isLoading = false;
        }
      });
    } else {
      this.loyaltyService.createTier(tierData).subscribe({
        next: () => {
          this.loadTiers();
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Error creating tier', err);
          this.isLoading = false;
        }
      });
    }
  }
}
