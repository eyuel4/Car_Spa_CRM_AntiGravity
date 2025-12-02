import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Shop } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-shops-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ConfirmationModalComponent],
  templateUrl: './shops-settings.component.html',
  styles: []
})
export class ShopsSettingsComponent implements OnInit, OnDestroy {
  shops: Shop[] = [];
  private subscriptions = new Subscription();

  // Modal state
  showToggleModal = false;
  showDeleteModal = false;
  selectedShop: Shop | null = null;

  constructor(
    private router: Router,
    private tenantService: TenantService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Subscribe to shops observable for real-time updates
    this.subscriptions.add(
      this.tenantService.shops$.subscribe(shops => {
        this.shops = shops;
      })
    );

    // Load shops if not already loaded
    this.tenantService.loadShops();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  onAddShop(): void {
    this.router.navigate(['/settings/shops/new']);
  }

  onEditShop(shopId: string): void {
    this.router.navigate(['/settings/shops', shopId]);
  }

  onToggleShopStatus(shop: Shop): void {
    this.selectedShop = shop;
    this.showToggleModal = true;
  }

  confirmToggleStatus(): void {
    if (!this.selectedShop) return;

    const shop = this.selectedShop;
    const newStatus = !shop.is_active;

    this.tenantService.toggleShopActive(shop.id, newStatus).subscribe({
      next: () => {
        const messageKey = newStatus ? 'NOTIFICATIONS.SHOP_ACTIVATED' : 'NOTIFICATIONS.SHOP_DEACTIVATED';
        this.notificationService.success(this.translate.instant(messageKey));
        this.showToggleModal = false;
        this.selectedShop = null;
      },
      error: (error) => {
        console.error('Failed to toggle shop status:', error);
        this.notificationService.error(this.translate.instant('SETTINGS.SHOPS.ERROR_STATUS'));
        this.showToggleModal = false;
        this.selectedShop = null;
      }
    });
  }

  cancelToggleStatus(): void {
    this.showToggleModal = false;
    this.selectedShop = null;
  }

  onDeleteShop(shop: Shop): void {
    this.selectedShop = shop;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedShop) return;

    this.tenantService.deleteShop(this.selectedShop.id).subscribe({
      next: () => {
        this.notificationService.success(this.translate.instant('NOTIFICATIONS.SHOP_DELETED'));
        this.showDeleteModal = false;
        this.selectedShop = null;
      },
      error: (error) => {
        console.error('Failed to delete shop:', error);
        this.notificationService.error(this.translate.instant('SETTINGS.SHOPS.ERROR_DELETE'));
        this.showDeleteModal = false;
        this.selectedShop = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.selectedShop = null;
  }

  getToggleModalMessage(): string {
    if (!this.selectedShop) return '';
    const key = this.selectedShop.is_active ? 'SETTINGS.SHOPS.CONFIRM_DEACTIVATE' : 'SETTINGS.SHOPS.CONFIRM_ACTIVATE';
    return this.translate.instant(key, { name: this.selectedShop.name });
  }

  getDeleteModalMessage(): string {
    if (!this.selectedShop) return '';
    return this.translate.instant('SETTINGS.SHOPS.CONFIRM_DELETE', { name: this.selectedShop.name });
  }
}
