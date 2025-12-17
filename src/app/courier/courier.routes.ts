import { Routes } from '@angular/router';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./courier.component').then(m => m.CourierComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.CourierDashboardComponent)
      },
      {
        path: 'available-jobs',
        loadComponent: () => import('./pages/available-jobs/available-jobs.component').then(m => m.AvailableJobsComponent)
      },
      {
        path: 'my-jobs',
        loadComponent: () => import('./pages/my-jobs/my-jobs.component').then(m => m.MyJobsComponent)
      },
      {
        path: 'earnings',
        loadComponent: () => import('./pages/earnings/earnings.component').then(m => m.EarningsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.CourierProfileComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support.component').then(m => m.CourierSupportComponent)
      },
      {
        path: 'delivery/:id',
        loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent)
      },
      // Legacy routes
      {
        path: 'jobs',
        redirectTo: 'my-jobs',
        pathMatch: 'full'
      }
    ]
  }
];
