import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerDataService } from '../../../core/services/customer-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationsService } from '../../../core/services/operations.service';
import { Customer, Car } from '../../../core/models/business.model';
import { LoyaltyAdjustmentDialogComponent } from '../loyalty-adjustment-dialog/loyalty-adjustment-dialog.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  cars: Car[] = [];
  activeTab = 'profile';
  isLoading = false;
  loyaltyPoints = 0;
  currentTier = '';
  visitCount = 0;

  jobs: any[] = [];
  customerStats = {
    totalSpent: 0,
    visitCount: 0,
    avgTicket: 0,
    topService: '-'
  };

  tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'cars', label: 'Vehicles' },
    { id: 'history', label: 'Service History' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'loyalty', label: 'Loyalty' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private customerDataService: CustomerDataService,
    private operationsService: OperationsService, // Injected
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      const customerId = parseInt(id);
      this.loadCustomer(customerId);
      this.loadCars(customerId);
      this.loadLoyaltyInfo(customerId);
      this.loadServiceHistory(customerId); // New call
    }
  }

  // ... existing loadCustomer, loadCars, loadLoyaltyInfo ...

  loadServiceHistory(customerId: number): void {
    this.operationsService.getJobs({ customer: customerId }).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.calculateStats(jobs);
      },
      error: (err) => console.error('Error loading history', err)
    });
  }

  calculateStats(jobs: any[]): void {
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID'); // Assuming statuses
    const totalSpent = completedJobs.reduce((sum, job) => sum + (parseFloat(job.total_price) || 0), 0);
    const visitCount = completedJobs.length;

    // Simple top service logic
    const serviceMap = new Map<string, number>();
    completedJobs.forEach(job => {
      job.items?.forEach((item: any) => {
        const name = item.service?.name || item.service_name || 'Unknown';
        serviceMap.set(name, (serviceMap.get(name) || 0) + 1);
      });
    });

    let topService = '-';
    let maxCount = 0;
    serviceMap.forEach((count, name) => {
      if (count > maxCount) {
        maxCount = count;
        topService = name;
      }
    });

    this.customerStats = {
      totalSpent,
      visitCount,
      avgTicket: visitCount ? totalSpent / visitCount : 0,
      topService
    };
  }

  // ... rest of methods


  loadCustomer(id: number): void {
    this.isLoading = true;
    this.customerService.getById(id).subscribe({
      next: (data) => {
        this.customer = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.isLoading = false;
      }
    });
  }

  loadCars(customerId: number): void {
    this.customerService.getCars(customerId).subscribe({
      next: (data) => {
        this.cars = data;
      },
      error: (error) => {
        console.error('Error loading cars:', error);
      }
    });
  }

  loadLoyaltyInfo(customerId: number): void {
    this.customerDataService.getCustomer(customerId).subscribe({
      next: (data) => {
        this.loyaltyPoints = data.loyalty_points || 0;
        this.currentTier = data.current_tier_details?.tier_name || 'None';
        this.visitCount = data.visit_count || 0;
      },
      error: (error) => {
        console.error('Error loading loyalty info:', error);
      }
    });
  }

  canAdjustLoyalty(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'OWNER' || user?.role === 'SHOP_ADMIN';
  }

  onAdjustLoyalty(): void {
    if (!this.customer) return;

    const dialogRef = this.dialog.open(LoyaltyAdjustmentDialogComponent, {
      width: '500px',
      data: {
        customerId: this.customer.id,
        customerName: `${this.customer.first_name} ${this.customer.last_name}`,
        currentPoints: this.loyaltyPoints
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload loyalty info after adjustment
        this.loadLoyaltyInfo(this.customer!.id);
      }
    });
  }

  onAddVehicle(): void {
    this.router.navigate(['/customers/onboard', this.customer?.id, 'add-vehicle']);
  }

  onEditCustomer(): void {
    this.router.navigate(['/customers/onboard', this.customer?.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
