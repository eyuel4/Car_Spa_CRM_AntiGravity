import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TenantService } from '../../../../core/services/tenant.service';
import { Shop } from '../../../../core/models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-shop-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './shop-form.component.html',
  styleUrl: './shop-form.component.css'
})
export class ShopFormComponent implements OnInit {
  shop: Partial<Shop> = {
    name: '',
    address: '',
    phone_number: '',
    email: '',
    is_active: true
  };

  isEditMode = false;
  shopId: string | null = null;
  isSubmitting = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private tenantService: TenantService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check if we're in edit mode by looking at route params
    this.shopId = this.route.snapshot.paramMap.get('id');

    if (this.shopId && this.shopId !== 'new') {
      this.isEditMode = true;
      this.loadShop(this.shopId);
    }
  }

  loadShop(id: string): void {
    this.isLoading = true;
    // Find the shop from the loaded shops list
    this.tenantService.shops$.subscribe({
      next: (shops) => {
        const shop = shops.find(s => s.id === id);
        if (shop) {
          this.shop = { ...shop };
        } else {
          this.errorMessage = 'Shop not found';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading shop:', error);
        this.errorMessage = 'Failed to load shop details';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.shop.name || this.shop.name.trim() === '') {
      this.errorMessage = 'Shop name is required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const operation$ = this.isEditMode && this.shopId
      ? this.tenantService.updateShop(this.shopId, this.shop)
      : this.tenantService.createShop(this.shop);

    operation$.subscribe({
      next: (savedShop) => {
        // Optionally set the newly created/updated shop as current
        if (!this.isEditMode) {
          this.tenantService.setCurrentShop(savedShop);
        }
        // Redirect to shops list
        this.router.navigate(['/settings/shops']);
      },
      error: (error) => {
        console.error('Error saving shop:', error);
        this.errorMessage = error.error?.message || error.error?.detail || 'Failed to save shop. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings/shops']);
  }
}
