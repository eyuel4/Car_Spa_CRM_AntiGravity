import { Routes } from '@angular/router';
import { CouponListComponent } from './coupon-list/coupon-list.component';
import { CouponFormComponent } from './coupon-form/coupon-form.component';

export const MARKETING_ROUTES: Routes = [
    {
        path: '',
        component: CouponListComponent
    },
    {
        path: 'new',
        component: CouponFormComponent
    },
    {
        path: ':id',
        component: CouponFormComponent
    }
];
