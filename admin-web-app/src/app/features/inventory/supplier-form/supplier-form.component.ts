import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';

@Component({
    selector: 'app-supplier-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    template: `
    <div class="space-y-6 max-w-2xl mx-auto">
       <div class="flex items-center gap-4">
         <a routerLink="/inventory/suppliers" class="btn btn-ghost btn-square">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
         </a>
         <h1 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit Supplier' : 'Add Supplier' }}</h1>
       </div>

       <div class="card p-6">
         <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()" class="space-y-6">
           
           <div class="form-control">
             <label class="label font-medium">Company Name <span class="text-red-500">*</span></label>
             <input type="text" formControlName="name" class="input" />
           </div>

           <div class="form-control">
             <label class="label font-medium">Contact Person</label>
             <input type="text" formControlName="contact_name" class="input" />
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="form-control">
               <label class="label font-medium">Email</label>
               <input type="email" formControlName="email" class="input" />
             </div>
             
             <div class="form-control">
               <label class="label font-medium">Phone</label>
               <input type="text" formControlName="phone" class="input" />
             </div>
           </div>

           <div class="form-control">
             <label class="label font-medium">Address</label>
             <textarea formControlName="address" class="textarea h-24"></textarea>
           </div>
            
           <div class="form-control">
             <label class="cursor-pointer label justify-start gap-4">
               <span class="label-text font-medium">Active Supplier</span>
               <input type="checkbox" formControlName="is_active" class="checkbox checkbox-primary" />
             </label>
           </div>

           <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
             <button type="button" routerLink="/inventory/suppliers" class="btn btn-ghost">Cancel</button>
             <button type="submit" class="btn btn-primary" [disabled]="supplierForm.invalid || isSubmitting">
               {{ isSubmitting ? 'Saving...' : 'Save Supplier' }}
             </button>
           </div>

         </form>
       </div>
    </div>
  `
})
export class SupplierFormComponent implements OnInit {
    supplierForm: FormGroup;
    isEditMode = false;
    supplierId: number | null = null;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.supplierForm = this.fb.group({
            name: ['', Validators.required],
            contact_name: [''],
            email: ['', [Validators.email]],
            phone: [''],
            address: [''],
            is_active: [true]
        });
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                // Need to implement getSupplier(id) in service or just pass it locally.
                // Wait, I missed getSupplier(id) in the service I wrote. I only have getSuppliers().
                // I will assume standard API allows /suppliers/id? Yes it should.
                // But the service method is missing. I should add `getSupplier` to service or just use `getSuppliers` and filter?
                // No, I should add it.
                this.isEditMode = true;
                this.supplierId = +params['id'];
                // Quick fix: I will add the method now.
                this.loadSupplier(this.supplierId);
            }
        });
    }

    loadSupplier(id: number) {
        // Assuming I'll add the method, or hack it here for now.
        // I'll add the method to the service in the next tool call because this code will compile but fail if method missing.
        // Actually, imports might fail if I use it and it's not in the type definition.
        // I'll type as 'any' for the service temporarily or just update the service first.
        // I'll update the service first in the next turn.
        // For now let's write this file assuming the method exists.
        (this.inventoryService as any).getSupplier(id).subscribe({
            next: (data: any) => this.supplierForm.patchValue(data),
            error: (err: any) => console.error(err)
        });
    }

    onSubmit(): void {
        if (this.supplierForm.invalid) return;
        this.isSubmitting = true;

        // Similarly assuming createSupplier/updateSupplier
        // I have createSupplier. I need updateSupplier.

        const obs$ = this.isEditMode && this.supplierId
            ? (this.inventoryService as any).updateSupplier(this.supplierId, this.supplierForm.value)
            : this.inventoryService.createSupplier(this.supplierForm.value);

        obs$.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.router.navigate(['/inventory/suppliers']);
            },
            error: (err: any) => {
                console.error(err);
                this.isSubmitting = false;
            }
        });
    }
}
