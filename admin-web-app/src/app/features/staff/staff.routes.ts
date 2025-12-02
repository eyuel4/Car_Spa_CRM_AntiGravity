import { Routes } from '@angular/router';
// Force rebuild
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffDetailComponent } from './staff-detail/staff-detail.component';

export const STAFF_ROUTES: Routes = [
    {
        path: '',
        component: StaffListComponent
    },
    {
        path: ':id',
        component: StaffDetailComponent
    }
];
