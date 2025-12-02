import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { NotificationDataService } from '../../core/services/notification-data.service';
import { Shop, User } from '../../core/models/user.model';
import { SystemNotification } from '../../core/models/system-notification.model';
import { Subscription, Observable } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationComponent } from '../../shared/components/notification/notification.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, NotificationComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent implements OnInit, OnDestroy {
  userName: string = '';
  userRole: string = '';
  userInitials: string = '';
  currentShop: Shop | null = null;
  shops: Shop[] = [];

  showProfileMenu = false;
  showShopMenu = false;
  showNotifications = false;

  currentLang = 'en';
  canChangeLanguage = false;

  // Notifications
  unreadCount$: Observable<number>;
  notifications: SystemNotification[] = [];
  loadingNotifications = false;

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
    private router: Router,
    private translate: TranslateService,
    private notificationService: NotificationDataService,
    private eRef: ElementRef
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    // User Info
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.userName = user.username; // Or full name
          this.userRole = user.role;
          this.userInitials = this.getInitials(user.username);
          this.canChangeLanguage = user.role === 'OWNER';
        }
      })
    );

    // Current Shop
    this.subscriptions.add(
      this.tenantService.currentShop$.subscribe(shop => {
        this.currentShop = shop;
      })
    );

    // Shops List
    this.subscriptions.add(
      this.tenantService.shops$.subscribe(shops => {
        this.shops = shops;
      })
    );

    // Load initial data
    this.tenantService.loadShops();

    // Language setup
    this.currentLang = this.translate.currentLang || 'en';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.slice(0, 2).toUpperCase();
  }

  // Toggles
  toggleProfileMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showShopMenu = false;
    this.showNotifications = false;
  }

  toggleShopMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.showShopMenu = !this.showShopMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  toggleNotifications(event?: Event): void {
    if (event) event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showShopMenu = false;

    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  // Actions
  onShopSelect(shop: Shop): void {
    this.tenantService.setCurrentShop(shop);
    this.showShopMenu = false;
  }

  onAddNewStore(): void {
    this.router.navigate(['/settings/shops/new']);
    this.showShopMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    // Ideally save to user preferences in backend
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800';
      case 'SHOP_ADMIN': return 'bg-blue-100 text-blue-800';
      case 'STAFF': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryIcon(category: string | undefined): string {
    if (!category) return 'ℹ️';

    switch (category) {
      case 'JOB_CREATED': return '📝';
      case 'JOB_ASSIGNED': return '👤';
      case 'JOB_STARTED': return '▶️';
      case 'JOB_COMPLETED': return '✅';
      case 'JOB_CANCELLED': return '🚫';

      case 'PAYMENT_RECEIVED': return '💰';
      case 'PAYMENT_FAILED': return '❌';
      case 'INVOICE_GENERATED': return '📄';
      case 'PAYMENT_DUE': return '⏰';

      case 'LOW_STOCK': return '📉';
      case 'OUT_OF_STOCK': return '📦';
      case 'STOCK_REPLENISHED': return '🚚';

      case 'NEW_CUSTOMER': return '👋';
      case 'LOYALTY_MILESTONE': return '🏆';
      case 'LOYALTY_REWARD_EARNED': return '🎁';

      case 'SYSTEM_ALERT': return '⚠️';
      case 'SYSTEM_ERROR': return '🔥';
      case 'SYSTEM_UPDATE': return '🔄';

      default: return 'ℹ️';
    }
  }

  // Notification Actions
  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loadingNotifications = false;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.loadingNotifications = false;
      }
    });
  }

  markAsRead(notification: SystemNotification): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.is_read = true;
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.is_read = true);
    });
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showProfileMenu = false;
      this.showShopMenu = false;
      this.showNotifications = false;
    }
  }
}
