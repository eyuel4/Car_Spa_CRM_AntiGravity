import { Routes } from '@angular/router';
import { CouponListComponent } from './coupon-list/coupon-list.component';
import { CouponFormComponent } from './coupon-form/coupon-form.component';
import { MarketingAnalyticsComponent } from './marketing-analytics/marketing-analytics.component';
import { LoyaltySettingsComponent } from './loyalty-settings/loyalty-settings.component';
import { MarketingLayoutComponent } from './marketing-layout.component';

export const MARKETING_ROUTES: Routes = [
    {
        path: '',
        component: MarketingLayoutComponent,
        children: [
            {
                path: '',
                redirectTo: 'analytics',
                pathMatch: 'full'
            },
            {
                path: 'analytics',
                component: MarketingAnalyticsComponent
            },
            {
                path: 'coupons',
                component: CouponListComponent
            },
            {
                path: 'coupons/new',
                component: CouponFormComponent
            },
            {
                path: 'coupons/:id',
                component: CouponFormComponent
            },
            {
                path: 'loyalty',
                component: LoyaltySettingsComponent
            }
        ]
    }
];
