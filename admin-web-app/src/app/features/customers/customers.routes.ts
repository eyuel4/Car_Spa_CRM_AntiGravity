import { Routes } from '@angular/router';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';

export const CUSTOMERS_ROUTES: Routes = [
    {
        path: '',
        component: CustomerListComponent
    },
    {
        path: ':id',
        component: CustomerDetailComponent
    }
];
