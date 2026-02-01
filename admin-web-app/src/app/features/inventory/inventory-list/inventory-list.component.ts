import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { InventoryItem } from '../../../core/models/business.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
    template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p class="text-sm text-gray-500 mt-1">Track stock levels and manage products</p>
        </div>
        <a routerLink="/inventory/new" class="btn btn-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Item
        </a>
      </div>

      <!-- Filters -->
      <div class="card p-4">
        <div class="relative">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch($event)"
            placeholder="Search products by name or SKU..."
            class="input pl-10 w-full md:w-1/3"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th class="text-left py-3 px-4">Item Details</th>
                <th class="text-left py-3 px-4">SKU</th>
                <th class="text-left py-3 px-4">Category</th>
                <th class="text-left py-3 px-4">Stock Level</th>
                <th class="text-right py-3 px-4">Cost</th>
                <th class="text-left py-3 px-4">Supplier</th>
                <th class="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let item of items" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-900">{{ item.name }}</div>
                  <div class="text-xs text-gray-500">{{ item.unit }}</div>
                </td>
                <td class="py-3 px-4 text-sm font-mono text-gray-600">{{ item.sku || '-' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ item.category || 'General' }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <span class="font-bold" [ngClass]="getStockColorClass(item)">
                      {{ item.current_stock | number:'1.0-2' }}
                    </span>
                    <span *ngIf="item.stock_status === 'LOW'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Low
                    </span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Min: {{ item.reorder_level }}</div>
                </td>
                <td class="py-3 px-4 text-right font-mono text-sm">
                  {{ item.price | currency }}
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                  {{ item.supplier_name || '-' }}
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex justify-end gap-2">
                    <a [routerLink]="['/inventory', item.id]" class="btn btn-sm btn-ghost text-blue-600 hover:text-blue-800">
                      Edit
                    </a>
                  </div>
                </td>
              </tr>
              <tr *ngIf="items.length === 0 && !loading">
                <td colspan="7" class="text-center py-8 text-gray-500">
                  No inventory items found. Add one to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div *ngIf="loading" class="p-8 text-center text-gray-500">
            Loading inventory...
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class InventoryListComponent implements OnInit {
    items: InventoryItem[] = [];
    loading = false;
    searchTerm = '';
    private searchSubject = new Subject<string>();

    constructor(private inventoryService: InventoryService) {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(term => {
            this.loadItems({ search: term });
        });
    }

    ngOnInit(): void {
        this.loadItems();
    }

    onSearch(term: string): void {
        this.searchSubject.next(term);
    }

    loadItems(filters: any = {}): void {
        this.loading = true;
        this.inventoryService.getProducts(filters).subscribe({
            next: (data) => {
                this.items = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading inventory', err);
                this.loading = false;
            }
        });
    }

    getStockColorClass(item: InventoryItem): string {
        if (item.stock_status === 'LOW') return 'text-red-600';
        if (item.stock_status === 'MEDIUM') return 'text-yellow-600';
        return 'text-green-600';
    }
}
