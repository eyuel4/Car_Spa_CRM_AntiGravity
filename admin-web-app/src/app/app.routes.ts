import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
            },
            {
                path: 'operations',
                loadChildren: () => import('./features/operations/operations.routes').then(m => m.OPERATIONS_ROUTES)
            },
            {
                path: 'accounting',
                loadChildren: () => import('./features/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES)
            },
            {
                path: 'staff',
                loadChildren: () => import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES)
            },
            {
                path: 'customers',
                loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
            },
            {
                path: 'services',
                loadChildren: () => import('./features/services/services.routes').then(m => m.SERVICES_ROUTES)
            },
            {
                path: 'marketing',
                loadChildren: () => import('./features/marketing/marketing.routes').then(m => m.MARKETING_ROUTES)
            },
            {
                path: 'settings',
                loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
                canActivate: [roleGuard],
                data: { roles: ['OWNER'] }
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
