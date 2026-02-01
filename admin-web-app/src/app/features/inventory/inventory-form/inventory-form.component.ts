import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryService } from '../../../core/services/inventory.service';
import { Supplier } from '../../../core/models/business.model';

@Component({
    selector: 'app-inventory-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule],
    template: `
    <div class="space-y-6 max-w-4xl mx-auto">
       <div class="flex items-center gap-4">
         <a routerLink="/inventory" class="btn btn-ghost btn-square">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
         </a>
         <h1 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h1>
       </div>

       <div class="card p-6">
         <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-6">
           
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <!-- Name -->
             <div class="form-control">
               <label class="label font-medium">Product Name <span class="text-red-500">*</span></label>
               <input type="text" formControlName="name" class="input" placeholder="e.g. Wash & Wax Shampoo" />
               <div *ngIf="productForm.get('name')?.touched && productForm.get('name')?.invalid" class="text-red-500 text-xs mt-1">
                 Name is required
               </div>
             </div>

             <!-- SKU -->
             <div class="form-control">
               <label class="label font-medium">SKU (Stock Keeping Unit)</label>
               <input type="text" formControlName="sku" class="input" placeholder="e.g. CHEM-001" />
             </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <!-- Category -->
             <div class="form-control">
               <label class="label font-medium">Category</label>
               <input type="text" formControlName="category" class="input" placeholder="e.g. Chemicals, Tools" />
             </div>

             <!-- Supplier -->
             <div class="form-control">
               <label class="label font-medium">Supplier</label>
               <select formControlName="supplier" class="select select-bordered w-full">
                 <option [ngValue]="null">-- Select Supplier --</option>
                 <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
               </select>
               <div class="text-xs text-gray-400 mt-1">
                 Selection optional. Select a supplier for restocking.
               </div>
             </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
             <!-- Unit -->
             <div class="form-control">
               <label class="label font-medium">Unit <span class="text-red-500">*</span></label>
               <input type="text" formControlName="unit" class="input" placeholder="e.g. liters, pcs" />
             </div>
             
             <!-- Cost Price -->
             <div class="form-control">
                <label class="label font-medium">Cost Price</label>
                <div class="relative">
                  <span class="absolute left-3 top-3 text-gray-500">$</span>
                  <input type="number" formControlName="price" class="input pl-8" min="0" step="0.01" />
                </div>
             </div>
           </div>

           <div class="divider">Stock Settings</div>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <!-- Current Stock -->
             <div class="form-control">
               <label class="label font-medium">Current Stock</label>
               <input type="number" formControlName="current_stock" class="input" min="0" />
               <div class="text-xs text-gray-500 mt-1">
                 {{ isEditMode ? 'Adjusting this updates the total directly.' : 'Initial stock level.' }}
               </div>
             </div>

             <!-- Reorder Level -->
             <div class="form-control">
               <label class="label font-medium">Reorder Level (Min Stock)</label>
               <input type="number" formControlName="reorder_level" class="input" min="0" />
               <div class="text-xs text-gray-500 mt-1">Alters 'Low Stock' status</div>
             </div>
           </div>

           <!-- Description -->
           <div class="form-control">
             <label class="label font-medium">Description</label>
             <textarea formControlName="description" class="textarea h-24" placeholder="Product details..."></textarea>
           </div>

           <!-- Actions -->
           <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
             <button type="button" routerLink="/inventory" class="btn btn-ghost">Cancel</button>
             <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid || isSubmitting">
               {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product') }}
             </button>
           </div>

         </form>
       </div>
    </div>
  `,
    styles: []
})
export class InventoryFormComponent implements OnInit {
    productForm: FormGroup;
    isEditMode = false;
    productId: number | null = null;
    isSubmitting = false;
    suppliers: Supplier[] = [];

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.productForm = this.fb.group({
            name: ['', Validators.required],
            sku: [''],
            category: ['General'],
            unit: ['pcs', Validators.required],
            price: [0, [Validators.min(0)]],
            supplier: [null],
            current_stock: [0, [Validators.min(0)]],
            reorder_level: [10, [Validators.min(0)]],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.loadSuppliers();

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.productId = +params['id'];
                this.loadProduct(this.productId);
            }
        });
    }

    loadSuppliers(): void {
        this.inventoryService.getSuppliers().subscribe({
            next: (data) => this.suppliers = data,
            error: (err) => console.error('Failed to load suppliers', err)
        });
    }

    loadProduct(id: number): void {
        this.inventoryService.getProduct(id).subscribe({
            next: (product) => {
                this.productForm.patchValue({
                    name: product.name,
                    sku: product.sku,
                    category: product.category || 'General',
                    unit: product.unit,
                    price: product.price,
                    supplier: product.supplier,
                    current_stock: product.current_stock,
                    reorder_level: product.reorder_level,
                    description: product.description
                });
            },
            error: (err) => {
                console.error('Failed to load product', err);
                // Maybe redirect or show toast
                this.router.navigate(['/inventory']);
            }
        });
    }

    onSubmit(): void {
        if (this.productForm.invalid) return;

        this.isSubmitting = true;
        const formData = this.productForm.value;

        const request$ = this.isEditMode && this.productId
            ? this.inventoryService.updateProduct(this.productId, formData)
            : this.inventoryService.createProduct(formData);

        request$.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.router.navigate(['/inventory']);
            },
            error: (err) => {
                console.error('Error saving product', err);
                this.isSubmitting = false;
            }
        });
    }
}
