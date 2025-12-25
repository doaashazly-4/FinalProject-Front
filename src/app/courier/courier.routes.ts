import { Routes } from '@angular/router';

export const COURIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./courier.component').then(m => m.CourierComponent),
    children: [
      // الصفحة الرئيسية - Dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // UC-CAR-02: Go Online / Set Available
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.CourierDashboardComponent)
      },

      // UC-CAR-03: Receive New Assigned Order
      {
        path: 'available-jobs',
        loadComponent: () => import('./pages/available-jobs/available-jobs.component').then(m => m.AvailableJobsComponent)
      },

      // UC-CAR-03 & UC-CAR-04: My Jobs (Active/Assigned) + Accept/Reject
      {
        path: 'my-jobs',
        loadComponent: () => import('./pages/my-jobs/my-jobs.component').then(m => m.MyJobsComponent)
      },

      // UC-CAR-10: End Shift & Earnings Summary
      {
        path: 'earnings',
        loadComponent: () => import('./pages/earnings/earnings.component').then(m => m.EarningsComponent)
      },

      // UC-CAR-01: Register & Login / Profile Management
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.CourierProfileComponent)
      },

      // UC-CAR-09: Report Issue / Chat with Support
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support.component').then(m => m.CourierSupportComponent)
      },

      // UC-CAR-05 & UC-CAR-06 & UC-CAR-07: Delivery Workflow (Pick up, Navigate, Deliver, Fail)
      {
        path: 'delivery/:id',
        loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent)
      },

      // Legacy Route: Confirm Delivery (يمكن استعماله مؤقتًا أو للأجهزة القديمة)
      {
        path: 'confirm-delivery/:packageId',
        loadComponent: () =>
          import('./pages/confirm-delivery/confirm-delivery.component')
            .then(m => m.ConfirmDeliveryComponent)
      },

      // إعادة توجيه قديم
      {
        path: 'jobs',
        redirectTo: 'my-jobs',
        pathMatch: 'full'
      }
    ]
  }
];
