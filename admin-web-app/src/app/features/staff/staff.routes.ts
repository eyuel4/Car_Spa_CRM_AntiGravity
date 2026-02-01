import { Routes } from '@angular/router';
import { StaffListComponent } from './staff-list/staff-list.component';
import { StaffDetailComponent } from './staff-detail/staff-detail.component';
import { StaffPerformanceDashboardComponent } from './staff-performance-dashboard/staff-performance-dashboard.component';

export const STAFF_ROUTES: Routes = [
    {
        path: '',
        component: StaffListComponent
    },
    {
        path: 'performance',
        component: StaffPerformanceDashboardComponent
    },
    {
        path: ':id',
        component: StaffDetailComponent
    }
];
