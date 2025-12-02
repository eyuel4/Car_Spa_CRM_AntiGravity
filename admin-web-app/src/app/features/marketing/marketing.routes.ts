import { Routes } from '@angular/router';
import { MarketingOverviewComponent } from './marketing-overview/marketing-overview.component';
import { LoyaltySettingsComponent } from './loyalty-settings/loyalty-settings.component';
import { CouponsListComponent } from './coupons-list/coupons-list.component';

export const MARKETING_ROUTES: Routes = [
    {
        path: '',
        component: MarketingOverviewComponent
    },
    {
        path: 'loyalty',
        component: LoyaltySettingsComponent
    },
    {
        path: 'coupons',
        component: CouponsListComponent
    }
];
