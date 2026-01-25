import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/models/business.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './customer-list.component.html',
  styleUrls: []
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  searchQuery = '';
  isLoading = false;
  private searchTimeout: any;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);

    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.loadCustomers();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.isLoading = true;
      this.customerService.search(this.searchQuery).subscribe({
        next: (data) => {
          this.customers = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching customers:', error);
          this.isLoading = false;
        }
      });
    }, 300);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/customers', id]);
  }

  onAddCustomer(): void {
    this.router.navigate(['/customers/onboard']);
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  }
}
