import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomerDataService, Customer, SearchType } from '../../../core/services/customer-data.service';

@Component({
  selector: 'app-customer-search',
  templateUrl: './customer-search.component.html',
  styleUrls: ['./customer-search.component.css']
})
export class CustomerSearchComponent implements OnInit {
  searchControl = new FormControl('');
  searchType: SearchType = 'all';
  searchResults: Customer[] = [];
  isSearching = false;
  showResults = false;

  searchTypes: Array<{ value: SearchType, label: string, icon: string }> = [
    { value: 'all', label: 'All', icon: 'search' },
    { value: 'phone', label: 'Phone', icon: 'phone' },
    { value: 'plate', label: 'License Plate', icon: 'directions_car' },
    { value: 'name', label: 'Name', icon: 'person' },
    { value: 'qr', label: 'QR Code', icon: 'qr_code_2' }
  ];

  @Output() customerSelected = new EventEmitter<Customer>();

  constructor(private customerService: CustomerDataService) { }

  ngOnInit(): void {
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        if (query && query.trim().length > 0) {
          this.performSearch(query.trim());
        } else {
          this.searchResults = [];
          this.showResults = false;
        }
      });
  }

  performSearch(query: string): void {
    this.isSearching = true;
    this.customerService.searchCustomers(query, this.searchType).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.showResults = true;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isSearching = false;
        this.searchResults = [];
      }
    });
  }

  onSearchTypeChange(type: SearchType): void {
    this.searchType = type;
    const currentQuery = this.searchControl.value;
    if (currentQuery && currentQuery.trim().length > 0) {
      this.performSearch(currentQuery.trim());
    }
  }

  selectCustomer(customer: Customer): void {
    this.customerSelected.emit(customer);
    this.searchControl.setValue('');
    this.showResults = false;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults = [];
    this.showResults = false;
  }

  getTierBadgeClass(tierName?: string): string {
    if (!tierName) return 'tier-none';
    return `tier-${tierName.toLowerCase()}`;
  }

  getCustomerTypeIcon(type: string): string {
    return type === 'CORPORATE' ? 'business' : 'person';
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'phone': 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      'directions_car': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      'person': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'qr_code_2': 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
    };
    return icons[iconName] || icons['search'];
  }

  getCustomerIconPath(type: string): string {
    if (type === 'CORPORATE') {
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    }
    return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
  }
}
