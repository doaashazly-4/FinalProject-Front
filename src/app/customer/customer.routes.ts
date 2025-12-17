import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customer.component').then(m => m.CustomerComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'deliveries',
        loadComponent: () => import('./pages/deliveries/deliveries.component').then(m => m.DeliveriesComponent)
      },
      {
        path: 'track',
        loadComponent: () => import('./pages/track/track.component').then(m => m.CustomerTrackComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.CustomerProfileComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support.component').then(m => m.CustomerSupportComponent)
      },
      {
        path: 'otp-login',
        loadComponent: () => import('./pages/otp-login/otp-login.component').then(m => m.CustomerOTPLoginComponent)
      },
      {
        path: 'order/:id',
        loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      // Legacy routes
      {
        path: 'orders',
        redirectTo: 'deliveries',
        pathMatch: 'full'
      }
    ]
  }
];
