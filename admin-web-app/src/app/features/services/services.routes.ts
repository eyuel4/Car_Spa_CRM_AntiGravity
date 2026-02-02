import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./service-catalog/service-catalog.component').then(m => m.ServiceCatalogComponent)
    },
    {
        path: 'categories',
        loadComponent: () => import('./category-list/category-list.component').then(m => m.CategoryListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./service-form/service-form.component').then(m => m.ServiceFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./service-form/service-form.component').then(m => m.ServiceFormComponent)
    }
];
