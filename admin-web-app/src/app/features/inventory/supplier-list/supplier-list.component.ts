import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Supplier } from '../../../core/models/business.model';

@Component({
    selector: 'app-supplier-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p class="text-sm text-gray-500 mt-1">Manage vendor relationships</p>
        </div>
        <div class="flex gap-2">
            <a routerLink="/inventory" class="btn btn-ghost">Back to Inventory</a>
            <a routerLink="/inventory/suppliers/new" class="btn btn-primary">Add Supplier</a>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-left py-3 px-4">Name</th>
              <th class="text-left py-3 px-4">Contact Person</th>
              <th class="text-left py-3 px-4">Contact Info</th>
              <th class="text-left py-3 px-4">Status</th>
              <th class="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let supplier of suppliers" class="hover:bg-gray-50">
              <td class="py-3 px-4 font-medium">{{ supplier.name }}</td>
              <td class="py-3 px-4 text-gray-600">{{ supplier.contact_name || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">
                <div *ngIf="supplier.email">{{ supplier.email }}</div>
                <div *ngIf="supplier.phone">{{ supplier.phone }}</div>
              </td>
              <td class="py-3 px-4">
                 <span class="badge" [ngClass]="supplier.is_active ? 'badge-success' : 'badge-ghost'">
                   {{ supplier.is_active ? 'Active' : 'Inactive' }}
                 </span>
              </td>
              <td class="py-3 px-4 text-right">
                <a [routerLink]="['/inventory/suppliers', supplier.id]" class="btn btn-sm btn-ghost text-blue-600">Edit</a>
              </td>
            </tr>
            <tr *ngIf="suppliers.length === 0 && !loading">
              <td colspan="5" class="text-center py-8 text-gray-500">No suppliers found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SupplierListComponent implements OnInit {
    suppliers: Supplier[] = [];
    loading = false;

    constructor(private inventoryService: InventoryService) { }

    ngOnInit(): void {
        this.loading = true;
        this.inventoryService.getSuppliers().subscribe({
            next: (data) => {
                this.suppliers = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading suppliers', err);
                this.loading = false;
            }
        });
    }
}
