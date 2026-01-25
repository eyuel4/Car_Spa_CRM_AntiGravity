import { Routes } from '@angular/router';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { CustomerOnboardingComponent } from './customer-onboarding/customer-onboarding.component';
import { CorporateOnboardingComponent } from './corporate-onboarding/corporate-onboarding.component';

export const CUSTOMERS_ROUTES: Routes = [
    {
        path: '',
        component: CustomerListComponent
    },
    {
        path: 'onboard',
        component: CustomerOnboardingComponent
    },
    {
        path: 'onboard/:id/edit',
        component: CustomerOnboardingComponent
    },
    {
        path: 'onboard/:id/add-vehicle',
        component: CustomerOnboardingComponent
    },
    {
        path: 'onboard-corporate',
        component: CorporateOnboardingComponent
    },
    {
        path: ':id',
        component: CustomerDetailComponent
    }
];
