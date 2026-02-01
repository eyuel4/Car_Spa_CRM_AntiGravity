import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StaffService } from '../../../core/services/staff.service';
import { Staff } from '../../../core/models/business.model';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ 'STAFF.TITLE' | translate }}</h1>
          <p class="text-gray-600 mt-1">{{ 'STAFF.SUBTITLE' | translate }}</p>
        </div>
        <div class="flex gap-3">
            <button class="btn btn-secondary" (click)="onViewLeaderboard()">
                <span class="text-xl mr-2">🏆</span>
                Leaderboard
            </button>
            <button class="btn btn-primary" (click)="onAddStaff()">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            {{ 'STAFF.ADD_STAFF' | translate }}
            </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            [placeholder]="'STAFF.SEARCH_PLACEHOLDER' | translate"
            class="input-field"
          />
          <select [(ngModel)]="filterStatus" (change)="onFilterChange()" class="input-field">
            <option value="all">{{ 'STAFF.FILTERS.ALL_STAFF' | translate }}</option>
            <option value="active">{{ 'STAFF.FILTERS.ACTIVE_ONLY' | translate }}</option>
            <option value="inactive">{{ 'STAFF.FILTERS.INACTIVE_ONLY' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="card">
        <div class="flex items-center justify-center py-12">
          <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      <!-- Staff List -->
      <div *ngIf="!isLoading" class="space-y-4">
        <!-- Desktop Table -->
        <div class="hidden sm:block card overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.STAFF_MEMBER' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.ROLE' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.PHONE' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.EMAIL' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.STATUS' | translate }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'STAFF.TABLE.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let member of filteredStaff" class="hover:bg-gray-50 cursor-pointer" (click)="onViewDetail(member.id)">
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium mr-3">
                      {{ getInitials(member.first_name, member.last_name) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ member.first_name }} {{ member.last_name }}</p>
                      <p class="text-sm text-gray-500">{{ 'STAFF.ID' | translate }}: {{ member.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm">{{ member.title || '-' }}</td>
                <td class="px-4 py-3 text-sm">{{ member.phone_number || '-' }}</td>
                <td class="px-4 py-3 text-sm">{{ member.email || '-' }}</td>
                <td class="px-4 py-3">
                  <span [class]="getStatusClass(member.is_active)">
                    {{ member.is_active ? ('STAFF.STATUS.ACTIVE' | translate) : ('STAFF.STATUS.INACTIVE' | translate) }}
                  </span>
                </td>
                <td class="px-4 py-3" (click)="$event.stopPropagation()">
                  <div class="flex items-center gap-2">
                    <button (click)="onToggleActive(member)" class="text-sm text-primary-600 hover:text-primary-800">
                      {{ member.is_active ? ('STAFF.ACTIONS.DEACTIVATE' | translate) : ('STAFF.ACTIONS.ACTIVATE' | translate) }}
                    </button>
                    <button (click)="onViewDetail(member.id)" class="text-primary-600 hover:text-primary-800" title="Edit">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="sm:hidden space-y-3">
          <div *ngFor="let member of filteredStaff" class="card">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium mr-3">
                  {{ getInitials(member.first_name, member.last_name) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ member.first_name }} {{ member.last_name }}</p>
                  <p class="text-sm text-gray-600">{{ member.title || '-' }}</p>
                </div>
              </div>
              <span [class]="getStatusClass(member.is_active)">
                {{ member.is_active ? ('STAFF.STATUS.ACTIVE' | translate) : ('STAFF.STATUS.INACTIVE' | translate) }}
              </span>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
              <p *ngIf="member.phone_number">📞 {{ member.phone_number }}</p>
              <p *ngIf="member.email">📧 {{ member.email }}</p>
              <p class="text-xs text-gray-500">{{ 'STAFF.ID' | translate }}: {{ member.id }}</p>
            </div>
            <div class="mt-3 flex gap-2">
              <button (click)="onToggleActive(member)" class="btn btn-secondary flex-1">
                {{ member.is_active ? ('STAFF.ACTIONS.DEACTIVATE' | translate) : ('STAFF.ACTIONS.ACTIVATE' | translate) }}
              </button>
              <button (click)="onViewDetail(member.id)" class="btn btn-primary flex-1">
                {{ 'STAFF.ACTIONS.VIEW_DETAILS' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredStaff.length === 0" class="card">
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ 'STAFF.EMPTY.TITLE' | translate }}</h3>
            <p class="text-gray-600">{{ 'STAFF.EMPTY.SUBTITLE' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StaffListComponent implements OnInit {
  staff: Staff[] = [];
  filteredStaff: Staff[] = [];
  searchQuery = '';
  filterStatus = 'all';
  isLoading = false;

  constructor(
    private staffService: StaffService,
    private router: Router
  ) {
    console.log('StaffListComponent constructor called!');
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.staffService.getAll().subscribe({
      next: (data) => {
        this.staff = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading staff:', error);
      },
      complete: () => {
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
    let filtered = [...this.staff];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.first_name?.toLowerCase().includes(query) ||
        s.last_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone_number?.includes(query)
      );
    }

    // Apply status filter
    if (this.filterStatus !== 'all') {
      const isActive = this.filterStatus === 'active';
      filtered = filtered.filter(s => s.is_active === isActive);
    }

    this.filteredStaff = filtered;
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/staff', id]);
  }

  onViewLeaderboard(): void {
    this.router.navigate(['/staff/performance']);
  }

  onAddStaff(): void {
    this.router.navigate(['/staff', 'new']);
  }

  onToggleActive(staff: Staff): void {
    const newStatus = !staff.is_active;
    this.staffService.toggleActive(staff.id, newStatus).subscribe({
      next: (updated) => {
        staff.is_active = updated.is_active;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error toggling staff status:', error);
      }
    });
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  }

  getStatusClass(isActive: boolean): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-gray-100 text-gray-800`;
  }
}
