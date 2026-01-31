import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./accounting-overview/accounting-overview.component').then(m => m.AccountingOverviewComponent)
    },
    {
        path: 'transaction/:id',
        loadComponent: () => import('./transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
    }
];
