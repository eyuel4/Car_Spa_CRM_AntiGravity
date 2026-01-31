import { Routes } from '@angular/router';

export const OPERATIONS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./jobs-queue/jobs-queue.component').then(m => m.JobsQueueComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./job-create/job-create.component').then(m => m.JobCreateComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./job-detail/job-detail.component').then(m => m.JobDetailComponent)
    }
];
