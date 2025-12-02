import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./service-catalog/service-catalog.component').then(m => m.ServiceCatalogComponent)
    }
];
