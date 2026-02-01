import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarketingService, Coupon } from '../../../core/services/marketing.service';

@Component({
    selector: 'app-coupon-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './coupon-list.component.html'
})
export class CouponListComponent implements OnInit {
    coupons: Coupon[] = [];
    filteredCoupons: Coupon[] = [];
    searchQuery = '';
    filterStatus = 'all'; // all, active, expired
    isLoading = false;

    constructor(
        private marketingService: MarketingService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadCoupons();
    }

    loadCoupons(): void {
        this.isLoading = true;
        this.marketingService.getAll().subscribe({
            next: (data) => {
                this.coupons = data;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading coupons', err);
                this.isLoading = false;
            }
        });
    }

    onSearch(): void {
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.coupons];

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.code?.toLowerCase().includes(q)
            );
        }

        if (this.filterStatus !== 'all') {
            const now = new Date();
            filtered = filtered.filter(c => {
                if (this.filterStatus === 'active') {
                    return c.is_active && (!c.valid_until || new Date(c.valid_until) >= now);
                } else if (this.filterStatus === 'expired') {
                    return c.valid_until && new Date(c.valid_until) < now;
                } else if (this.filterStatus === 'inactive') {
                    return !c.is_active;
                }
                return true;
            });
        }

        this.filteredCoupons = filtered;
    }

    onAddCoupon(): void {
        this.router.navigate(['/marketing/new']);
    }

    onEditCoupon(id: number): void {
        this.router.navigate(['/marketing', id]);
    }

    onToggleActive(coupon: Coupon): void {
        const newState = !coupon.is_active;
        this.marketingService.toggleActive(coupon.id, newState).subscribe({
            next: () => {
                coupon.is_active = newState;
                this.applyFilters();
            },
            error: (err) => console.error('Error toggling coupon', err)
        });
    }
}
