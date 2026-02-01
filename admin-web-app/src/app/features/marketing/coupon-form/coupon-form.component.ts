import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MarketingService, Coupon } from '../../../core/services/marketing.service';

@Component({
    selector: 'app-coupon-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './coupon-form.component.html'
})
export class CouponFormComponent implements OnInit {
    couponForm: FormGroup;
    isEditMode = false;
    couponId: number | null = null;
    isLoading = false;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private marketingService: MarketingService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.couponForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', [Validators.required, Validators.maxLength(20)]],
            description: [''],
            discount_type: ['PERCENTAGE', Validators.required],
            value: [0, [Validators.required, Validators.min(0)]],
            max_redemptions: [null],
            min_purchase_amount: [0],
            is_active: [true],
            valid_from: [''], // Date string
            valid_until: [''] // Date string
        });
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id'] && params['id'] !== 'new') {
                this.isEditMode = true;
                this.couponId = +params['id'];
                this.loadCoupon(this.couponId);
            } else {
                // Generate random code for new coupon
                this.couponForm.patchValue({
                    code: 'PROMO' + new Date().getFullYear()
                });
            }
        });
    }

    loadCoupon(id: number): void {
        this.isLoading = true;
        this.marketingService.getById(id).subscribe({
            next: (coupon) => {
                this.couponForm.patchValue(coupon);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading coupon', err);
                this.isLoading = false;
                // Maybe redirect or show error
            }
        });
    }

    onSubmit(): void {
        if (this.couponForm.invalid) {
            return;
        }

        this.isSubmitting = true;
        const couponData = this.couponForm.value;

        if (this.isEditMode && this.couponId) {
            this.marketingService.update(this.couponId, couponData).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.router.navigate(['/marketing']);
                },
                error: (err) => {
                    console.error('Error updating coupon', err);
                    this.isSubmitting = false;
                }
            });
        } else {
            this.marketingService.create(couponData).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.router.navigate(['/marketing']);
                },
                error: (err) => {
                    console.error('Error creating coupon', err);
                    this.isSubmitting = false;
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/marketing']);
    }
}
