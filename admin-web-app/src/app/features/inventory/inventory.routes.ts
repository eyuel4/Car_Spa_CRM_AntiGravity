import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
    {
        path: 'suppliers',
        loadComponent: () => import('./supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
    },
    {
        path: 'suppliers/new',
        loadComponent: () => import('./supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
    },
    {
        path: 'suppliers/:id',
        loadComponent: () => import('./supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
    },
    {
        path: '',
        loadComponent: () => import('./inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
    }
];
